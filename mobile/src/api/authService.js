import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * خدمة التوثيق (Authentication Service)
 * الدور: إدارة عمليات تسجيل الدخول، إنشاء الحساب، وحفظ التوكن.
 */

export const login = async (phone, password) => {
  try {
    const response = await api.post('/auth/login', { phone, password });
    const { token, user } = response.data.data; // تعديل: البيانات موجودة داخل حقل data
    
    // حفظ التوكن في ذاكرة الهاتف
    if (token) {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
    }
    
    return { success: true, user };
  } catch (error) {
    const message = error.response?.data?.message || 'فشل تسجيل الدخول';
    return { success: false, message };
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', {
      ...userData,
      role: 'client' // فرض دور العميل افتراضياً
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    const message = error.response?.data?.message || 'فشل إنشاء الحساب';
    return { success: false, message };
  }
};

export const logout = async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userData');
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.patch('/auth/update-profile', userData);
    return { success: true, user: response.data.data };
  } catch (error) {
    const message = error.response?.data?.message || 'فشل تحديث البيانات';
    return { success: false, message };
  }
};

export const updatePassword = async (passwordData) => {
  try {
    const response = await api.patch('/auth/change-password', passwordData);
    return { success: true };
  } catch (error) {
    const message = error.response?.data?.message || 'فشل تغيير كلمة المرور';
    return { success: false, message };
  }
};
