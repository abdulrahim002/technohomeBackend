//ملف نموذج نوع الجهاز  
const mongoose = require('mongoose');

const ApplianceTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم نوع الجهاز مطلوب'],
    trim: true,
    unique: true
  },
  nameAr: {
    type: String,
    required: [true, 'اسم نوع الجهاز بالعربية مطلوب'],
    trim: true,
    unique: true
  },
  nameEn: {
    type: String,
    required: [true, 'اسم نوع الجهاز بالإنجليزية مطلوب'],
    trim: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ApplianceType = mongoose.model('ApplianceType', ApplianceTypeSchema);

module.exports = ApplianceType;
