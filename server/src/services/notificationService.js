const Notification = require('../models/Notification.model');
const User = require('../models/User.model');

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

    // لاحقاً: يمكن إضافة إرسال إشعار الدفع الفوري (Push Notification) عبر خدمة כמו Firebase Cloud Messaging (FCM)
    // const user = await User.findById(recipientId);
    // if(user && user.fcmToken) {
    //    sendFCM(user.fcmToken, title, message);
    // }

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

    if(notifications.length > 0){
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
    const nearbyTechnicians = await User.find({
      role: 'technician',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates // [longitude, latitude]
          },
          $maxDistance: maxDistanceInMeters // 15 km
        }
      }
    });

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
    }
  } catch (error) {
    console.error('Notify Nearby Technicians Failed:', error);
  }
};
