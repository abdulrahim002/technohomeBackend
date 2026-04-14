//ملف نموذج استكشاف الأخطاء وإصلاحها  
const mongoose = require('mongoose');

const DiagnosticOptionSchema = new mongoose.Schema({
  answerText: { type: String, required: true }, // e.g., 'نعم', 'لا'
  nextStepId: { type: String }, // Points to stepId of another diagnostic step
  suggestedSolution: { type: String } // Suggestion if leaf node / end of tree
});

const DiagnosticNodeSchema = new mongoose.Schema({
  stepId: { type: String, required: true }, // e.g., 'q1', 'root_question'
  question: { type: String, required: true },
  options: [DiagnosticOptionSchema]
});
const TroubleshootSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان المشكلة مطلوب'],
    trim: true
  },
  deviceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplianceType'
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },
  errorCode: {
    type: String,
    trim: true,
    index: true // للصعول على المقال المقابل للرمز بسرعة
  },
  problemDescription: {
    type: String,
    required: [true, 'وصف المشكلة مطلوب']
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  confidenceThreshold: {
    type: Number,
    default: 0.7, // نسبة الثقة المطلوبة من الذكاء الاصطناعي لتقديم هذا الحل
  },
  diagnosticSteps: [DiagnosticNodeSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

TroubleshootSchema.index({ title: 'text', problemDescription: 'text' });

const Troubleshoot = mongoose.model('Troubleshoot', TroubleshootSchema);

module.exports = Troubleshoot;
