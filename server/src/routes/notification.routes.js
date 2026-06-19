const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken, isAuthenticated } = require('../middlewares/auth.middleware');

// حماية جميع مسارات الإشعارات للوصول الآمن فقط
router.use(verifyToken, isAuthenticated);

// جلب الإشعارات الخاصة بالمستخدم الحالي مرتبة تنازلياً
router.get('/', notificationController.getMyNotifications);

// تحديث حالة إشعار معين لجعله مقروءاً
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
