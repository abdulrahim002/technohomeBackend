//ملف نموذج المستخدم  
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
// نموذج المستخدم
const UserSchema = new mongoose.Schema({
  // Personal Information
  // معلومات العميل
  firstName: {
    type: String,
    required: [true, 'الاسم الأول مطلوب'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'اسم العائلة مطلوب'],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'الرجاء إدخال بريد إلكتروني صحيح']
  },
  phone: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'],
    select: false
  },

  // Role & Status
  role: {
    type: String,
    enum: ['customer', 'technician', 'admin'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },

  // Location (for geo-filtering)
  // الموقع (للتصفية الجغرافية)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    // خطوط الطول والعرض
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  address: {
    city: String,
    street: String,
    building: String,
    floor: String,
    apartment: String
  },

  // Profile
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'النبذة لا يمكن أن تتجاوز 500 حرف']
  },
  fcmToken: {
    type: String,
    trim: true,
    default: null
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  aiCredits: {
    type: Number,
    default: 5
  },
  lastCreditReset: {
    type: Date,
    default: Date.now
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geo-spatial queries
// الفهرس للاستعلامات الجغرافية
UserSchema.index({ location: '2dsphere' });

// Hash password before saving
// تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 8);
  ;
});

// Method to check password
// طريقة التحقق من كلمة المرور
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to create password reset token (6-digit OTP)
// طريقة إنشاء رمز إعادة تعيين كلمة المرور (OTP مكون من 6 أرقام)
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // تنتهي صلاحية التوكن بعد 10 دقائق
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Update updatedAt on save
// تحديث updatedAt عند الحفظ
UserSchema.pre('save', async function () {
  this.updatedAt = Date.now();

});

// Virtual for full name
// الاسم الكامل طريقة عمل الدالة  virtual تقوم بجمع الاسم الاول واسم العائلة  سبب استخدامها هو عدم الحاجة الى تخزين الاسم الكامل في قاعدة البيانات  

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
const User = mongoose.model('User', UserSchema);

module.exports = User;
