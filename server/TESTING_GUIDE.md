# 🧪 دليل اختبار Backend - Techno Home

دليل شامل لاختبار جميع APIs باستخدام Postman أو Thunder Client

---

## 📋 المحتويات
1. [الإعداد الأساسي](#الإعداد-الأساسي)
2. [ترتيب الاختبار](#ترتيب-الاختبار)
3. [اختبارات Authentication](#اختبارات-authentication)
4. [اختبارات Users](#اختبارات-users)
5. [اختبارات Devices](#اختبارات-devices)
6. [اختبارات Service Requests](#اختبارات-service-requests)
7. [اختبارات Admin](#اختبارات-admin)
8. [البيانات المسبقة المطلوبة](#البيانات-المسبقة-المطلوبة)

---

## 🔧 الإعداد الأساسي

### المتطلبات:
- ✅ MongoDB مشغل على `127.0.0.1:27017`
- ✅ Backend مشغل على `http://localhost:5000`
- ✅ Postman أو Thunder Client مثبت

### خطوات التشغيل:
```bash
cd server
npm run dev
```

**ستظهر الرسالة:**
```
✅ Connected to MongoDB successfully
🚀 Server running on port 5000
🌍 Environment: development
```

### إعدادات Postman:
1. أنشئ Collection جديدة باسم "Techno Home Testing"
2. في Environment، أضف المتغير:
   - `base_url` = `http://localhost:5000`
   - `token` = (ستملأه بعد تسجيل الدخول)

---

## 📌 ترتيب الاختبار (خطوة بخطوة)

```
1️⃣ اختبر صحة الخادم (Health Check)
   ↓
2️⃣ تسجيل حساب عميل جديد (Register Customer)
   ↓
3️⃣ تسجيل حساب فني جديد (Register Technician)
   ↓
4️⃣ تسجيل دخول عميل (Login)
   ↓
5️⃣ انسخ التوكن من الاستجابة
   ↓
6️⃣ اختبر جميع User APIs (محمية)
   ↓
7️⃣ اختبر Brand APIs (عام + محمي)
   ↓
8️⃣ اختبر Device APIs (محمي)
   ↓
9️⃣ اختبر Service Request APIs (محمي)
   ↓
🔟 اختبر Admin APIs (محمي بصلاحية Admin فقط)
```

---

## ✅ اختبارات Authentication

### 1️⃣ Health Check (فحص صحة الخادم)

**الطلب:**
```http
GET http://localhost:5000/api/health
```

**الاستجابة المتوقعة:**
```json
{
  "status": "success",
  "message": "Techno Home API is running",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

### 2️⃣ تسجيل حساب عميل جديد (Register - Customer)

**الطلب:**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "أحمد",
  "lastName": "محمد",
  "email": "ahmad@example.com",
  "phone": "0912345678",
  "password": "Password123",
  "role": "customer"
}
```

**الاستجابة المتوقعة (201 Created):**
```json
{
  "status": "success",
  "message": "تم تسجيل المستخدم بنجاح",
  "data": {
    "user": {
      "id": "65a1234567890abcdef12345",
      "firstName": "أحمد",
      "lastName": "محمد",
      "email": "ahmad@example.com",
      "phone": "0912345678",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**💾 احفظ التوكن في Postman Environment:**
- اسم المتغير: `token`
- القيمة: انسخ `data.token` من الاستجابة

---

### 3️⃣ تسجيل حساب فني جديد (Register - Technician)

**الطلب:**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "علي",
  "lastName": "أحمد",
  "email": "ali@example.com",
  "phone": "0987654321",
  "password": "Password123",
  "role": "technician"
}
```

**الاستجابة المتوقعة (201 Created):**
```json
{
  "status": "success",
  "message": "تم تسجيل المستخدم بنجاح",
  "data": {
    "user": {
      "id": "65a1234567890abcdef12346",
      "firstName": "علي",
      "lastName": "أحمد",
      "email": "ali@example.com",
      "phone": "0987654321",
      "role": "technician"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**💾 احفظ:**
- معرف الفني: `technician_id` = `data.user.id`
- التوكن الخاص به للاختبار لاحقاً

---

### 4️⃣ تسجيل دخول (Login)

**الطلب:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "ahmad@example.com",
  "password": "Password123"
}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "user": {
      "id": "65a1234567890abcdef12345",
      "firstName": "أحمد",
      "lastName": "محمد",
      "email": "ahmad@example.com",
      "phone": "0912345678",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 5️⃣ الحصول على بيانات المستخدم الحالي (Me) ⚠️ محمي

**الطلب:**
```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer {{token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "65a1234567890abcdef12345",
      "firstName": "أحمد",
      "lastName": "محمد",
      "email": "ahmad@example.com",
      "phone": "0912345678",
      "role": "customer",
      "isActive": true,
      "isVerified": false,
      "fullName": "أحمد محمد"
    }
  }
}
```

---

### 6️⃣ تغيير كلمة المرور (Change Password) ⚠️ محمي

**الطلب:**
```http
POST http://localhost:5000/api/auth/change-password
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "oldPassword": "Password123",
  "newPassword": "NewPassword456"
}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

**ملاحظة:** اختبر التسجيل مجدداً بكلمة المرور الجديدة

---

## 👤 اختبارات Users

### 1️⃣ الحصول على الملف الشخصي (Get Profile) ⚠️ محمي

**الطلب:**
```http
GET http://localhost:5000/api/users/profile
Authorization: Bearer {{token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "65a1234567890abcdef12345",
      "firstName": "أحمد",
      "lastName": "محمد",
      "email": "ahmad@example.com",
      "phone": "0912345678",
      "bio": "",
      "profileImage": ""
    }
  }
}
```

---

### 2️⃣ تحديث الملف الشخصي (Update Profile) ⚠️ محمي

**الطلب:**
```http
PATCH http://localhost:5000/api/users/profile
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "firstName": "أحمد",
  "lastName": "سالم",
  "phone": "0912345679",
  "bio": "مهتم بإصلاح الأجهزة المنزلية",
  "profileImage": "https://example.com/profile.jpg",
  "address": {
    "city": "طرابلس",
    "street": "شارع الجمهورية",
    "building": "10",
    "floor": "3",
    "apartment": "302"
  }
}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم تحديث البروفايل بنجاح",
  "data": {
    "user": {
      "firstName": "أحمد",
      "lastName": "سالم",
      "phone": "0912345679",
      "bio": "مهتم بإصلاح الأجهزة المنزلية"
    }
  }
}
```

---

### 3️⃣ تحديث الموقع الجغرافي (Update Location) ⚠️ محمي

**الطلب:**
```http
PATCH http://localhost:5000/api/users/location
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "longitude": 13.1913,
  "latitude": 32.8872
}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم تحديث الموقع بنجاح",
  "data": {
    "user": {
      "location": {
        "type": "Point",
        "coordinates": [13.1913, 32.8872]
      }
    }
  }
}
```

---

## 🏢 اختبارات Brands (العلامات التجارية)

### 1️⃣ الحصول على جميع العلامات التجارية (Get All) 🔓 عام

**الطلب:**
```http
GET http://localhost:5000/api/brands
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "count": 0,
    "brands": []
  }
}
```

**ملاحظة:** القائمة ستكون فارغة في البداية (إلا إذا أضفت بيانات)

---

### 2️⃣ إنشاء علامة تجارية جديدة (Create Brand) ⚠️ محمي (Admin فقط)

**الطلب:**
```http
POST http://localhost:5000/api/brands
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "nameAr": "سامسونج",
  "nameEn": "Samsung",
  "logo": "https://example.com/samsung.png",
  "description": "شركة متخصصة في الأجهزة الكهربائية",
  "country": "كوريا الجنوبية",
  "website": "https://samsung.com"
}
```

**الاستجابة المتوقعة (201 Created):**
```json
{
  "status": "success",
  "message": "تم إنشاء العلامة التجارية بنجاح",
  "data": {
    "brand": {
      "_id": "65a1234567890abcdef12350",
      "name": "سامسونج-Samsung",
      "nameAr": "سامسونج",
      "nameEn": "Samsung",
      "logo": "https://example.com/samsung.png",
      "description": "شركة متخصصة في الأجهزة الكهربائية",
      "country": "كوريا الجنوبية",
      "website": "https://samsung.com",
      "isActive": true
    }
  }
}
```

**💾 احفظ:** `brand_id` = `data.brand._id`

---

### 3️⃣ الحصول على علامة تجارية محددة (Get by ID)

**الطلب:**
```http
GET http://localhost:5000/api/brands/{{brand_id}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "brand": {
      "_id": "65a1234567890abcdef12350",
      "name": "سامسونج-Samsung",
      "nameAr": "سامسونج"
    }
  }
}
```

---

## 📱 اختبارات Devices (الأجهزة)

### قبل البدء: البيانات المطلوبة
- ✅ `customer_token` (من تسجيل عميل)
- ✅ `brand_id` (من إنشاء علامة تجارية)
- ⚠️ `appliance_type_id` (سنحتاج إلى إنشاء نوع جهاز أولاً)

---

### خطوة أولى: إنشاء نوع جهاز (ApplianceType)

**الطلب:**
```http
POST http://localhost:5000/api/admin/appliance-types
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "nameAr": "ثلاجة",
  "nameEn": "Refrigerator",
  "category": "cooling",
  "commonProblems": [
    {
      "problem": "الثلاجة لا تبرد",
      "description": "الثلاجة لا تصل إلى درجة الحرارة المطلوبة"
    },
    {
      "problem": "تسرب الماء",
      "description": "تسرب المياه من أسفل الثلاجة"
    }
  ]
}
```

**الاستجابة المتوقعة (201 Created):**
```json
{
  "status": "success",
  "message": "تم إنشاء نوع الجهاز بنجاح",
  "data": {
    "applianceType": {
      "_id": "65a1234567890abcdef12360",
      "nameAr": "ثلاجة",
      "nameEn": "Refrigerator",
      "category": "cooling"
    }
  }
}
```

**💾 احفظ:** `appliance_type_id` = `data.applianceType._id`

---

### 1️⃣ إضافة جهاز جديد (Create Device) ⚠️ محمي

**الطلب:**
```http
POST http://localhost:5000/api/devices
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "brand": "{{brand_id}}",
  "applianceType": "{{appliance_type_id}}",
  "modelName": "RT-50J",
  "serialNumber": "SN123456789",
  "purchaseDate": "2023-01-15",
  "warrantyExpiry": "2025-01-15",
  "notes": "ثلاجة جديدة بحالة جيدة",
  "images": ["https://example.com/fridge1.jpg"]
}
```

**الاستجابة المتوقعة (201 Created):**
```json
{
  "status": "success",
  "message": "تم إضافة الجهاز بنجاح",
  "data": {
    "device": {
      "_id": "65a1234567890abcdef12370",
      "owner": "65a1234567890abcdef12345",
      "brand": {
        "_id": "65a1234567890abcdef12350",
        "nameAr": "سامسونج"
      },
      "applianceType": {
        "_id": "65a1234567890abcdef12360",
        "nameAr": "ثلاجة"
      },
      "modelName": "RT-50J",
      "serialNumber": "SN123456789"
    }
  }
}
```

**💾 احفظ:** `device_id` = `data.device._id`

---

### 2️⃣ الحصول على أجهزة المستخدم (Get My Devices) ⚠️ محمي

**الطلب:**
```http
GET http://localhost:5000/api/devices
Authorization: Bearer {{token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "count": 1,
    "devices": [
      {
        "_id": "65a1234567890abcdef12370",
        "modelName": "RT-50J",
        "brand": {
          "nameAr": "سامسونج"
        }
      }
    ]
  }
}
```

---

### 3️⃣ الحصول على جهاز محدد (Get Device by ID) ⚠️ محمي

**الطلب:**
```http
GET http://localhost:5000/api/devices/{{device_id}}
Authorization: Bearer {{token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "device": {
      "_id": "65a1234567890abcdef12370",
      "modelName": "RT-50J",
      "serialNumber": "SN123456789"
    }
  }
}
```

---

### 4️⃣ تحديث جهاز (Update Device) ⚠️ محمي

**الطلب:**
```http
PATCH http://localhost:5000/api/devices/{{device_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "modelName": "RT-50J-Updated",
  "notes": "تم تحديث الملاحظات"
}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم تحديث الجهاز بنجاح",
  "data": {
    "device": {
      "modelName": "RT-50J-Updated",
      "notes": "تم تحديث الملاحظات"
    }
  }
}
```

---

### 5️⃣ حذف جهاز (Delete Device) ⚠️ محمي

**الطلب:**
```http
DELETE http://localhost:5000/api/devices/{{device_id}}
Authorization: Bearer {{token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم حذف الجهاز بنجاح"
}
```

---

## 🔧 اختبارات Service Requests (طلبات الصيانة)

### متطلبات أولية:
- ✅ `customer_token`
- ✅ `device_id` (جهاز موجود)
- ✅ `technician_id` (من تسجيل فني)
- ✅ `customer_id`

---

### 1️⃣ البحث عن فنيين قريبين (Find Nearby Technicians) 🔓 عام

**الطلب:**
```http
GET "http://localhost:5000/api/service-requests/find-technicians?lat=32.8872&lng=13.1913&radius=15"
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "count": 0,
    "technicians": []
  }
}
```

**ملاحظة:** ستكون فارغة حتى تحديث موقع الفني

---

### 2️⃣ إنشاء طلب صيانة جديد (Create Service Request) ⚠️ محمي

**الطلب:**
```http
POST http://localhost:5000/api/service-requests
Authorization: Bearer {{customer_token}}
Content-Type: application/json

{
  "device": "{{device_id}}",
  "problemDescription": "الثلاجة لا تبرد بشكل صحيح والماء يتسرب",
  "errorCode": "ERR-001",
  "serviceType": "regular",
  "preferredDate": "2024-01-20T10:00:00Z",
  "serviceAddress": {
    "city": "طرابلس",
    "street": "شارع الجمهورية",
    "building": "10",
    "floor": "3",
    "apartment": "302",
    "notes": "الشقة الثالثة يساراً"
  },
  "serviceLocation": {
    "type": "Point",
    "coordinates": [13.1913, 32.8872]
  }
}
```

**الاستجابة المتوقعة (201 Created):**
```json
{
  "status": "success",
  "message": "تم إنشاء طلب الصيانة بنجاح",
  "data": {
    "serviceRequest": {
      "_id": "65a1234567890abcdef12380",
      "customer": "65a1234567890abcdef12345",
      "device": "65a1234567890abcdef12370",
      "problemDescription": "الثلاجة لا تبرد بشكل صحيح والماء يتسرب",
      "status": "pending",
      "serviceType": "regular",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

**💾 احفظ:** `service_request_id` = `data.serviceRequest._id`

---

### 3️⃣ الحصول على طلبات الصيانة (Get My Requests) ⚠️ محمي

**الطلب:**
```http
GET http://localhost:5000/api/service-requests/my-requests
Authorization: Bearer {{customer_token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "count": 1,
    "requests": [
      {
        "_id": "65a1234567890abcdef12380",
        "problemDescription": "الثلاجة لا تبرد",
        "status": "pending"
      }
    ]
  }
}
```

---

### 4️⃣ الحصول على طلب صيانة محدد (Get Request by ID) ⚠️ محمي

**الطلب:**
```http
GET http://localhost:5000/api/service-requests/{{service_request_id}}
Authorization: Bearer {{customer_token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "request": {
      "_id": "65a1234567890abcdef12380",
      "problemDescription": "الثلاجة لا تبرد",
      "status": "pending",
      "rating": null,
      "customerFeedback": null
    }
  }
}
```

---

### 5️⃣ تحديث طلب الصيانة (Update Request) ⚠️ محمي (العميل فقط)

**الطلب:**
```http
PATCH http://localhost:5000/api/service-requests/{{service_request_id}}
Authorization: Bearer {{customer_token}}
Content-Type: application/json

{
  "problemDescription": "الثلاجة لا تبرد ولا يوجد ماء بارد",
  "preferredDate": "2024-01-21T14:00:00Z"
}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم تحديث طلب الصيانة بنجاح"
}
```

**ملاحظة:** يمكن تحديث الطلبات المعلقة فقط

---

### 6️⃣ إلغاء طلب الصيانة (Cancel Request) ⚠️ محمي

**الطلب:**
```http
POST http://localhost:5000/api/service-requests/{{service_request_id}}/cancel
Authorization: Bearer {{customer_token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم إلغاء طلب الصيانة بنجاح"
}
```

---

### 7️⃣ تقييم طلب الصيانة (Rate Request) ⚠️ محمي

**ملاحظة:** غيّر حالة الطلب إلى "completed" في قاعدة البيانات أولاً

**الطلب:**
```http
POST http://localhost:5000/api/service-requests/{{service_request_id}}/rate
Authorization: Bearer {{customer_token}}
Content-Type: application/json

{
  "rating": 5,
  "feedback": "خدمة ممتازة وفني احترافي جداً"
}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم تقييم الطلب بنجاح"
}
```

---

## 👨‍💼 اختبارات Admin (لوحة التحكم الإدارية)

### قبل البدء:
- ⚠️ تحتاج إلى `admin_token` (عميل بدور admin فقط)
- لتسجيل دخول مسؤول، عدّل حقل `role` في قاعدة البيانات إلى `admin`

---

### 1️⃣ الحصول على جميع المستخدمين (Get All Users) ⚠️ محمي (Admin فقط)

**الطلب:**
```http
GET http://localhost:5000/api/admin/users
Authorization: Bearer {{admin_token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "count": 2,
    "users": [
      {
        "_id": "65a1234567890abcdef12345",
        "firstName": "أحمد",
        "email": "ahmad@example.com",
        "role": "customer",
        "isActive": true
      },
      {
        "_id": "65a1234567890abcdef12346",
        "firstName": "علي",
        "email": "ali@example.com",
        "role": "technician",
        "isActive": true
      }
    ]
  }
}
```

---

### 2️⃣ الحصول على طلبات الفنيين المعلقة (Get Pending Technicians) ⚠️ محمي

**الطلب:**
```http
GET http://localhost:5000/api/admin/technicians/pending
Authorization: Bearer {{admin_token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "count": 1,
    "technicians": [
      {
        "_id": "65a1234567890abcdef12385",
        "user": {
          "firstName": "علي",
          "email": "ali@example.com"
        },
        "specialty": "general",
        "verificationStatus": "pending"
      }
    ]
  }
}
```

---

### 3️⃣ الموافقة على طلب فني (Approve Technician) ⚠️ محمي

**الطلب:**
```http
POST http://localhost:5000/api/admin/technicians/{{technician_profile_id}}/approve
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم الموافقة على طلب الفني بنجاح"
}
```

---

### 4️⃣ رفض طلب فني (Reject Technician) ⚠️ محمي

**الطلب:**
```http
POST http://localhost:5000/api/admin/technicians/{{technician_profile_id}}/reject
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "rejectionReason": "المستندات غير مكتملة"
}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم رفض طلب الفني"
}
```

---

### 5️⃣ تفعيل/تعطيل حساب (Toggle User Status) ⚠️ محمي

**الطلب:**
```http
POST http://localhost:5000/api/admin/users/{{user_id}}/toggle-status
Authorization: Bearer {{admin_token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "message": "تم تفعيل حساب المستخدم"
}
```

---

### 6️⃣ الحصول على جميع طلبات الصيانة (Get All Service Requests) ⚠️ محمي

**الطلب:**
```http
GET http://localhost:5000/api/admin/service-requests
Authorization: Bearer {{admin_token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "count": 1,
    "requests": [
      {
        "_id": "65a1234567890abcdef12380",
        "customer": {...},
        "status": "pending",
        "serviceType": "regular"
      }
    ]
  }
}
```

---

### 7️⃣ الحصول على الإحصائيات (Get Statistics) ⚠️ محمي

**الطلب:**
```http
GET http://localhost:5000/api/admin/statistics
Authorization: Bearer {{admin_token}}
```

**الاستجابة المتوقعة (200 OK):**
```json
{
  "status": "success",
  "data": {
    "users": {
      "total": 2,
      "customers": 1,
      "technicians": 1,
      "pendingVerification": 1
    },
    "serviceRequests": {
      "total": 1,
      "completed": 0,
      "pending": 1,
      "emergency": 0
    },
    "system": {
      "brands": 1,
      "applianceTypes": 1
    }
  }
}
```

---

## 📋 Checklist الاختبار النهائي

استخدم هذا القائمة للتأكد من اختبار كل شيء:

### Authentication (المصادقة)
- [ ] Health Check
- [ ] Register Customer
- [ ] Register Technician
- [ ] Login
- [ ] Get Me
- [ ] Change Password

### Users (المستخدمون)
- [ ] Get Profile
- [ ] Update Profile
- [ ] Update Location

### Brands (العلامات التجارية)
- [ ] Get All Brands
- [ ] Create Brand
- [ ] Get Brand by ID

### Devices (الأجهزة)
- [ ] Create ApplianceType (Admin)
- [ ] Create Device
- [ ] Get My Devices
- [ ] Get Device by ID
- [ ] Update Device
- [ ] Delete Device

### Service Requests (طلبات الصيانة)
- [ ] Find Nearby Technicians
- [ ] Create Service Request
- [ ] Get My Requests
- [ ] Get Request by ID
- [ ] Update Request
- [ ] Cancel Request
- [ ] Rate Request

### Admin (الإدارة)
- [ ] Get All Users
- [ ] Get Pending Technicians
- [ ] Approve Technician
- [ ] Reject Technician
- [ ] Toggle User Status
- [ ] Get All Service Requests
- [ ] Get Statistics

---

## 🐛 معالجة الأخطاء الشائعة

### 1. `ليس لديك صلاحيات كافية` (403)
**المشكلة:** تحاول استخدام endpoint مخصص للمسؤول بحساب عام
**الحل:** استخدم `admin_token` بدلاً من `token`

### 2. `بطاقة دخول غير صحيحة` (401)
**المشكلة:** التوكن غير صحيح أو انتهت صلاحيته
**الحل:** سجل دخول مجدداً وانسخ التوكن الجديد

### 3. `الموارد غير موجودة` (404)
**المشكلة:** المعرف (ID) غير صحيح
**الحل:** تأكد من نسخ المعرفات بشكل صحيح

### 4. `طلب سيء` (400)
**المشكلة:** البيانات المرسلة غير صحيحة
**الحل:** تحقق من صيغة JSON وأنواع البيانات

---

## 📌 ملاحظات مهمة

1. **التوكن:** كل توكن صالح لمدة 7 أيام فقط
2. **الأدوار:** "customer" و "technician" و "admin"
3. **الحالات:** "pending", "accepted", "in_progress", "completed", "cancelled", "rejected"
4. **الموقع الجغرافي:** [longitude, latitude]
5. **جميع الرسائل:** باللغة العربية للوضوح

---

## 🎯 الخطوات التالية بعد الاختبار

بعد التأكد من أن جميع الاختبارات تمرّ بنجاح:
1. ✅ Backend جاهز 100%
2. ➡️ الانتقال إلى تطوير **Web Admin Dashboard** (React.js)

---

**تاريخ الإنشاء:** يناير 2024
**آخر تحديث:** يناير 2024