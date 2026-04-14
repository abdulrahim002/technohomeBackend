//ملف نموذج طلب الصيانة 
const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  // Request Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'العميل مطلوب']
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'الجهاز مطلوب']
  },

  // Problem Description
  problemDescription: {
    type: String,
    required: [true, 'وصف المشكلة مطلوب'],
    maxlength: [1000, 'وصف المشكلة لا يمكن أن يتجاوز 1000 حرف']
  },

  // Error Code (for AI diagnosis)
  errorCode: {
    type: String,
    trim: true
  },
  errorCodeImage: {
    type: String // URL to the image of error code
  },

  // AI Diagnosis Result
  aiDiagnosis: {
    suggestedProblem: String,
    confidence: Number,
    suggestions: [String]
  },

  // Service Type
  serviceType: {
    type: String,
    enum: ['regular', 'emergency'],
    default: 'regular'
  },

  // Assigned Technician
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },

  // Location
  serviceLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  serviceAddress: {
    city: String,
    street: String,
    building: String,
    floor: String,
    apartment: String,
    notes: String
  },

  // Scheduling
  preferredDate: {
    type: Date
  },
  scheduledDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },

  // Pricing
  estimatedPrice: {
    type: Number,
    min: 0
  },
  finalPrice: {
    type: Number,
    min: 0
  },

  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'wallet'],
    default: 'cash'
  },

  // Technician Notes
  technicianNotes: {
    type: String,
    maxlength: [1000, 'ملاحظات الفني لا يمكن أن تتجاوز 1000 حرف']
  },

  // Customer Rating
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  customerFeedback: {
    type: String,
    maxlength: [500, 'تعليق العميل لا يمكن أن يتجاوز 500 حرف']
  },

  // Images
  images: [{
    type: String
  }],

  // Timeline
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for geo-spatial queries
ServiceRequestSchema.index({ serviceLocation: '2dsphere' });

// Index for efficient querying
ServiceRequestSchema.index({ customer: 1, status: 1 });
ServiceRequestSchema.index({ technician: 1, status: 1 });

// Update updatedAt on save
ServiceRequestSchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

// Virtual for calculating duration
ServiceRequestSchema.virtual('duration').get(function () {
  if (this.startedAt && this.completedAt) {
    return Math.round((this.completedAt - this.startedAt) / (1000 * 60)); // in minutes
  }
  return null;
});

const ServiceRequest = mongoose.model('ServiceRequest', ServiceRequestSchema);

module.exports = ServiceRequest;