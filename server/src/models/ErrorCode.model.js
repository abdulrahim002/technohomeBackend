const mongoose = require('mongoose');

/**
 * موديل أكواد الأعطال (ErrorCode Model)
 * الدور: تخزين أكواد الأعطال الخاصة بكل ماركة وجهاز لتسهيل التشخيص على المستخدم.
 */
const ErrorCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'كود العطل مطلوب'],
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    required: [true, 'شرح العطل مطلوب'],
    trim: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplianceType',
    required: [true, 'نوع الجهاز مطلوب']
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'الماركة مطلوبة']
  },
  actionStep: {
    type: String,
    required: [true, 'النصيحة الأولية مطلوبة'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// تأمين عدم تكرار نفس الكود لنفس الماركة والجهاز (Data Integrity)
ErrorCodeSchema.index({ code: 1, deviceId: 1, brandId: 1 }, { unique: true });

const ErrorCode = mongoose.model('ErrorCode', ErrorCodeSchema);

module.exports = ErrorCode;
