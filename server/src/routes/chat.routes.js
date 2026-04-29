const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { verifyToken, isAuthenticated } = require('../middlewares/auth.middleware');

router.use(verifyToken, isAuthenticated);

// جلب تاريخ المحادثة لطلب معين
router.get('/history/:requestId', chatController.getHistory);

// تحديد الرسائل كمقروءة
router.patch('/read/:requestId', chatController.markAsRead);

module.exports = router;
