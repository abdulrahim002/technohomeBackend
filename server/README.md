# 🏠 Techno Home - Backend API

منصة متكاملة لخدمات صيانة الأجهزة المنزلية

## 📋 نظرة عامة

**Techno Home** هو تطبيق متكامل يربط بين العملاء والفنيين المتخصصين لتوفير خدمات صيانة الأجهزة المنزلية بكفاءة عالية.

### المميزات الرئيسية:
- ✅ نظام تسجيل وتسجيل دخول آمن باستخدام JWT
- ✅ إدارة الأجهزة والعلامات التجارية
- ✅ طلبات صيانة مع تشخيص أولي
- ✅ نظام البحث عن فنيين قريبين (Geo-filtering)
- ✅ تقييم الخدمات وإدارة الأداء
- ✅ لوحة تحكم إدارية شاملة

---

## 🏗️ البنية المعمارية

```
server/
├── src/
│   ├── models/           # نماذج قاعدة البيانات (MongoDB Schemas)
│   ├── controllers/      # معالجات الطلبات (Business Logic)
│   ├── routes/           # مسارات API
│   ├── middlewares/      # البرامج الوسيطة (Authentication, Error Handling)
│   ├── utils/            # أدوات مساعدة
│   └── server.js         # ملف الخادم الرئيسي
├── .env                  # متغيرات البيئة
├── package.json          # المكتبات المستخدمة
└── README.md             # هذا الملف
```

---

## 🗂️ نماذج البيانات (Models)

### 1. **User** (المستخدم)
- معلومات شخصية (اسم، بريد، هاتف)
- دور المستخدم (عميل، فني، مدير)
- الموقع الجغرافي (للفنيين)
- حالة التحقق والتفعيل

### 2. **Device** (الجهاز)
- البراند والنوع
- رقم الجهاز (Serial Number)
- تاريخ الشراء والضمان
- صور الجهاز

### 3. **Brand** (العلامة التجارية)
- معلومات العلامة التجارية
- الأجهزة المدعومة

### 4. **ApplianceType** (نوع الجهاز)
- المشاكل الشائعة
- الفئة (مطبخ، غسيل، تبريد، إلخ)

### 5. **ServiceRequest** (طلب الصيانة)
- وصف المشكلة
- نوع الخدمة (عادي، طوارئ)
- حالة الطلب
- التقييم والتعليقات

### 6. **TechnicianProfile** (ملف الفني)
- التخصص والخبرة
- المستندات والشهادات
- ساعات العمل
- التقييمات والإحصائيات

---

## 🔐 نظام المصادقة والتفويض

### أنواع المستخدمين:
1. **Customer** (العميل) - يمكنه إضافة أجهزة وطلب صيانة
2. **Technician** (الفني) - يمكنه تقديم خدمات بعد التحقق
3. **Admin** (الإدارة) - إدارة النظام والموارد

### التفويض (RBAC):
جميع الروتس محمية باستخدام JWT Token والصلاحيات المناسبة

---

## 📡 واجهات API الرئيسية

### Authentication (المصادقة)
```
POST   /api/auth/register          - تسجيل حساب جديد
POST   /api/auth/login             - تسجيل الدخول
GET    /api/auth/me                - الحصول على بيانات المستخدم
POST   /api/auth/change-password   - تغيير كلمة المرور
```

### Users (المستخدمون)
```
GET    /api/users/profile                    - الملف الشخصي
PATCH  /api/users/profile                    - تحديث الملف
PATCH  /api/users/location                   - تحديث الموقع
GET    /api/users/technician-profile         - ملف الفني
PATCH  /api/users/technician-profile         - تحديث ملف الفني
POST   /api/users/upload-documents           - رفع المستندات
```

### Devices (الأجهزة)
```
GET    /api/devices                - جميع أجهزة المستخدم
GET    /api/devices/:id            - تفاصيل جهاز معين
POST   /api/devices                - إضافة جهاز جديد
PATCH  /api/devices/:id            - تحديث الجهاز
DELETE /api/devices/:id            - حذف الجهاز
```

### Brands (العلامات التجارية)
```
GET    /api/brands                 - جميع العلامات التجارية
GET    /api/brands/:id             - تفاصيل العلامة
POST   /api/brands                 - إنشاء علامة (مدير فقط)
PATCH  /api/brands/:id             - تحديث العلامة (مدير فقط)
DELETE /api/brands/:id             - حذف العلامة (مدير فقط)
```

### Service Requests (طلبات الصيانة)
```
GET    /api/service-requests/my-requests                - طلباتي
GET    /api/service-requests/:id                        - تفاصيل الطلب
POST   /api/service-requests                            - إنشاء طلب صيانة
PATCH  /api/service-requests/:id                        - تحديث الطلب
POST   /api/service-requests/:id/cancel                 - إلغاء الطلب
POST   /api/service-requests/:id/rate                   - تقييم الخدمة
GET    /api/service-requests/find-technicians           - البحث عن فنيين قريبين
```

### Admin Dashboard (لوحة التحكم)
```
GET    /api/admin/users                           - جميع المستخدمين
POST   /api/admin/users/:userId/toggle-status     - تفعيل/تعطيل حساب
GET    /api/admin/technicians/pending             - طلبات الفنيين المعلقة
POST   /api/admin/technicians/:id/approve         - الموافقة على فني
POST   /api/admin/technicians/:id/reject          - رفض طلب فني
GET    /api/admin/service-requests                - جميع طلبات الصيانة
GET    /api/admin/statistics                      - الإحصائيات
POST   /api/admin/appliance-types                 - إنشاء نوع جهاز
GET    /api/admin/appliance-types                 - جميع الأنواع
```

---

## 🚀 التثبيت والتشغيل

### المتطلبات:
- Node.js v14+
- MongoDB v4.4+
- npm أو yarn

### خطوات التثبيت:

1. **استنساخ المشروع**
```bash
cd server
```

2. **تثبيت المكتبات**
```bash
npm install
```

3. **إعداد متغيرات البيئة**
```bash
# أنشئ ملف .env بالمتغيرات التالية:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/technohome
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

4. **تشغيل الخادم**
```bash
# للتطوير (مع reload تلقائي)
npm run dev

# للإنتاج
npm start
```

5. **اختبار الخادم**
```bash
curl http://localhost:5000/api/health
```

---

## 📚 معايير الكود

### معايير التسمية:
- **ملفات النماذج**: `User.model.js` (PascalCase)
- **ملفات المتحكمات**: `auth.controller.js` (camelCase)
- **ملفات المسارات**: `auth.routes.js` (camelCase)
- **المتغيرات**: `camelCase`
- **الثوابت**: `UPPER_SNAKE_CASE`

### المعايير العامة:
- استخدام `async/await` للعمليات غير المتزامنة
- معالجة الأخطاء المناسبة مع رسائل واضحة بالعربية
- التعليقات والتوثيق (JSDoc)
- فصل الـ Business Logic عن Routes

---

## 🔒 الأمان

### تم تطبيق:
- ✅ **JWT Authentication** - توثيق آمن
- ✅ **Bcryptjs** - تشفير كلمات المرور
- ✅ **Helmet** - حماية HTTP Headers
- ✅ **CORS** - التحكم في الوصول
- ✅ **Role-Based Access Control** - نظام الصلاحيات
- ✅ **Input Validation** - التحقق من المدخلات
- ✅ **Error Handling** - معالجة الأخطاء بشكل آمن

---

## 🗄️ قاعدة البيانات

### الاتصال:
```javascript
MongoDB URI: mongodb://localhost:27017/technohome
```

### الفهارس:
- `User`: location (للبحث الجغرافي)
- `ServiceRequest`: location, customer+status, technician+status
- `Device`: owner (للبحث السريع)

---

## 📝 متغيرات البيئة

```env
# الخادم
PORT=5000
NODE_ENV=development

# قاعدة البيانات
MONGODB_URI=mongodb://localhost:27017/technohome

# المصادقة
JWT_SECRET=technohome_secret_key_2024
JWT_EXPIRE=7d
```

---

## 🛠️ أدوات التطوير

المكتبات المستخدمة:
- **express** - إطار عمل الويب
- **mongoose** - نمذجة قاعدة البيانات
- **jsonwebtoken** - إنشاء وتحقق من التوكنات
- **bcryptjs** - تشفير كلمات المرور
- **dotenv** - إدارة متغيرات البيئة
- **cors** - التحكم في الوصول
- **helmet** - أمان HTTP Headers
- **morgan** - تسجيل الطلبات
- **express-validator** - التحقق من المدخلات

---

## 📞 الدعم والمساهمة

للأسئلة أو الاقتراحات، يرجى التواصل مع فريق التطوير.

---

## 📄 الترخيص

جميع الحقوق محفوظة © 2024 Techno Home