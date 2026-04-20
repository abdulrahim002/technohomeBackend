const mongoose = require('mongoose');
const dotenv = require('dotenv');
const City = require('../models/core/City.model');
const ApplianceType = require('../models/ApplianceType.model');
const Brand = require('../models/Brand.model');

/**
 * سكربت تزويد البيانات الأساسية (Master Seeder)
 * الدور: ملئ قاعدة البيانات بالمدن، أنواع الأجهزة، والماركات الحقيقية.
 */

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. تنظيف البيانات القديمة (اختياري - يفضل المسح لضمان نظام نظيف)
    await City.deleteMany({});
    await ApplianceType.deleteMany({});
    await Brand.deleteMany({});

    // 2. تزويد المدن
    const cities = await City.create([
      { name: 'tripoli', nameAr: 'طرابلس', nameEn: 'Tripoli' },
      { name: 'benghazi', nameAr: 'بنغازي', nameEn: 'Benghazi' },
      { name: 'misrata', nameAr: 'مصراتة', nameEn: 'Misrata' },
      { name: 'zawiya', nameAr: 'الزاوية', nameEn: 'Zawiya' },
      { name: 'beida', nameAr: 'البيضاء', nameEn: 'Baida' },
    ]);
    console.log(`✅ Seeded ${cities.length} Cities`);

    // 3. تزويد الماركات (ككيانات مستقلة)
    const brands = await Brand.create([
      { name: 'samsung', nameAr: 'سامسونج', nameEn: 'Samsung' },
      { name: 'lg', nameAr: 'إل جي', nameEn: 'LG' },
      { name: 'whirlpool', nameAr: 'ويرلبول', nameEn: 'Whirlpool' },
      { name: 'gree', nameAr: 'جري', nameEn: 'Gree' },
      { name: 'haier', nameAr: 'هاير', nameEn: 'Haier' },
      { name: 'beko', nameAr: 'بيكو', nameEn: 'Beko' },
      { name: 'daikin', nameAr: 'دايكن', nameEn: 'Daikin' },
    ]);
    console.log(`✅ Seeded ${brands.length} Brands`);

    // 4. تزويد أنواع الأجهزة
    const appliances = await ApplianceType.create([
      { name: 'ac', nameAr: 'مكيف هواء', nameEn: 'Air Conditioner' },
      { name: 'washing_machine', nameAr: 'غسالة ملابس', nameEn: 'Washing Machine' },
      { name: 'fridge', nameAr: 'ثلاجة', nameEn: 'Refrigerator' },
      { name: 'dryer', nameAr: 'مجفف ملابس', nameEn: 'Dryer' },
      { name: 'dishwasher', nameAr: 'غسالة صحون', nameEn: 'Dishwasher' },
      { name: 'oven', nameAr: 'فرن غاز/كهرباء', nameEn: 'Oven' },
    ]);
    console.log(`✅ Seeded ${appliances.length} Appliance Types`);

    console.log('--- Master Seeding Completed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('Master Seeding Failed:', error);
    process.exit(1);
  }
};

seedData();
