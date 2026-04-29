const { admin } = require('../config/firebase');

/**
 * خدمة إرسال إشعارات الهاتف (Push Notifications)
 */
class FCMService {
  /**
   * إرسال إشعار لجهاز واحد باستخدام التوكن
   * @param {String} token - توكن FCM الخاص بالمستخدم
   * @param {String} title - عنوان الإشعار
   * @param {String} body - نص الإشعار
   * @param {Object} data - بيانات إضافية (اختياري)
   */
  async sendPushNotification(token, title, body, data = {}) {
    if (!token) return;

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // مهم لتطبيقات الموبايل
      },
      token: token,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending push notification:', error.message);
      
      // إذا كان التوكن غير صالح أو منتهي الصلاحية، يفضل تسجيل ذلك لاحقاً لمسحه
      if (error.code === 'messaging/registration-token-not-registered' || 
          error.code === 'messaging/invalid-registration-token') {
        console.warn('FCM Token is invalid or expired. User should re-login.');
      }
      
      return null;
    }
  }

  /**
   * إرسال إشعار لمجموعة من التوكنز (Batch)
   */
  async sendMulticastNotification(tokens, title, body, data = {}) {
    if (!tokens || tokens.length === 0) return;

    const message = {
      notification: { title, body },
      data,
      tokens: tokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`${response.successCount} messages were sent successfully`);
      return response;
    } catch (error) {
      console.error('Error sending multicast notification:', error.message);
      return null;
    }
  }
}

module.exports = new FCMService();
