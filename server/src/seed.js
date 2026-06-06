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
const Area = require('./models/core/Area.model');
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
      Area.deleteMany({}),
      ChatMessage.deleteMany({})
    ]);
    console.log(' ✅ Database Wiped.');

    // 2. SEED CITIES
    console.log('\nSeeding Cities...');
    const cities = await City.create([
      { id: 'tripoli', name: 'Tripoli', nameAr: 'طرابلس', nameEn: 'Tripoli' },
      { id: 'benghazi', name: 'Benghazi', nameAr: 'بنغازي', nameEn: 'Benghazi' },
      { id: 'misrata', name: 'Misrata', nameAr: 'مصراتة', nameEn: 'Misrata' }
    ]);
    const [tripoli, benghazi, misrata] = cities;
    console.log(' ✅ Cities Created (3 cities).');

    // 3. SEED AREAS (مناطق وأحياء لكل مدينة)
    console.log('\nSeeding Areas...');
    await Area.create([
      // ==================== طرابلس (12 منطقة) ====================
      { id: 'tripoli-ain-zara', nameAr: 'عين زارة', nameEn: 'Ain Zara', cityId: tripoli._id },
      { id: 'tripoli-tajoura', nameAr: 'تاجوراء', nameEn: 'Tajoura', cityId: tripoli._id },
      { id: 'tripoli-janzour', nameAr: 'جنزور', nameEn: 'Janzour', cityId: tripoli._id },
      { id: 'tripoli-hay-alandalus', nameAr: 'حي الأندلس', nameEn: 'Hay Al-Andalus', cityId: tripoli._id },
      { id: 'tripoli-siyahiya', nameAr: 'السياحية', nameEn: 'Siyahiya', cityId: tripoli._id },
      { id: 'tripoli-fashloum', nameAr: 'فشلوم', nameEn: 'Fashloum', cityId: tripoli._id },
      { id: 'tripoli-gargaresh', nameAr: 'قرقارش', nameEn: 'Gargaresh', cityId: tripoli._id },
      { id: 'tripoli-suq-juma', nameAr: 'سوق الجمعة', nameEn: 'Souq Al-Juma', cityId: tripoli._id },
      { id: 'tripoli-salah-eddin', nameAr: 'صلاح الدين', nameEn: 'Salah Eddin', cityId: tripoli._id },
      { id: 'tripoli-hai-alsalam', nameAr: 'حي السلام', nameEn: 'Hai Al-Salam', cityId: tripoli._id },
      { id: 'tripoli-mitiga', nameAr: 'معيتيقة', nameEn: 'Mitiga', cityId: tripoli._id },
      { id: 'tripoli-alsarim', nameAr: 'الصريم', nameEn: 'Al-Sarim', cityId: tripoli._id },

      // ==================== بنغازي (8 مناطق) ====================
      { id: 'benghazi-sabri', nameAr: 'صابري', nameEn: 'Sabri', cityId: benghazi._id },
      { id: 'benghazi-sidi-hussein', nameAr: 'سيدي حسين', nameEn: 'Sidi Hussein', cityId: benghazi._id },
      { id: 'benghazi-hawari', nameAr: 'الهواري', nameEn: 'Hawari', cityId: benghazi._id },
      { id: 'benghazi-laithi', nameAr: 'الليثي', nameEn: 'Laithi', cityId: benghazi._id },
      { id: 'benghazi-garyounis', nameAr: 'قاريونس', nameEn: 'Garyounis', cityId: benghazi._id },
      { id: 'benghazi-buhedma', nameAr: 'بوهديمة', nameEn: 'Buhedma', cityId: benghazi._id },
      { id: 'benghazi-hay-alandalus', nameAr: 'حي الأندلس', nameEn: 'Hay Al-Andalus', cityId: benghazi._id },
      { id: 'benghazi-al-fuwayhat', nameAr: 'الفويهات', nameEn: 'Al-Fuwayhat', cityId: benghazi._id },

      // ==================== مصراتة (5 مناطق) ====================
      { id: 'misrata-center', nameAr: 'وسط مصراتة', nameEn: 'Misrata Center', cityId: misrata._id },
      { id: 'misrata-ghushi', nameAr: 'الغوشي', nameEn: 'Ghushi', cityId: misrata._id },
      { id: 'misrata-zawiyat', nameAr: 'الزاوية', nameEn: 'Zawiyat', cityId: misrata._id },
      { id: 'misrata-dafniya', nameAr: 'دفنية', nameEn: 'Dafniya', cityId: misrata._id },
      { id: 'misrata-qasr-ahmad', nameAr: 'قصر أحمد', nameEn: 'Qasr Ahmad', cityId: misrata._id },
    ]);
    console.log(' ✅ Areas Created (طرابلس: 12 | بنغازي: 8 | مصراتة: 5).');

    // 4. SEED APPLIANCE TYPES
    console.log('\nSeeding Appliance Types...');
    const appliances = await ApplianceType.create([
      { name: 'Air Conditioner', nameAr: 'مكيف هواء', nameEn: 'Air Conditioner' },
      { name: 'Refrigerator', nameAr: 'ثلاجة', nameEn: 'Refrigerator' },
      { name: 'Washing Machine', nameAr: 'غسالة ملابس', nameEn: 'Washing Machine' },
      { name: 'Microwave', nameAr: 'مايكروويف', nameEn: 'Microwave' }
    ]);
    console.log(' ✅ Appliance Types Created.');

    // 5. SEED BRANDS
    console.log('\nSeeding Brands...');
    await Brand.create([
      { name: 'Samsung', nameAr: 'سامسونج', nameEn: 'Samsung', applianceTypes: [appliances[0]._id, appliances[1]._id, appliances[2]._id] },
      { name: 'LG', nameAr: 'إل جي', nameEn: 'LG', applianceTypes: [appliances[0]._id, appliances[1]._id] },
      { name: 'Beko', nameAr: 'بيكو', nameEn: 'Beko', applianceTypes: [appliances[1]._id, appliances[2]._id] },
      { name: 'Whirlpool', nameAr: 'ويرلبول', nameEn: 'Whirlpool', applianceTypes: [appliances[2]._id] }
    ]);
    console.log(' ✅ Brands Created.');

    // 6. SEED ADMIN USER
    console.log('\nCreating Admin Account...');
    const ainZara = await Area.findOne({ id: 'tripoli-ain-zara' });
    await User.create({
      firstName: 'عبد الرحيم',
      lastName: 'المدير',
      phone: '0900000000',
      password: 'adminpassword',
      role: 'admin',
      city: tripoli._id,
      area: ainZara._id,
      isActive: true,
      acceptedTerms: false  // الأدمن لا يحتاج إلى الشروط
    });
    console.log(' ✅ Admin Created (0900000000 / adminpassword).');

    // 7. SEED DEMO TECHNICIAN
    console.log('\nCreating Demo Technician...');
    const gargaresh = await Area.findOne({ id: 'tripoli-gargaresh' });
    const techUser = await User.create({
      firstName: 'أحمد',
      lastName: 'الخبير',
      phone: '0910000000',
      password: 'password123',
      role: 'technician',
      city: tripoli._id,
      area: gargaresh._id,
      location: {
        type: 'Point',
        coordinates: [13.1256, 32.8711] // قرقارش - طرابلس
      },
      isActive: true,
      walletBalance: 50,
      acceptedTerms: true
    });
    await TechnicianProfile.create({
      user: techUser._id,
      isVerified: true,
      specialties: [appliances[0]._id, appliances[1]._id],
      brands: [(await Brand.findOne({ nameEn: 'Samsung' }))._id],
      bio: 'فني خبير في صيانة المكيفات والثلاجات، خبرة 10 سنوات.',
      rating: 5,
      reviewCount: 1
    });
    console.log(' ✅ Technician Created (0910000000 / password123).');

    // 8. SEED DEMO CLIENT
    console.log('\nCreating Demo Client...');
    const tajoura = await Area.findOne({ id: 'tripoli-tajoura' });
    await User.create({
      firstName: 'عمر',
      lastName: 'الزبون',
      phone: '0920000000',
      password: 'password123',
      role: 'client',
      city: tripoli._id,
      area: tajoura._id,
      location: {
        type: 'Point',
        coordinates: [13.2561, 32.8128] // تاجوراء - طرابلس
      },
      isActive: true,
      acceptedTerms: true
    });
    console.log(' ✅ Client Created (0920000000 / password123).');

    console.log('\n🚀🚀🚀 MASTER SEED COMPLETED SUCCESSFULLY 🚀🚀🚀');
    console.log('📋 Summary:');
    console.log('   Cities: 3 (طرابلس, بنغازي, مصراتة)');
    console.log('   Areas: 25 (12 + 8 + 5)');
    console.log('   Users: Admin + Technician + Client');
    console.log('   Appliances: 4 | Brands: 4');

  } catch (err) {
    console.error(' ❌ SEEDING FAILED:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedSystem();
