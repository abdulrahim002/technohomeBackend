import api from './api';

/**
 * خدمة جلب وإدارة الإشعارات الخاصة بالمنصة
 * الدور: توفير دوال الاتصال بالخادم لجلب الإشعارات وتعديل حالتها كمقروءة.
 */

/**
 * جلب جميع الإشعارات الخاصة بالمستخدم الحالي
 */
export const getMyNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    if (response.data?.status === 'success') {
      return { success: true, notifications: response.data.data.notifications };
    }
    return { success: false, message: response.data?.message || 'فشل جلب الإشعارات' };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'خطأ في الاتصال بالخادم لجلب الإشعارات' 
    };
  }
};

/**
 * تعديل حالة الإشعار ليكون مقروءاً
 * @param {String} notificationId - معرف الإشعار
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    if (response.data?.status === 'success') {
      return { success: true, notification: response.data.data.notification };
    }
    return { success: false, message: response.data?.message || 'فشل تحديث الإشعار' };
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'خطأ في الاتصال بالخادم لتحديث الإشعار' 
    };
  }
};
