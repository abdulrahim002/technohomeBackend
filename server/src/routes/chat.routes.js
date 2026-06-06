const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { verifyToken, isAuthenticated } = require('../middlewares/auth.middleware');

const upload = require('../middlewares/upload.middleware');

router.use(verifyToken, isAuthenticated);

// جلب قائمة المحادثات للمستخدم
router.get('/conversations', chatController.getConversations);

// جلب تاريخ المحادثة لطلب معين أو غرفة دردشة
router.get('/history/:requestId', chatController.getHistory);
router.get('/history-with-user/:otherUserId', chatController.getHistoryWithUser);

// تحديد الرسائل كمقروءة
router.patch('/read/:identifier', chatController.markAsRead);

// رفع مرفق (صورة أو صوت) في المحادثة
router.post('/upload', upload.single('image'), chatController.uploadAttachment);

module.exports = router;
