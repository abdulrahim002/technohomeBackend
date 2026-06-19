const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// 1. تعريف مسارات مجلدات الرفع
// ============================================================
const uploadDir = path.join(__dirname, '../../uploads');
const userDir  = path.join(uploadDir, 'users');
const logoDir  = path.join(uploadDir, 'logos'); // [+] مجلد شعارات الماركات والأجهزة

// التأكد من وجود المجلدات (أو إنشائها إن لم تكن موجودة)
[uploadDir, userDir, logoDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================================
// 2. إعداد التخزين المحلي — صور المستخدمين (الحالي — لا يُمس)
// ============================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// فلتر الملفات العام (صور + صوت) — للاستخدام الأصلي
const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  const isAudio = file.mimetype.startsWith('audio/') ||
                  /\.(m4a|mp3|caf|wav|aac|3gp|ogg)$/i.test(file.originalname);

  if (isImage || isAudio) {
    cb(null, true);
  } else {
    cb(new Error('الرجاء رفع صور أو تسجيلات صوتية فقط!'), false);
  }
};

// الـ middleware الأصلي — لا يتغير
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// ============================================================
// [+] 3. إعداد التخزين المحلي — شعارات الماركات والأجهزة
// ============================================================
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, logoDir);
  },
  filename: function (req, file, cb) {
    // صيغة الاسم: logo-<timestamp>-<random>.<ext>
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

// فلتر صارم للشعارات: صور فقط بامتدادات محددة
const logoFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const allowedExts  = /\.(png|jpg|jpeg|webp)$/i;

  if (allowedMimes.includes(file.mimetype) && allowedExts.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('الشعار يجب أن يكون صورة بامتداد: PNG, JPG, JPEG, أو WEBP'), false);
  }
};

// [+] الـ middleware المستقل للشعارات
const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: logoFileFilter
});

// ============================================================
// [+] 4. إعداد التخزين للتشخيص الصوتي (حد أقصى 10MB وامتدادات الصوت الشائعة)
// ============================================================
const voiceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voice-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const voiceFileFilter = (req, file, cb) => {
  const isAudio = file.mimetype.startsWith('audio/') ||
                  /\.(m4a|mp3|caf|wav|aac|3gp|ogg|amr)$/i.test(file.originalname);
  if (isAudio) {
    cb(null, true);
  } else {
    cb(new Error('الرجاء رفع ملف صوتي صالح فقط!'), false);
  }
};

const uploadVoice = multer({
  storage: voiceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: voiceFileFilter
});

// ============================================================
// التصدير
// ============================================================
module.exports = upload;          // الأصلي (للاستخدامات الحالية)
module.exports.uploadLogo = uploadLogo; // [+] للشعارات فقط
module.exports.uploadVoice = uploadVoice; // [+] للتسجيلات الصوتية فقط

