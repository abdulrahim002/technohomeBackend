// نموذج رمز التحقق (OTP Model)
const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب'],
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: [true, 'رمز التحقق مطلوب']
  },
  expiresAt: {
    type: Date,
    required: [true, 'تاريخ انتهاء الصلاحية مطلوب'],
    index: { expires: '5m' } // حذف تلقائي بعد 5 دقائق من تاريخ الإنشاء (TTL Index)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// فهرسة لتحسين سرعة الاستعلام عن آخر OTP للهاتف
OTPSchema.index({ phone: 1, createdAt: -1 });

const OTP = mongoose.model('OTP', OTPSchema);

module.exports = OTP;
