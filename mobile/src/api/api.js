import axios from 'axios';
import { Platform } from 'react-native';

/**
 * ملف إعداد الربط مع السيرفر (API Client)
 * الدور: تسهيل إرسال الطلبات للسيرفر وإضافة التوكن تلقائياً.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// رابط السيرفر: 
// - استخدم 10.0.2.2 لمُحاكي أندرويد
// - استخدم localhost لمُحاكي iOS
// - استخدم عنوان الـ IP الخاص بجهازك إذا كنت تجرب على هاتف حقيقي
const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/api'
  : 'http://172.20.10.4:5000/api';
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // تشخيص الـ AI قد يستغرق بعض الوقت، لذا زدنا المهلة لـ 30 ثانية
});

// هذا "Interceptor" يقوم بإضافة التوكن تلقائياً لكل طلب مرسل للسيرفر
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
