const admin = require('firebase-admin');

/**
 * إعداد وتهيئة Firebase Admin SDK
 * يستخدم القيم الموجودة في ملف .env
 */
const initializeFirebase = () => {
  try {
    // التأكد من أن التطبيق لم يتم تهيئته مسبقاً
    if (admin.apps.length === 0) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey || projectId === 'your-project-id') {
        console.warn('⚠️ Firebase Admin SDK not initialized: Missing or placeholder environment variables in .env');
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin SDK Initialized Successfully');
    }
  } catch (error) {
    console.error('❌ Firebase Initialization Error:', error.message);
  }
};

module.exports = { admin, initializeFirebase };
