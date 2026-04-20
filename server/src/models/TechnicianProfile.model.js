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
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const TechnicianProfile = mongoose.model('TechnicianProfile', TechnicianProfileSchema);

module.exports = TechnicianProfile;
