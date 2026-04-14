const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP.model');

/**
 * OTP Service
 * يتعامل مع توليد وحفظ والتحقق من رموز OTP
 * في وضع التطوير: يتم إرجاع الرمز في الـ API Response
 * في الإنتاج: يتم إرساله عبر SMS (يمكن ربطه لاحقاً)
 */
class OTPService {
  /**
   * توليد رمز OTP عشوائي من 6 أرقام
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * حفظ رمز OTP في قاعدة البيانات
   * - يحذف أي رمز سابق لنفس الرقم
   * - يشفر الرمز الجديد قبل الحفظ
   * - يحدد صلاحية 5 دقائق
   */
  async saveOTP(phone, otp) {
    // حذف أي رمز سابق لنفس الرقم لمنع التكرار
    await OTP.deleteMany({ phone });

    // تشفير الرمز قبل الحفظ للأمان
    const hashedOTP = await bcrypt.hash(otp, 8);

    // حفظ الرمز مع وقت الانتهاء (5 دقائق)
    await OTP.create({
      phone,
      otp: hashedOTP,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 دقائق
    });

    // طباعة الرمز في الكونسول (وضع التطوير فقط)
    console.log('--- OTP SIMULATION ---');
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`⏰ Expires: 5 minutes`);
    console.log('----------------------');
  }

  /**
   * التحقق من رمز OTP
   * - يبحث عن آخر رمز مسجل لهذا الرقم
   * - يتحقق من عدم انتهاء الصلاحية
   * - يقارن الرمز المدخل مع المشفر
   * - يحذف الرمز بعد الاستخدام الناجح
   */
  async verifyOTP(phone, otp) {
    // البحث عن آخر رمز لهذا الرقم
    const otpRecord = await OTP.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return { valid: false, message: 'لا يوجد رمز تحقق لهذا الرقم' };
    }

    // التحقق من الصلاحية
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteMany({ phone });
      return { valid: false, message: 'انتهت صلاحية رمز التحقق' };
    }

    // مقارنة الرمز المدخل مع المشفر
    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
      return { valid: false, message: 'رمز التحقق غير صحيح' };
    }

    // حذف الرمز بعد الاستخدام الناجح (استخدام واحد فقط)
    await OTP.deleteMany({ phone });

    return { valid: true, message: 'تم التحقق بنجاح' };
  }
}

module.exports = new OTPService();
