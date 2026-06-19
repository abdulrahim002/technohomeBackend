# 📊 TechnoHome - Database ERD Diagram
## ✅ Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String firstName
        String lastName
        String phone
        String passwordHash
        String role
        Object location
        Boolean isActive
        Date createdAt
    }

    TECHNICIAN_PROFILE {
        ObjectId _id PK
        ObjectId user FK
        Array specialties
        Array brands
        Number yearsOfExperience
        Array certificates
        String bio
        Boolean isAvailable
        Boolean isVerified
        Number rating
        Number reliabilityScore
        Number reviewCount
        Number consecutiveCompletedJobs
    }

    SERVICE_REQUEST {
        ObjectId _id PK
        ObjectId customer FK
        ObjectId technician FK
        ObjectId applianceType FK
        String brand
        String problemDescription
        Array images
        Object aiDiagnosis
        String diagnosisType
        Date bookingDate
        String scheduledDate
        String timeSlot
        String closingOTP
        Number commissionDeducted
        String status
        Object serviceAddress
        Date acceptedAt
        Date completedAt
        Number finalPrice
        String technicianNotes
    }

    OTP {
        ObjectId _id PK
        String phone
        String otp
        Date expiresAt
        Date createdAt
    }

    REVIEW {
        ObjectId _id PK
        ObjectId request FK
        ObjectId customer FK
        ObjectId technician FK
        Number rating
        String comment
        Date createdAt
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId user FK
        ObjectId request FK
        Number amount
        String type
        String status
        Date createdAt
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId recipientId FK
        String title
        String message
        String type
        String relatedId
        Boolean isRead
        Date createdAt
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId sender FK
        ObjectId receiver FK
        ObjectId request FK
        String content
        Date createdAt
    }

    APPLIANCE_TYPE {
        ObjectId _id PK
        String nameAr
        String nameEn
        String logoUrl
        Boolean isActive
    }

    BRAND {
        ObjectId _id PK
        String nameAr
        String nameEn
        String logoUrl
        Boolean isActive
    }

    USER ||--o| TECHNICIAN_PROFILE : "has profile"
    USER ||--o{ SERVICE_REQUEST : "creates as customer"
    USER ||--o{ SERVICE_REQUEST : "accepts as technician"
    APPLIANCE_TYPE ||--o{ SERVICE_REQUEST : "belongs to"
    BRAND ||--o{ SERVICE_REQUEST : "belongs to"
    SERVICE_REQUEST ||--o| REVIEW : "has"
    SERVICE_REQUEST ||--o{ TRANSACTION : "generates"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ MESSAGE : "sends/receives"
    SERVICE_REQUEST ||--o{ MESSAGE : "related to"
```

---

## 📋 قاعدة البيانات التفاصيل
✅ مجموع Collections: 12 مجموعة (تمت إضافة مجموعة الماركات المستقلة Brand)
✅ جميع العلاقات منفذة بشكل صحيح باستخدام References
✅ فهارس جغرافية للاستعلامات عن المواقع
✅ فهارس مؤقتة TTL لحذف OTP تلقائيا بعد 5 دقائق
✅ جميع الحقول مصممة وفق افضل الممارسات ل MongoDB مع حقل `logoUrl` للشعارات المحلية للأجهزة والماركات.