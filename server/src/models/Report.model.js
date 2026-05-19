const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['booking', 'chat'],
    required: true,
    default: 'booking'
  },
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: false
  },
  chatRoomId: {
    type: String,
    required: false
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reported: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['no_show', 'behavior', 'bypass_commission', 'other'],
    required: [true, 'يرجى تحديد نوع المشكلة']
  },
  description: {
    type: String,
    required: [true, 'يرجى كتابة تفاصيل البلاغ']
  },
  attachment: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    required: false
  },
  resolvedAt: {
    type: Date,
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
