require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User.model');
const TechnicianProfile = require('./models/TechnicianProfile.model');
const ServiceRequest = require('./models/ServiceRequest.model');
const Transaction = require('./models/Transaction.model');
const Review = require('./models/Review.model');
const ApplianceType = require('./models/ApplianceType.model');
const Brand = require('./models/Brand.model');
const City = require('./models/core/City.model');
const ChatMessage = require('./models/Message.model');

async function seedSystem() {
  try {
    console.log('--- 🧹 STARTING MASTER CLEANUP & SEEDING ---');
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. CLEAR ALL COLLECTIONS
    console.log('Cleaning existing data...');
    await Promise.all([
      User.deleteMany({}),
      TechnicianProfile.deleteMany({}),
      ServiceRequest.deleteMany({}),
      Transaction.deleteMany({}),
      Review.deleteMany({}),
      ApplianceType.deleteMany({}),
      Brand.deleteMany({}),
      City.deleteMany({}),
      ChatMessage.deleteMany({})
    ]);
    console.log(' ✅ Database Wiped.');

    // 2. SEED CITIES
    console.log('\nSeeding Cities...');
    const cities = await City.create([
      { name: 'Tripoli', nameAr: 'طرابلس', nameEn: 'Tripoli' },
      { name: 'Benghazi', nameAr: 'بنغازي', nameEn: 'Benghazi' },
      { name: 'Misrata', nameAr: 'مصراتة', nameEn: 'Misrata' }
    ]);
    const tripoliId = cities[0]._id;
    console.log(' ✅ Cities Created.');

    // 3. SEED APPLIANCE TYPES
    console.log('\nSeeding Appliance Types...');
    const appliances = await ApplianceType.create([
      { name: 'Air Conditioner', nameAr: 'مكيف هواء', nameEn: 'Air Conditioner' },
      { name: 'Refrigerator', nameAr: 'ثلاجة', nameEn: 'Refrigerator' },
      { name: 'Washing Machine', nameAr: 'غسالة ملابس', nameEn: 'Washing Machine' },
      { name: 'Microwave', nameAr: 'مايكروويف', nameEn: 'Microwave' }
    ]);
    console.log(' ✅ Appliance Types Created.');

    // 4. SEED BRANDS
    console.log('\nSeeding Brands...');
    await Brand.create([
      { name: 'Samsung', nameAr: 'سامسونج', nameEn: 'Samsung', applianceTypes: [appliances[0]._id, appliances[1]._id, appliances[2]._id] },
      { name: 'LG', nameAr: 'إل جي', nameEn: 'LG', applianceTypes: [appliances[0]._id, appliances[1]._id] },
      { name: 'Beko', nameAr: 'بيكو', nameEn: 'Beko', applianceTypes: [appliances[1]._id, appliances[2]._id] },
      { name: 'Whirlpool', nameAr: 'ويرلبول', nameEn: 'Whirlpool', applianceTypes: [appliances[2]._id] }
    ]);
    console.log(' ✅ Brands Created.');

    // 5. SEED ADMIN USER
    console.log('\nCreating Admin Account...');
    await User.create({
      firstName: 'عبد الرحيم',
      lastName: 'المدير',
      phone: '0900000000',
      password: 'adminpassword',
      role: 'admin',
      city: tripoliId,
      isActive: true
    });
    console.log(' ✅ Admin Created (0900000000 / adminpassword).');

    // 6. SEED DEMO TECHNICIAN
    console.log('\nCreating Demo Technician...');
    const techUser = await User.create({
      firstName: 'أحمد',
      lastName: 'الخبير',
      phone: '0910000000',
      password: 'password123',
      role: 'technician',
      city: tripoliId,
      isActive: true,
      walletBalance: 50
    });
    await TechnicianProfile.create({
      user: techUser._id,
      isVerified: true,
      specialties: [appliances[0]._id, appliances[1]._id],
      brands: [ (await Brand.findOne({nameEn: 'Samsung'}))._id ],
      bio: 'فني خبير في صيانة المكيفات والثلاجات، خبرة 10 سنوات.',
      rating: 5,
      reviewCount: 1
    });
    console.log(' ✅ Technician Created (0910000000 / password123).');

    // 7. SEED DEMO CLIENT
    console.log('\nCreating Demo Client...');
    await User.create({
      firstName: 'عمر',
      lastName: 'الزبون',
      phone: '0920000000',
      password: 'password123',
      role: 'client',
      city: tripoliId,
      isActive: true
    });
    console.log(' ✅ Client Created (0920000000 / password123).');

    console.log('\n🚀🚀🚀 MASTER SEED COMPLETED SUCCESSFULLY 🚀🚀🚀');
    console.log('System is now ready for production-like testing.');

  } catch (err) {
    console.error(' ❌ SEEDING FAILED:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedSystem();
