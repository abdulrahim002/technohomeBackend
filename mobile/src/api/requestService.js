import api from './api';
import { Platform } from 'react-native';

/**
 * تشخيص المشكلة فقط (بدون حجز) - يستخدم قبل اختيار الفني
 */
export const analyzeProblem = async (data) => {
  try {
    const response = await api.post('/service-requests/analyze', data, { timeout: 25000 });
    return { success: true, data: response.data.data, timedOut: response.data.timedOut };
  } catch (error) {
    console.error('[API] analyzeProblem error:', error.response?.data || error.message);
    // حتى عند الفشل الكامل، نعيد بيانات احتياطية لتجنب تعليق الموبايل
    return {
      success: true,
      timedOut: true,
      data: {
        aiDiagnosis: {
          diagnosis: 'لم نتمكن من التواصل مع خدمة التشخيص. يمكنك المتابعة لحجز فني للمعاينة.',
          steps: ['تأكد من اتصالك بالإنترنت.', 'يمكنك حجز فني للمعاينة مباشرةً.']
        }
      }
    };
  }
};

export const createServiceRequest = async (data, imageUris = []) => {
  try {
    const formData = new FormData();

    // 1. إضافة البيانات النصية والمعرفات
    if (data.id) formData.append('id', data.id);
    formData.append('applianceType', data.applianceType);
    formData.append('brand', data.brand);
    formData.append('problemDescription', data.problemDescription);
    
    // بيانات الحجز المباشر (الفني والموعد)
    if (data.technicianId) formData.append('technicianId', data.technicianId);
    if (data.scheduledDate) formData.append('scheduledDate', data.scheduledDate);

    // إرسال التشخيص المسبق لتجنب استدعاء Gemini مرة ثانية
    if (data.preComputedDiagnosis) {
      formData.append('preComputedDiagnosis', JSON.stringify(data.preComputedDiagnosis));
    }

    // إضافة العنوان (اختياري، السيرفر سيستخدم افتراضي المدينة للمستخدم)
    if (data.cityId) {
      formData.append('serviceAddress[cityId]', data.cityId);
    }

    // إضافة الإحداثيات الجغرافية إذا وجدت
    if (data.location && data.location.coordinates) {
      formData.append('serviceAddress[location][type]', 'Point');
      formData.append('serviceAddress[location][coordinates][0]', data.location.coordinates[0]);
      formData.append('serviceAddress[location][coordinates][1]', data.location.coordinates[1]);
    }

    // 2. إضافة الصور (حتى 5 صور)
    imageUris.forEach((uri, index) => {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('images', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename || `image_${index}.jpg`,
        type: type,
      });
    });

    console.log('--- [API] Sending Unified Hybrid Request ---');
    
    // إرسال الطلب مع مهلة زمنية طويلة 40 ثانية
    const response = await api.post('/service-requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 40000 
    });

    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Request Error:', error.response?.data || error.message);
    const message = error.response?.data?.message || 'فشل في إرسال الطلب، يرجى التحقق من الاتصال';
    return { success: false, message };
  }
};

/**
 * جلب طلبات العميل
 */
export const getMyRequests = async () => {
  try {
    const response = await api.get('/service-requests/my-requests');
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: 'فشل في جلب طلباتك' };
  }
};

/**
 * إلغاء حجز الفني (إعادة الطلب لحالة التشخيص)
 */
export const cancelServiceRequest = async (requestId) => {
  try {
    const response = await api.patch(`/service-requests/${requestId}/reset-technician`);
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Cancel Request Error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'فشل في إلغاء الحجز' };
  }
};

/**
 * حذف الطلب نهائياً
 */
export const deleteServiceRequest = async (requestId) => {
  try {
    const response = await api.delete(`/service-requests/${requestId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete Request Error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'فشل في حذف الطلب' };
  }
};

/**
 * تقييم الخدمة
 */
export const submitReview = async (requestId, rating, comment) => {
  try {
    const response = await api.post(`/service-requests/${requestId}/review`, { rating, comment });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'فشل إرسال التقييم' };
  }
};
