const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  description: {
    type: String,
    required: [true, 'يرجى كتابة تفاصيل البلاغ']
  },
  status: {
    type: String,
    enum: ['pending', 'refunded', 'rejected'],
    default: 'pending'
  },
  adminReply: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
