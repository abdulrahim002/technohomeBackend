//ملف نموذج طلب الصيانة 
const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  // Request Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'العميل مطلوب']
  },

  // Appliance Information
  applianceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplianceType',
    required: [true, 'نوع الجهاز مطلوب']
  },
  brand: {
    type: String, // يمكن تركه كـ String أو ربطه بموديل Brand لو رغبت
    required: [true, 'ماركة الجهاز مطلوب'],
    trim: true
  },

  // Problem Description
  problemDescription: {
    type: String,
    required: [true, 'وصف المشكلة مطلوب'],
    maxlength: [1000, 'وصف المشكلة لا يمكن أن يتجاوز 1000 حرف']
  },
  images: {
    type: [String],
    default: []
  },

  // AI Diagnosis Result
  aiDiagnosis: {
    diagnosis: String,
    steps: [String]
  },

  // مصدر التشخيص (ai, manual, none)
  diagnosisType: {
    type: String,
    enum: ['ai', 'manual', 'none'],
    default: 'none'
  },

  // Booking Details
  bookingDate: {
    type: Date,
    default: Date.now // التاريخ الفعلي لإنشاء الطلب
  },
  scheduledDate: {
    type: Date
    // اختياري: يُحدد عند حجز فني
  },

  // Assigned Technician (اختياري: قد يكتفي العميل بالتشخيص دون حجز فني)
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Status
  status: {
    type: String,
    required: true,
    enum: [
      'diagnosed_only', 
      'waiting_for_confirmation', 
      'pending', 
      'accepted', 
      'on_the_way', 
      'arrived', 
      'in_progress', 
      'completed', 
      'cancelled'
    ],
    default: 'pending'
  },

  // Location
  serviceAddress: {
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City'
    },
    street: String,
    building: String,
    floor: String,
    apartment: String,
    notes: String
  },

  // Timeline
  acceptedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  finalPrice: {
    type: Number
  },
  technicianNotes: {
    type: String
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

// Index for efficient querying
ServiceRequestSchema.index({ customer: 1, status: 1 });
ServiceRequestSchema.index({ technician: 1, status: 1 });

// Update updatedAt on save
ServiceRequestSchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

const ServiceRequest = mongoose.model('ServiceRequest', ServiceRequestSchema);

module.exports = ServiceRequest;