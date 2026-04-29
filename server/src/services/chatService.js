const Message = require('../models/Message.model');
const User = require('../models/User.model');
const fcmService = require('./fcmService');

class ChatService {
  /**
   * حفظ الرسالة في قاعدة البيانات وإرسال إشعار دفع إذا لزم الأمر
   */
  async saveMessage({ serviceRequest, senderId, recipientId, content, messageType }) {
    const message = await Message.create({
      serviceRequest,
      sender: senderId,
      recipient: recipientId,
      content,
      messageType
    });

    // جلب بيانات المرسل والمستقبل
    const [sender, recipient] = await Promise.all([
      User.findById(senderId).select('firstName lastName'),
      User.findById(recipientId).select('fcmToken isOnline')
    ]);

    // إذا كان المستخدم غير متصل بالسوكت، نرسل له إشعار دفع (Push Notification)
    if (recipient && recipient.fcmToken && !recipient.isOnline) {
      await fcmService.sendPushNotification(
        recipient.fcmToken,
        `رسالة جديدة من ${sender.firstName}`,
        content.length > 50 ? content.substring(0, 50) + '...' : content,
        { type: 'chat', serviceRequest: serviceRequest.toString() }
      );
    }

    return message;
  }

  /**
   * جلب تاريخ المحادثة لطلب معين
   */
  async getChatHistory(requestId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const messages = await Message.find({ serviceRequest: requestId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'firstName lastName profileImage');

    return messages.reverse(); // نعيدها مرتبة زمنياً من الأقدم للأحدث للعرض في الشات
  }

  /**
   * تحديد الرسائل كمقروءة
   */
  async markAsRead(requestId, userId) {
    await Message.updateMany(
      { serviceRequest: requestId, recipient: userId, isRead: false },
      { isRead: true }
    );
  }
}

module.exports = new ChatService();
