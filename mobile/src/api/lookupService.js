import api from './api';

/**
 * خدمة جلب البيانات المساعدة (Lookups)
 * الدور: جلب المدن وأنواع الأجهزة من السيرفر.
 */
export const getCities = async () => {
  try {
    const response = await api.get('/service-requests/lookups/cities');
    return response.data.data.cities;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

export const getApplianceTypes = async () => {
  try {
    const response = await api.get('/service-requests/lookups/appliances');
    return response.data.data.applianceTypes;
  } catch (error) {
    console.error('Error fetching appliances:', error);
    return [];
  }
};

/**
 * جلب قائمة الماركات (ديناميكياً)
 */
export const getBrands = async () => {
  try {
    const response = await api.get('/service-requests/lookups/brands');
    return response.data.data.brands;
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
};
