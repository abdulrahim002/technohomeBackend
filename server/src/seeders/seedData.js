const mongoose = require('mongoose');
const City = require('../models/core/City.model');
const ApplianceType = require('../models/ApplianceType.model');

async function seedData() {
  try {
    // الاتصال بقاعدة البيانات (محلياً)
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/technohome';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for seeding...');

    // 1. مسح البيانات القديمة
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      City.deleteMany(),
      ApplianceType.deleteMany()
    ]);

    // 2. إدخال المدن الليبية الأساسية
    // 2. إدخال المدن الليبية الأساسية
    console.log('📍 Seeding Cities...');
    const cities = [
      { name: 'Tripoli', nameAr: 'طرابلس', nameEn: 'Tripoli', region: 'غرب' },
      { name: 'Benghazi', nameAr: 'بنغازي', nameEn: 'Benghazi', region: 'شرق' },
      { name: 'Misrata', nameAr: 'مصراتة', nameEn: 'Misrata', region: 'غرب' },
      { name: 'Zawiya', nameAr: 'الزاوية', nameEn: 'Zawiya', region: 'غرب' },
      { name: 'Sebha', nameAr: 'سبها', nameEn: 'Sebha', region: 'جنوب' }
    ];
    await City.insertMany(cities);

    // 3. إدخال أنواع الأجهزة والماركات نصياً
    console.log('🛠️ Seeding Appliance Types...');
    const applianceTypes = [
      { 
        nameAr: 'مكيف', 
        nameEn: 'Air Conditioner',
        name: 'Air Conditioner',
        brands: ['Samsung', 'LG', 'Gree', 'Daikin', 'Midea', 'Carrier']
      },
      { 
        nameAr: 'غسالة', 
        nameEn: 'Washing Machine',
        name: 'Washing Machine',
        brands: ['Samsung', 'LG', 'Whirlpool', 'Beko', 'Indesit', 'Candy']
      },
      { 
        nameAr: 'جلاية', 
        nameEn: 'Dishwasher',
        name: 'Dishwasher',
        brands: ['Samsung', 'LG', 'Bosch', 'Electrolux', 'Beko', 'Siemens']
      }
    ];
    await ApplianceType.insertMany(applianceTypes);

    console.log('🚀 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seedData();
