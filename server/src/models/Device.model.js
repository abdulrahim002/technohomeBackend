//ملف نموذج الجهاز  
const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'مالك الجهاز مطلوب']
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'العلامة التجارية مطلوبة']
  },
  applianceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplianceType',
    required: [true, 'نوع الجهاز مطلوب']
  },
  modelName: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  warrantyExpiry: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [1000, 'الملاحظات لا يمكن أن تتجاوز 1000 حرف']
  },
  images: [{
    type: String
  }],
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

// Compound index to prevent duplicate devices for the same owner
DeviceSchema.index({ owner: 1, brand: 1, applianceType: 1, serialNumber: 1 });

// Update updatedAt on save
DeviceSchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

// Populate virtual for brand and appliance type
DeviceSchema.virtual('brandDetails', {
  ref: 'Brand',
  localField: 'brand',
  foreignField: '_id',
  justOne: true
});

DeviceSchema.virtual('applianceTypeDetails', {
  ref: 'ApplianceType',
  localField: 'applianceType',
  foreignField: '_id',
  justOne: true
});

const Device = mongoose.model('Device', DeviceSchema);

module.exports = Device;