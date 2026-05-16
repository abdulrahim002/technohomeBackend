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

// تحديد الرسائل كمقروءة
router.patch('/read/:identifier', chatController.markAsRead);

// رفع صورة في المحادثة
router.post('/upload', upload.single('image'), chatController.uploadImage);

module.exports = router;
