const socketIO = require('socket.io');
const User = require('../models/User.model');
const chatService = require('./chatService');

let io;

// Map لتتبع: userId -> Set of socketIds
// يسمح بمعرفة من هو متصل حتى مع عدة أجهزة
const userSocketMap = new Map(); // userId -> Set(socketId)
const socketUserMap = new Map(); // socketId -> userId

/**
 * تهيئة Socket.io وإدارة دورة حياة الاتصالات
 */
const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('📡 Socket connected:', socket.id);

    // 1. الانضمام لغرفة المستخدم + تحديث الحالة (Online)
    // ========================================
    socket.on('registerUser', async (userId) => {
      if (!userId) return;

      socket.join(userId);
      console.log(`👤 User ${userId} joined room`);

      // ربط socketId بالـ userId
      socketUserMap.set(socket.id, userId);

      // إضافة socketId لمجموعة المستخدم
      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
      }
      userSocketMap.get(userId).add(socket.id);

      // تحديث isOnline في قاعدة البيانات
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit('userStatusChanged', { userId, isOnline: true });
        console.log(`✅ User ${userId} set to isOnline: true`);
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    });

    // ========================================
    // 2. إدارة المحادثة الفورية (Chat)
    // ========================================
    socket.on('sendMessage', async (data) => {
      const { serviceRequest, chatRoomId, recipientId, content, messageType } = data;
      const senderId = socketUserMap.get(socket.id);

      if (!senderId || !recipientId || !content) return;

      try {
        // التحقق من صلاحية الفني في مراسلة العميل
        if (serviceRequest) {
          const ServiceRequest = require('../models/ServiceRequest.model');
          const reqDoc = await ServiceRequest.findById(serviceRequest);
          if (reqDoc) {
             const isSenderTechnician = reqDoc.technician && reqDoc.technician.toString() === senderId.toString();
             if (isSenderTechnician && reqDoc.status === 'pending') {
               socket.emit('error', { message: 'لا يمكنك مراسلة العميل قبل قبول الطلب' });
               return;
             }
          }
        }

        // 1. حفظ في قاعدة البيانات (سيقوم أيضاً بإرسال Push إذا كان الطرف الآخر غير متصل بالسوكت)
        const savedMsg = await chatService.saveMessage({
          serviceRequest,
          chatRoomId,
          senderId,
          recipientId,
          content,
          messageType: messageType || 'text'
        });

        // 2. إرسال عبر السوكت للطرف الآخر (إذا كان متصلاً)
        io.to(recipientId).emit('receiveMessage', savedMsg);
        
        // 3. تأكيد الإرسال للمرسل (اختياري، لضمان وصولها للسيرفر)
        socket.emit('messageSent', savedMsg);
        
      } catch (error) {
        console.error('Chat Error:', error);
        socket.emit('error', { message: 'فشل في إرسال الرسالة' });
      }
    });

    // ========================================
    // 3. تحديث حالة القراءة (Read Receipts)
    // ========================================
    socket.on('readMessages', async (data) => {
      const { identifier, senderId } = data; // identifier is requestId or chatRoomId
      const userId = socketUserMap.get(socket.id);

      if (!userId || !identifier || !senderId) return;

      try {
        await chatService.markAsRead(identifier, userId);
        
        // إبلاغ الراسل بأن رسائله قُرئت
        io.to(senderId).emit('messagesRead', { identifier, readerId: userId });
      } catch (error) {
        console.error('Read Messages Error:', error);
      }
    });

    // ========================================
    // 4. تتبع الحالة عند الخروج للخلفية أو الفحص
    // ========================================
    socket.on('goOffline', async () => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      try {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        io.emit('userStatusChanged', { userId, isOnline: false });
        console.log(`🌙 User ${userId} manually went offline (background)`);
      } catch (error) {
        console.error('Error in goOffline:', error);
      }
    });

    socket.on('checkUserStatus', async (recipientId) => {
      if (!recipientId) return;
      try {
        const isOnline = userSocketMap.has(recipientId) && userSocketMap.get(recipientId).size > 0;
        socket.emit('userStatusChanged', { userId: recipientId, isOnline });
      } catch (error) {
        console.error('Error in checkUserStatus:', error);
      }
    });

    // ========================================
    // 2. عند قطع الاتصال — تحديث isOnline
    // ========================================
    socket.on('disconnect', async () => {
      console.log('🔌 Socket disconnected:', socket.id);

      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      // إزالة هذا socket من مجموعة المستخدم
      const sockets = userSocketMap.get(userId);
      if (sockets) {
        sockets.delete(socket.id);

        // إذا لم يتبقَ أي socket لهذا المستخدم → set isOnline: false
        if (sockets.size === 0) {
          userSocketMap.delete(userId);
          try {
            await User.findByIdAndUpdate(userId, { isOnline: false });
            io.emit('userStatusChanged', { userId, isOnline: false });
            console.log(`❌ User ${userId} set to isOnline: false (all sockets disconnected)`);
          } catch (error) {
            console.error('Error updating offline status:', error);
          }
        }
      }

      // تنظيف الخريطة
      socketUserMap.delete(socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO
};
