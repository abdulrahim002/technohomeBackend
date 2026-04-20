// scratch/migration_tool.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ApplianceType = require('../src/models/ApplianceType.model');
const Brand = require('../src/models/Brand.model');
const TechnicianProfile = require('../src/models/TechnicianProfile.model');

dotenv.config();

/**
 * هذا السكربت يقوم بـ:
 * 1. مسح التخصصات والماركات القديمة (Strings) من بروفايلات الفنيين.
 * 2. تهيئة بعض البيانات التجريبية (Seeding) بنظام الـ IDs للتجربة.
 */

async function migrate() {
  try {
    console.log('--- STARTING MIGRATION ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB...');

    // 1. تنظيف بروفايلات الفنيين من البيانات النصية القديمة
    console.log('Cleaning old string-based specialties from technician profiles...');
    await TechnicianProfile.updateMany({}, { 
      $set: { specialties: [], brands: [] } 
    });

    // 2. إنشاء بيانات تجريبية (Seed)
    console.log('Seeding initial Appliances...');
    const ac = await ApplianceType.findOneAndUpdate(
       { nameEn: 'Air Conditioner' },
       { nameAr: 'مكيف هواء', nameEn: 'Air Conditioner', name: 'مكيف-AC' },
       { upsert: true, new: true }
    );

    const fridge = await ApplianceType.findOneAndUpdate(
       { nameEn: 'Refrigerator' },
       { nameAr: 'ثلاجة', nameEn: 'Refrigerator', name: 'ثلاجة-Fridge' },
       { upsert: true, new: true }
    );

    console.log('Seeding initial Brands...');
    await Brand.findOneAndUpdate(
       { nameEn: 'Samsung' },
       { nameAr: 'سامسونج', nameEn: 'Samsung', applianceType: ac._id },
       { upsert: true }
    );

    await Brand.findOneAndUpdate(
       { nameEn: 'LG' },
       { nameAr: 'ال جي', nameEn: 'LG', applianceType: fridge._id },
       { upsert: true }
    );

    console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
