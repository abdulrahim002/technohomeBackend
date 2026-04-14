//ملف نموذج المعاملة  
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'المستخدم مطلوب']
  },
  amount: {
    type: Number,
    required: [true, 'المبلغ مطلوب']
  },
  type: {
    type: String,
    enum: ['top-up', 'commission_deduction'],
    required: [true, 'نوع المعاملة مطلوب']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  description: {
    type: String,
    trim: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
