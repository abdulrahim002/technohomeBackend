import api from './api';

/**
 * خدمة المحادثة (Chat Service)
 * الدور: جلب سجل الرسائل وتحديث حالة القراءة.
 */

// جلب سجل المحادثة لطلب معين
export const getChatHistory = async (requestId, page = 1) => {
  try {
    const response = await api.get(`/chat/history/${requestId}`, {
      params: { page, limit: 50 }
    });
    return { success: true, data: response.data.data.messages };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'فشل جلب الرسائل' };
  }
};

// تحديد الرسائل كمقروءة
export const markMessagesAsRead = async (requestId) => {
  try {
    await api.patch(`/chat/read/${requestId}`);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};
