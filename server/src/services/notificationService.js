const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const { getIO } = require('./socketService');
const fcmService = require('./fcmService');
const expoService = require('./expoNotificationService');

/**
 * دالة مساعدة لإنشاء وإرسال الإشعارات
 * @param {Object} params - إعدادات الإشعار
 * @param {String} params.recipientId - معرف المستقبل
 * @param {String} params.senderId - معرف الراسل (اختياري)
 * @param {String} params.title - عنوان الإشعار
 * @param {String} params.message - نص الإشعار
 * @param {String} params.type - نوع الإشعار 'emergency', 'system', 'order'
 * @param {String} params.relatedId - معرف كيان مرتبط كطلب الخدمة مثلاً (اختياري)
 */
exports.createNotification = async ({ recipientId, senderId, title, message, type = 'system', relatedId }) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      title,
      message,
      type,
      relatedId
    });

    // إرسال إشعار الدفع الفوري (Push Notification)
    const recipient = await User.findById(recipientId).select('fcmToken expoPushToken');
    
    if (recipient) {
      const payload = { type, relatedId: relatedId ? relatedId.toString() : '' };

      // 1. الأولوية لـ Expo (لأننا نستخدم Expo Go حالياً)
      if (recipient.expoPushToken) {
        await expoService.sendPushNotification(recipient.expoPushToken, title, message, payload);
      } 
      
      // 2. البديل FCM (للجوالات التي لا تستخدم Expo)
      if (recipient.fcmToken) {
        await fcmService.sendPushNotification(recipient.fcmToken, title, message, payload);
      }
    }

    return notification;
  } catch (error) {
    console.error('Notification Creation Failed:', error);
    // عدم تدمير العملية الرئيسية إذا فشل الإشعار (fail-safe)
  }
};

/**
 * إرسال إشعار لجميع المديرين
 */
exports.notifyAdmins = async ({ senderId, title, message, type = 'system', relatedId }) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true });

    // إنشاء إشعار لكل مسوؤل
    const notifications = admins.map(admin => ({
      recipient: admin._id,
      sender: senderId,
      title,
      message,
      type,
      relatedId
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Notify Admins Failed:', error);
  }
};

/**
 * إرسال إشعار للفنيين القريبين جغرافياً
 */
exports.notifyNearbyTechnicians = async ({ coordinates, maxDistanceInMeters = 15000, title, message, relatedId, senderId }) => {
  try {
    console.log(`[notifyNearbyTechnicians] Searching with coordinates: [${coordinates}], radius: ${maxDistanceInMeters}m`);

    const nearbyTechnicians = await User.find({
      role: 'technician',
      isActive: true,
      isVerified: true,    // فقط الفنيين المتحققين
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates // [longitude, latitude]
          },
          $maxDistance: maxDistanceInMeters
        }
      }
    });

    console.log(`[notifyNearbyTechnicians] Found ${nearbyTechnicians.length} nearby technicians`);

    const notifications = nearbyTechnicians.map(tech => ({
      recipient: tech._id,
      sender: senderId,
      title,
      message,
      type: 'order',
      relatedId
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`[notifyNearbyTechnicians] Sent ${notifications.length} notifications`);

      // إرسال إشعارات دفع للفنيين القريبين عبر Expo
      const expoTokens = nearbyTechnicians
        .map(tech => tech.expoPushToken)
        .filter(token => token);
        
      if (expoTokens.length > 0) {
        await expoService.sendMulticastNotification(
          expoTokens,
          title,
          message,
          { type: 'order', relatedId: relatedId ? relatedId.toString() : '' }
        );
      }

      // البديل FCM
      const fcmTokens = nearbyTechnicians
        .map(tech => tech.fcmToken)
        .filter(token => token);
        
      if (fcmTokens.length > 0) {
        await fcmService.sendMulticastNotification(
          fcmTokens,
          title,
          message,
          { type: 'order', relatedId: relatedId ? relatedId.toString() : '' }
        );
      }
    }
  } catch (error) {
    console.error('Notify Nearby Technicians Failed:', error);
  }
};
