const mongoose = require('mongoose');

/**
 * نموذج الماركة (Brand Model)
 * الدور: تخزين الماركات العالمية (مثل Samsung, LG, Gree) لكي يدار بواسطة الآدمن.
 */
const BrandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم الماركة مطلوب'],
    trim: true,
    unique: true
  },
  nameAr: {
    type: String,
    required: [true, 'اسم الماركة بالعربية مطلوب'],
    trim: true,
    unique: true
  },
  nameEn: {
    type: String,
    required: [true, 'اسم الماركة بالإنجليزية مطلوب'],
    trim: true,
    unique: true
  },
  applianceTypes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplianceType'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Brand = mongoose.model('Brand', BrandSchema);

module.exports = Brand;
