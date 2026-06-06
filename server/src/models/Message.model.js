const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: false
  },
  chatRoomId: {
    type: String, // Format: "userIdA_userIdB" (sorted IDs)
    required: false
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
    enum: ['text', 'image', 'location', 'audio'],
    default: 'text'
  },
  audioDuration: {
    type: Number, // duration in seconds
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexing for faster history retrieval
MessageSchema.index({ serviceRequest: 1, createdAt: 1 });
MessageSchema.index({ chatRoomId: 1, createdAt: 1 });
MessageSchema.index({ sender: 1, recipient: 1 });
MessageSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Message', MessageSchema);
