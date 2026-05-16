const mongoose = require('mongoose');

/**
 * Area Schema - يمثل المناطق الفرعية (الأحياء) داخل المدينة
 * هذا الموديل يساعد في تحديد موقع الفني والعميل بدقة أكبر
 */
const AreaSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true // لسرعة البحث بـ الـ ID الثابت
  },
  nameAr: {
    type: String,
    required: [true, 'اسم المنطقة بالعربية مطلوب'],
    trim: true
  },
  nameEn: {
    type: String,
    required: [true, 'اسم المنطقة بالإنجليزية مطلوب'],
    trim: true
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Area = mongoose.model('Area', AreaSchema);

module.exports = Area;
