import api from './api';

/**
 * خدمة الفني (Technician Service)
 * الدور: إدارة المهام النشطة، تحديث الحالات، وإتمام الصيانات، وإدارة حالة الفني.
 */

// جلب بروفايل الفني (يشمل الرصيد ونقاط الموثوقية)
export const getTechnicianProfile = async () => {
  try {
    const response = await api.get('/users/technician-profile');
    return { success: true, data: response.data.data.profile };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'فشل جلب بيانات البروفايل' };
  }
};

// تحديث حالة التوفر (متصل/غير متصل)
export const toggleAvailability = async (isAvailable) => {
  try {
    const response = await api.patch('/users/technician/availability', { isAvailable });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'فشل تحديث حالة التوفر' };
  }
};

// جلب سجل المحفظة
export const getWalletHistory = async (page = 1) => {
  try {
    const response = await api.get('/users/wallet/history', { params: { page, limit: 20 } });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'فشل جلب سجل المحفظة' };
  }
};

// جلب المهام الحالية النشطة
export const getActiveJobs = async () => {
  try {
    const response = await api.get('/service-requests/technician/active');
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'فشل جلب المهام' };
  }
};

// جلب تفاصيل مهمة محددة
export const getJobDetails = async (id) => {
  try {
    const response = await api.get(`/service-requests/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'فشل جلب التفاصيل' };
  }
};

// قبول المهمة
export const acceptJob = async (id) => {
  try {
    const response = await api.patch(`/service-requests/${id}/accept`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'فشل قبول المهمة' };
  }
};

// تحديث الحالة (في الطريق، وصل، جاري العمل)
export const updateJobStatus = async (id, status) => {
  try {
    const response = await api.patch(`/service-requests/${id}/status`, { status });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'فشل تحديث الحالة' };
  }
};

// إتمام المهمة
export const completeJob = async (id, finalPrice, notes) => {
  try {
    const response = await api.patch(`/service-requests/${id}/complete`, { finalPrice, notes });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'فشل إتمام المهمة' };
  }
};

// البحث عن فنيين (للعميل)
export const discoverTechnicians = async (applianceTypeId, cityId) => {
  try {
    const response = await api.get('/service-requests/technicians/discover', {
      params: { applianceTypeId, cityId }
    });
    return response.data.data.technicians;
  } catch (error) {
    console.error('Error discovering technicians:', error);
    return [];
  }
};
