const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    // Can refer to ServiceRequest, Report, or an Admin ID who recharged
  },
  referenceModel: {
    type: String,
    enum: ['ServiceRequest', 'Report', 'User', 'System']
  }
}, { timestamps: true });

// Indexing for faster history lookups
TransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
