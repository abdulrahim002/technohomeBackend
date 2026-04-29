const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'location'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexing for faster history retrieval
MessageSchema.index({ serviceRequest: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
