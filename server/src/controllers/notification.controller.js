const Notification = require('../models/Notification.model');

/**
 * جلب إشعارات المستخدم الحالي (مرتبة من الأحدث)
 * GET /api/notifications
 * @access Private
 */
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    let query = { recipient: req.userId };

    // فلترة الإشعارات غير المقروءة فقط إذا طُلب ذلك
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .limit(50); // تحديد أقصى عدد لتحسين الأداء

    // عدد الإشعارات غير المقروءة (لعداد الـ Badge في التطبيق)
    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      isRead: false
    });

    res.status(200).json({
      status: 'success',
      data: {
        count: notifications.length,
        unreadCount,
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * تحديد إشعار كمقروء
 * PATCH /api/notifications/:id/read
 * @access Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'الإشعار غير موجود'
      });
    }

    // التأكد من أن الإشعار يخص المستخدم الحالي فقط
    if (notification.recipient.toString() !== req.userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحية للوصول لهذا الإشعار'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      status: 'success',
      message: 'تم تحديد الإشعار كمقروء',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * تحديد جميع إشعارات المستخدم كمقروءة
 * PATCH /api/notifications/read-all
 * @access Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      status: 'success',
      message: `تم تحديد ${result.modifiedCount} إشعار كمقروء`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};
