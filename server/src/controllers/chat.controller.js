const chatService = require('../services/chatService');
const { getIO } = require('../services/socketService');

exports.getHistory = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { page, limit } = req.query;
    
    // جلب التاريخ
    const messages = await chatService.getChatHistory(requestId, page, limit);
    
    res.status(200).json({ status: 'success', data: { messages } });
  } catch (error) { next(error); }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const identifier = req.params.requestId || req.params.identifier;
    await chatService.markAsRead(identifier, req.userId);
    
    // إبلاغ الطرف الآخر بالسكت
    try {
      const Message = require('../models/Message.model');
      const lastMsg = await Message.findOne({ 
        $or: [{ serviceRequest: identifier }, { chatRoomId: identifier }],
        recipient: req.userId 
      }).sort({ createdAt: -1 });

      if (lastMsg) {
        const io = getIO();
        io.to(lastMsg.sender.toString()).emit('messagesRead', { identifier, readerId: req.userId });
      }
    } catch (sError) {
      console.error('Socket broadcast failed in markAsRead:', sError);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) { next(error); }
};

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await chatService.getConversations(req.userId);
    res.status(200).json({ status: 'success', data: { conversations } });
  } catch (error) { next(error); }
};

exports.getHistoryWithUser = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;
    const { page, limit } = req.query;
    const messages = await chatService.getChatHistoryWithUser(req.userId, otherUserId, page, limit);
    res.status(200).json({ status: 'success', data: { messages } });
  } catch (error) { next(error); }
};

exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'الرجاء اختيار ملف' });

    const { recipientId, serviceRequest, chatRoomId, messageType, audioDuration } = req.body;
    const senderId = req.userId;

    // تكوين رابط الملف المرفوع
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/users/${req.file.filename}`;

    const savedMsg = await chatService.saveMessage({
      serviceRequest,
      chatRoomId,
      senderId,
      recipientId,
      content: fileUrl,
      messageType: messageType || 'image',
      audioDuration: audioDuration ? Number(audioDuration) : undefined
    });

    // إرسال عبر السوكت للطرف الآخر
    const io = getIO();
    io.to(recipientId).emit('receiveMessage', savedMsg);
    
    res.status(200).json({ status: 'success', data: { message: savedMsg } });
  } catch (error) { next(error); }
};
