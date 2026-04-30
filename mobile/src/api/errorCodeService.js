import api from './api';

/**
 * خدمة البحث عن أكواد الأعطال
 */
export const searchErrorCode = async (deviceId, brandId, code) => {
  try {
    const response = await api.get('/error-codes/search', {
      params: { deviceId, brandId, code }
    });
    return { success: true, data: response.data.data.errorCode };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'فشل الاتصال بالسيرفر' 
    };
  }
};
