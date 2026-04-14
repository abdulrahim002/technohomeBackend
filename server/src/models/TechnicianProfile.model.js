//ملف نموذج ملف الفني 
const mongoose = require('mongoose');

const TechnicianProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'المستخدم مطلوب'],
    unique: true
  },
  
  // Professional Information
  specialties: [{
    type: String,
    enum: [
      'refrigeration', 'air_conditioning', 'washing_machines', 
      'dishwashers', 'ovens', 'microwaves', 'tv_electronics',
      'small_appliances', 'general'
    ]
  }],
  specialtiesAr: [String],
  
  // Experience
  experienceYears: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Certification & Documents
  certifications: [{
    name: String,
    issuedBy: String,
    issueDate: Date,
    expiryDate: Date,
    documentUrl: String
  }],
  
  // Service Areas
  serviceAreas: [{
    city: String,
    regions: [String]
  }],
  
  // Pricing
  baseServiceFee: {
    type: Number,
    min: 0,
    default: 0
  },
  emergencyServiceFee: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending'
  },
  verificationDocuments: [{
    type: String,
    documentType: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    rejectedReason: String
  }],
  
  // Performance Metrics
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Statistics
  statistics: {
    totalRequests: {
      type: Number,
      default: 0
    },
    completedRequests: {
      type: Number,
      default: 0
    },
    cancelledRequests: {
      type: Number,
      default: 0
    }
  },
  
  // Bank Details (for payments)
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    iban: String
  },
  
  // Status
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
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
TechnicianProfileSchema.pre('save', function() {
  this.updatedAt = Date.now();
  
});

const TechnicianProfile = mongoose.model('TechnicianProfile', TechnicianProfileSchema);

module.exports = TechnicianProfile;