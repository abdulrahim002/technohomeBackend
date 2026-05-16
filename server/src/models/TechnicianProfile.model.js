const mongoose = require('mongoose');
// ملف الفني
const TechnicianProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'المستخدم مطلوب'],
    unique: true
  },
  
  // Professional Information
  specialties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplianceType'
  }],
  
  brands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  }],
  
  yearsOfExperience: {
    type: Number,
    min: 0,
    default: 0
  },

  // Certificates & Documents
  certificates: [{
    type: String, // URLs to uploaded images
    default: []
  }],
  
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Availability Switch
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Admin Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Rating & Performance
  rating: {
    type: Number,
    default: 4.8,
    min: 0,
    max: 5
  },
  reliabilityScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  // سلسلة النجاح: عدد الطلبات المكتملة المتتالية بدون إلغاء أو انتهاء صلاحية
  consecutiveCompletedJobs: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const TechnicianProfile = mongoose.model('TechnicianProfile', TechnicianProfileSchema);

module.exports = TechnicianProfile;
