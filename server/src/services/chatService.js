const Message = require('../models/Message.model');
const User = require('../models/User.model');
const fcmService = require('./fcmService');
const expoService = require('./expoNotificationService');

class ChatService {
  /**
   * حفظ الرسالة في قاعدة البيانات وإرسال إشعار دفع إذا لزم الأمر
   */
  async saveMessage({ serviceRequest, chatRoomId, senderId, recipientId, content, messageType, audioDuration }) {
    const messageData = {
      sender: senderId,
      recipient: recipientId,
      content,
      messageType
    };

    if (serviceRequest) messageData.serviceRequest = serviceRequest;
    if (chatRoomId) messageData.chatRoomId = chatRoomId;
    if (audioDuration) messageData.audioDuration = audioDuration;

    const message = await Message.create(messageData);

    // جلب بيانات المرسل والمستقبل
    const [sender, recipient] = await Promise.all([
      User.findById(senderId).select('firstName lastName'),
      User.findById(recipientId).select('fcmToken expoPushToken isOnline')
    ]);

    // إرسال إشعار دفع (Push Notification) للطرف الآخر
    if (recipient) {
      // التحقق من تواجد المستلم في نفس المحادثة
      let isInSameChat = false;
      try {
        const socketService = require('./socketService');
        const identifier = serviceRequest || chatRoomId;
        if (socketService.isUserInChat && socketService.isUserInChat(recipientId.toString(), senderId.toString(), identifier ? identifier.toString() : null)) {
          isInSameChat = true;
          console.log(`[Push Notification] Skipped for user ${recipientId} because they are in the same chat screen with user ${senderId}`);
        }
      } catch (err) {
        console.error('Error checking active chat status:', err);
      }

      if (!isInSameChat) {
        const title = `رسالة جديدة من ${sender.firstName}`;
        
        // تحسين نص الإشعار إذا كانت الرسالة صورة أو تسجيلاً صوتياً
        let body = content;
        if (messageType === 'image') {
          body = 'أرسل لك صورة 📷';
        } else if (messageType === 'audio') {
          body = 'أرسل لك تسجيلاً صوتياً 🎙️';
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

        // 1. إرسال عبر Expo (الأولوية)
        if (recipient.expoPushToken) {
          await expoService.sendPushNotification(recipient.expoPushToken, title, body, payload);
        }

        // 2. إرسال عبر FCM (البديل)
        if (recipient.fcmToken) {
          await fcmService.sendPushNotification(recipient.fcmToken, title, body, payload);
        }
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
      
      // تحسين النص المعروض في قائمة المحادثات حسب نوع الرسالة
      let lastMessageContent;
      if (conv.lastMessage.messageType === 'image') {
        lastMessageContent = '📷 صورة';
      } else if (conv.lastMessage.messageType === 'audio') {
        lastMessageContent = '🎙️ رسالة صوتية';
      } else {
        lastMessageContent = conv.lastMessage.content;
      }


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

  async getChatHistoryWithUser(userId, otherUserId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'firstName lastName profileImage');

    return messages.reverse();
  }
}

module.exports = new ChatService();
