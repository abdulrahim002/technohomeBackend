const Message = require('../models/Message.model');
const User = require('../models/User.model');
const fcmService = require('./fcmService');
const expoService = require('./expoNotificationService');

class ChatService {
  /**
   * حفظ الرسالة في قاعدة البيانات وإرسال إشعار دفع إذا لزم الأمر
   */
  async saveMessage({ serviceRequest, chatRoomId, senderId, recipientId, content, messageType }) {
    const messageData = {
      sender: senderId,
      recipient: recipientId,
      content,
      messageType
    };

    if (serviceRequest) messageData.serviceRequest = serviceRequest;
    if (chatRoomId) messageData.chatRoomId = chatRoomId;

    const message = await Message.create(messageData);

    // جلب بيانات المرسل والمستقبل
    const [sender, recipient] = await Promise.all([
      User.findById(senderId).select('firstName lastName'),
      User.findById(recipientId).select('fcmToken expoPushToken isOnline')
    ]);

    // إرسال إشعار دفع (Push Notification) للطرف الآخر
    if (recipient) {
      const title = `رسالة جديدة من ${sender.firstName}`;
      
      // تحسين نص الإشعار إذا كانت الرسالة صورة
      let body = content;
      if (messageType === 'image') {
        body = 'أرسل لك صورة 📷';
      } else {
        body = content.length > 50 ? content.substring(0, 50) + '...' : content;
      }
      
      const payload = { 
        type: 'chat', 
        senderId: senderId.toString(),
        senderName: `${sender.firstName} ${sender.lastName}`,
        serviceRequest: serviceRequest ? serviceRequest.toString() : '',
        chatRoomId: chatRoomId || '',
        content: body
      };

      // إرسال الإشعار دائماً لضمان وصول التنبيه حتى لو كان التطبيق مفتوحاً على شاشة أخرى
      // 1. إرسال عبر Expo (الأولوية)
      if (recipient.expoPushToken) {
        await expoService.sendPushNotification(recipient.expoPushToken, title, body, payload);
      }

      // 2. إرسال عبر FCM (البديل)
      if (recipient.fcmToken) {
        await fcmService.sendPushNotification(recipient.fcmToken, title, body, payload);
      }
    }

    return message;
  }

  /**
   * جلب تاريخ المحادثة لطلب معين أو لغرفة دردشة معينة
   */
  async getChatHistory(identifier, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const query = identifier.length > 20 ? { serviceRequest: identifier } : { chatRoomId: identifier };
    
    // إذا كان المعرف يبدو كـ chatRoomId (يحتوي على _) أو requestId (ObjectId طويل)
    const finalQuery = identifier.includes('_') ? { chatRoomId: identifier } : { serviceRequest: identifier };

    const messages = await Message.find(finalQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'firstName lastName profileImage');

    return messages.reverse(); 
  }

  /**
   * تحديد الرسائل كمقروءة
   */
  async markAsRead(identifier, userId) {
    const query = identifier.includes('_') ? { chatRoomId: identifier } : { serviceRequest: identifier };
    await Message.updateMany(
      { ...query, recipient: userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * جلب قائمة المحادثات للمستخدم
   */
  async getConversations(userId) {
    const mongoose = require('mongoose');
    const uId = new mongoose.Types.ObjectId(userId);

    // نستخدم التجميع (Aggregation) لجلب آخر رسالة من كل محادثة
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: uId }, { recipient: uId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $ifNull: ["$chatRoomId", false] },
              "$chatRoomId",
              "$serviceRequest"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ["$recipient", uId] },
                  { $eq: ["$isRead", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    // تعبئة بيانات الطرف الآخر لكل محادثة
    const populatedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherUserId = conv.lastMessage.sender.toString() === userId.toString() 
        ? conv.lastMessage.recipient 
        : conv.lastMessage.sender;
      
      const otherUser = await User.findById(otherUserId).select('firstName lastName profileImage');
      
      // تحسين النص المعروض في قائمة المحادثات للصور
      const lastMessageContent = conv.lastMessage.messageType === 'image' 
        ? 'أرسل صورة 📷' 
        : conv.lastMessage.content;

      return {
        id: conv._id,
        lastMessage: lastMessageContent,
        lastMessageTime: conv.lastMessage.createdAt,
        unreadCount: conv.unreadCount,
        otherUser
      };
    }));

    return populatedConversations;
  }
}

module.exports = new ChatService();
