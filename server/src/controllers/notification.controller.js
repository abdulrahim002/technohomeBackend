const Notification = require('../models/Notification.model');

/**
 * جلب جميع الإشعارات الخاصة بالمستخدم الحالي
 * GET /api/notifications
 */
exports.getMyNotifications = async (req, res, next) => {
  try {
    // جلب الإشعارات التي يكون فيها المستخدم الحالي هو المستقبل (recipient)
    // وترتيبها تنازلياً من الأحدث إلى الأقدم بناءً على createdAt
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: {
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * تحديث حالة الإشعار واعتباره مقروءاً
 * PATCH /api/notifications/:id/read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;

    // البحث عن الإشعار والتحقق من أنه يخص المستخدم الحالي لضمان الحماية
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'الإشعار غير موجود أو لا تملك صلاحية الوصول إليه'
      });
    }

    // تحديث حالة القراءة
    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث حالة الإشعار بنجاح',
      data: {
        notification
      }
    });
  } catch (error) {
    next(error);
  }
};
