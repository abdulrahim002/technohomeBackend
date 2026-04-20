const mongoose = require('mongoose');
const User = require('./src/models/User.model');
const TechnicianProfile = require('./src/models/TechnicianProfile.model');
const City = require('./src/models/core/City.model');
const ApplianceType = require('./src/models/ApplianceType.model');
require('dotenv').config();

async function seedTestTechnician() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB...');

    // 1. Get a city and an appliance type
    const city = await City.findOne({ nameAr: 'طرابلس' });
    const appliance = await ApplianceType.findOne({ nameAr: 'مكيف هواء' });

    if (!city || !appliance) {
      console.error('City or Appliance not found. Please run master_seed.js first.');
      process.exit(1);
    }

    // 2. Create a Technician User
    const techUser = await User.findOneAndUpdate(
      { phone: '0910000000' },
      {
        firstName: 'أحمد',
        lastName: 'الخبير',
        phone: '0910000000',
        password: 'password123', // سيتم تشفيره في الـ pre-save
        role: 'technician',
        city: city._id,
        isActive: true,
        isVerified: true
      },
      { upsert: true, new: true }
    );

    // 3. Create/Update Technician Profile
    await TechnicianProfile.findOneAndUpdate(
      { user: techUser._id },
      {
        specialties: [appliance._id],
        yearsOfExperience: 10,
        bio: 'خبير في صيانة جميع أنواع المكيفات المركزية والمنزلية.',
        isVerified: true,
        rating: 4.9,
        reviewCount: 25
      },
      { upsert: true }
    );

    console.log('✅ Test Technician seeded successfully in Tripoli for Air Conditioners!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedTestTechnician();
