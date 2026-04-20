// ملف نموذج المدينة
// يمثل المدن الليبية في النظام
const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم المدينة مطلوب'],
    trim: true,
    unique: true
  },
  nameAr: {
    type: String,
    required: [true, 'اسم المدينة بالعربية مطلوب'],
    trim: true
  },
  nameEn: {
    type: String,
    required: [true, 'اسم المدينة بالإنجليزية مطلوب'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
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
CitySchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

const City = mongoose.model('City', CitySchema);

module.exports = City;