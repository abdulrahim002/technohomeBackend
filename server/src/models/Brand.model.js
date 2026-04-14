//ملف نموذج العلامة التجارية
const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم العلامة التجارية مطلوب'],
    trim: true,
    unique: true
  },
  nameAr: {
    type: String,
    required: [true, 'اسم العلامة التجارية بالعربية مطلوب'],
    trim: true
  },
  nameEn: {
    type: String,
    required: [true, 'اسم العلامة التجارية بالإنجليزية مطلوب'],
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    maxlength: [500, 'الوصف لا يمكن أن يتجاوز 500 حرف']
  },
  country: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  supportedAppliances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplianceType'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update updatedAt on save

BrandSchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

const Brand = mongoose.model('Brand', BrandSchema);

module.exports = Brand;