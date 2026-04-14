const socketIO = require('socket.io');
const User = require('../models/User.model');

let io;

/**
 * تهيئة Socket.io وإدارة دورة حياة الاتصالات
 */
const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*', // في الإنتاج يجب تحديد النطاق
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('📡 New connection:', socket.id);

    // الانضمام لغرفة خاصة بالمستخدم (باستخدام معرفه) لسحب التنبيهات لاحقاً
    socket.on('join', async (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`👤 User ${userId} joined their private room`);
        
        // تحديث حالة "متصل" في قاعدة البيانات
        try {
          await User.findByIdAndUpdate(userId, { isOnline: true });
          // بث تحديث لجميع المتصلين (اختياري، حسب الحاجة)
          io.emit('userStatusUpdate', { userId, isOnline: true });
        } catch (error) {
          console.error('Error updating online status:', error);
        }
      }
    });

    // عند انقطاع الاتصال
    socket.on('disconnect', async () => {
      console.log('🔌 Socket disconnected:', socket.id);
      
      // ملاحظة: هنا نحتاج لآلية لمعرفة أي مستخدم الذي انقطع اتصاله 
      // سنقوم بتحسين هذا لاحقاً باستخدام تخزين مؤقت (Map) لمعرفات السوكت
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
