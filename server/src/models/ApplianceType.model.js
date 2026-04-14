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
    trim: true
  },
  nameEn: {
    type: String,
    required: [true, 'اسم نوع الجهاز بالإنجليزية مطلوب'],
    trim: true
  },
  icon: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    maxlength: [500, 'الوصف لا يمكن أن يتجاوز 500 حرف']
  },
  category: {
    type: String,
    enum: ['kitchen', 'laundry', 'cooling', 'heating', 'entertainment', 'cleaning', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  commonProblems: [{
    problem: String,
    description: String
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
ApplianceTypeSchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

const ApplianceType = mongoose.model('ApplianceType', ApplianceTypeSchema);

module.exports = ApplianceType;