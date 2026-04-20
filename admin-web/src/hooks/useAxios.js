import axios from 'axios';

const useAxios = () => {
  // استخدام مفتاح مخصص للويب الإداري لتجنب التصادم مع تطبيقات أخرى
  const token = localStorage.getItem('techno_admin_token');

  const instance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // إضافة معالج للأخطاء مع تنظيف الجلسة تلقائياً في حالة 401 أو 403
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Unauthorized access - clearing admin session');
        localStorage.removeItem('techno_admin_token');
        localStorage.removeItem('techno_admin_user');
        // يمكن إضافة تحويل لصفحة تسجيل الدخول هنا مستقبلاً
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default useAxios;
