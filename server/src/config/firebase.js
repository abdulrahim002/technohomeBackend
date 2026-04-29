const admin = require('firebase-admin');

/**
 * إعداد وتهيئة Firebase Admin SDK
 * يستخدم القيم الموجودة في ملف .env
 */
const initializeFirebase = () => {
  try {
    // التأكد من أن التطبيق لم يتم تهيئته مسبقاً
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // استبدال الرموز لضمان قراءة المفتاح الخاص بشكل صحيح
          privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
        }),
      });
      console.log('✅ Firebase Admin SDK Initialized Successfully');
    }
  } catch (error) {
    console.error('❌ Firebase Initialization Error:', error.message);
  }
};

module.exports = { admin, initializeFirebase };
