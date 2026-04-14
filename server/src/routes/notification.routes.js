const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken, isAuthenticated } = require('../middlewares/auth.middleware');

// جميع مسارات الإشعارات محمية بالتوثيق
router.use(verifyToken, isAuthenticated);

// GET /api/notifications — جلب إشعارات المستخدم الحالي
// يدعم query param ?unreadOnly=true لجلب غير المقروءة فقط
router.get('/', notificationController.getMyNotifications);

// PATCH /api/notifications/read-all — تحديد جميع الإشعارات كمقروءة
// ⚠️ هذا المسار يجب أن يكون قبل المسار /:id/read لتجنب التعارض
router.patch('/read-all', notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read — تحديد إشعار واحد كمقروء
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
