const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true,
    unique: true // One review per request
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { timestamps: true });

// Static method to calculate average rating
ReviewSchema.statics.calcAverageRating = async function(techId) {
  const stats = await this.aggregate([
    { $match: { technician: techId } },
    {
      $group: {
        _id: '$technician',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  const TechnicianProfile = mongoose.model('TechnicianProfile');
  if (stats.length > 0) {
    await TechnicianProfile.findOneAndUpdate({ user: techId }, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].nRating
    });
  } else {
    await TechnicianProfile.findOneAndUpdate({ user: techId }, {
      rating: 5,
      reviewCount: 0
    });
  }
};

// Call calcAverageRating after save
ReviewSchema.post('save', async function() {
  await this.constructor.calcAverageRating(this.technician);
});

module.exports = mongoose.model('Review', ReviewSchema);
