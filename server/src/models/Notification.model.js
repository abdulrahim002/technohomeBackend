const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'المستقبل مطلوب']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Could be null if sent by System
  },
  title: {
    type: String,
    required: [true, 'عنوان الإشعار مطلوب'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'نص الإشعار مطلوب']
  },
  type: {
    type: String,
    enum: ['emergency', 'system', 'order'],
    default: 'system'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  // Related entity ID for deep linking (e.g., ServiceRequest ID)
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL Index: This will automatically delete the notification after 30 days of creation.
    // مخصص لتحسين الأداء وتفريغ المساحة وعدم تراكم الإشعارات في قاعدة البيانات
    expires: '30d' 
  }
});

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
