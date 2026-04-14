require('dotenv').config();
const mongoose = require('mongoose');
const ApplianceType = require('./src/models/ApplianceType.model');
const Brand = require('./src/models/Brand.model');
const Troubleshoot = require('./src/models/Troubleshoot.model');

// Sample Seed data process
const seedData = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // مسح البيانات القديمة لضمان عدم وجود تكرار
    await Troubleshoot.deleteMany();
    console.log('🧹 Old Troubleshoot records cleared.');

    // إضافة أنواع أجهزة (Appliance Types)
    let washingMachine = await ApplianceType.findOne({ nameEn: 'Washing Machine' });
    if (!washingMachine) {
      washingMachine = await ApplianceType.create({
        name: 'غسالة ملابس',
        nameAr: 'غسالة ملابس',
        nameEn: 'Washing Machine',
        category: 'laundry'
      });
    }

    let airConditioner = await ApplianceType.findOne({ nameEn: 'Air Conditioner' });
    if (!airConditioner) {
      airConditioner = await ApplianceType.create({
        name: 'مكيف هواء',
        nameAr: 'مكيف هواء',
        nameEn: 'Air Conditioner',
        category: 'cooling'
      });
    }

    // إضافة علامات تجارية (Brands)
    let lgBrand = await Brand.findOne({ nameEn: 'LG' });
    if (!lgBrand) {
      lgBrand = await Brand.create({
        name: 'إل جي',
        nameAr: 'إل جي',
        nameEn: 'LG'
      });
    }

    let samsungBrand = await Brand.findOne({ nameEn: 'Samsung' });
    if (!samsungBrand) {
      samsungBrand = await Brand.create({
        name: 'سامسونج',
        nameAr: 'سامسونج',
        nameEn: 'Samsung'
      });
    }

    // إضافة المشاكل بربطها بالأنواع الصحيحة (Troubleshoots)
    const troubleshoots = [
      {
        title: 'عطل في حساس الضغط (Pressure Sensor)',
        deviceType: washingMachine._id,
        brand: lgBrand._id,
        errorCode: 'PE',
        problemDescription: 'غسالتي تسرب الماء أو تظهر كود غريب ولا تعصر الملابس',
        difficultyLevel: 'medium',
        diagnosticSteps: [
          {
            stepId: 'q1',
            question: 'هل يظهر الكود PE على شاشة الغسالة؟',
            options: [
              { answerText: 'نعم', nextStepId: 'q2' },
              { answerText: 'لا', suggestedSolution: 'يرجى تقديم تفاصيل أكثر عن العطل أو الكود الظاهر.' }
            ]
          },
          {
            stepId: 'q2',
            question: 'هل الغسالة متصلة بمصدر المياه والصنبور مفتوح؟',
            options: [
              { answerText: 'نعم، مفتوح بقوة', nextStepId: 'q3' },
              { answerText: 'الماء ضعيف أو مغلق', suggestedSolution: 'الرجاء فتح الصنبور بالكامل والتأكد من ضغط الماء، ثم إعادة تشغيل الغسالة.' }
            ]
          },
          {
            stepId: 'q3',
            question: 'هل تسحب الغسالة الماء ثم تتوقف وتظهر الكود، أم لا تسحب ماء إطلاقاً؟',
            options: [
              { answerText: 'تسحب ثم تتوقف', suggestedSolution: 'العطل في خرطوم أو حساس الضغط الداخلي (Pressure Switch). ينصح بتنظيفه أو تغييره عن طريق فني.' },
              { answerText: 'لا تسحب إطلاقاً', suggestedSolution: 'تأكد من تنظيف مصفي (فلاتر) صمامات دخول الماء، إن كانت نظيفة فالمشكلة في الصمام ويحتاج للتغيير.' }
            ]
          }
        ]
      },
      {
        title: 'خطأ في تصريف المياه',
        deviceType: washingMachine._id,
        brand: samsungBrand._id,
        errorCode: 'OE',
        problemDescription: 'الغسالة مكتومة بالماء ولا تقوم بعملية العصر أو التصريف نهائيا',
        difficultyLevel: 'easy',
        diagnosticSteps: [
          {
            stepId: 'q1',
            question: 'هل تسمع صوت طنين (زنّة) خفيف من أسفل الغسالة أثناء محاولتها ضخ الماء للخارج؟',
            options: [
              { answerText: 'نعم', suggestedSolution: 'هذا يعني أن المضخة تعمل ومخنوقة. قم بفتح الفلتر السفلي وتنظيفه من الشوائب والعملات.' },
              { answerText: 'لا أسمع أي صوت', suggestedSolution: 'المضخة قد تكون تالفة أو محترقة. يرجى استدعاء الصيانة لتغيير المضخة.' }
            ]
          }
        ]
      },
      {
        title: 'خطأ في حساس حرارة الغرفة',
        deviceType: airConditioner._id,
        brand: lgBrand._id,
        errorCode: 'E1',
        problemDescription: 'التكييف لا يبرد ويعطيني عطل E1',
        difficultyLevel: 'hard',
        diagnosticSteps: [
          {
            stepId: 'q1',
            question: 'هل يظهر الكود E1 مباشرة بعد التشغيل أم بعد فترة من العمل؟',
            options: [
              { answerText: 'مباشرة فور التشغيل', suggestedSolution: 'حساس حرارة الغرفة غير متصل باللوحة أو تالف ويحتاج تغيير مباشر عبر الفني.' },
              { answerText: 'بعد فترة 5-10 دقائق', suggestedSolution: 'هناك احتمال كبير بوجود نقص في غاز الفريون أو وساخة شديدة بالمكثف.' }
            ]
          }
        ]
      }
    ];

    await Troubleshoot.insertMany(troubleshoots);
    console.log('✅ 3 Troubleshoot sample records added successfully!');

    // إغلاق الاتصال
    await mongoose.connection.close();
    console.log('👋 Seeding finished. Connection closed.');

    // طباعة أمر الـ CURL للعميل
    console.log('\n--- 🧪 TEST COMMANDS ---');
    console.log(`اختبار جلسة الأعطال عبر البحث بالنص (يرجى إرسال العبارة المشفرة URL-encoded):
curl -X GET "http://localhost:5000/api/troubleshoots/description-search?description=%D8%BA%D8%B3%D8%A7%D9%84%D8%AA%D9%8A%20%D8%AA%D8%B3%D8%B1%D8%A8%20%D8%A7%D9%84%D9%85%D8%A7%D8%A1" -H "Content-Type: application/json"`);
    
    console.log(`\nاختبار الكود المباشر للغسالة (PE):
curl -X GET "http://localhost:5000/api/troubleshoots/search?errorCode=PE&deviceType=${washingMachine._id}" -H "Content-Type: application/json"`);

  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
