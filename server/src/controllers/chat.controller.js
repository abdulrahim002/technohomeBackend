const chatService = require('../services/chatService');

exports.getHistory = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { page, limit } = req.query;
    
    const messages = await chatService.getChatHistory(requestId, page, limit);
    
    // بمجرد فتح الشات، نحدد الرسائل كمقروءة لهذا المستخدم
    await chatService.markAsRead(requestId, req.userId);
    
    res.status(200).json({ status: 'success', data: { messages } });
  } catch (error) { next(error); }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await chatService.markAsRead(req.params.requestId, req.userId);
    res.status(200).json({ status: 'success' });
  } catch (error) { next(error); }
};
