const mongoose = require('mongoose');
const User = require('./src/models/User.model');
const TechnicianProfile = require('./src/models/TechnicianProfile.model');
const City = require('./src/models/core/City.model');
const ApplianceType = require('./src/models/ApplianceType.model');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Get all cities
    const cities = await City.find();
    console.log('\nCities:', cities.map(c => ({ id: c._id, name: c.nameAr })));

    // 2. Get all appliance types
    const applianceTypes = await ApplianceType.find();
    console.log('\nAppliance Types:', applianceTypes.map(at => ({ id: at._id, name: at.nameAr })));

    // 3. Get all verified technicians
    const techProfiles = await TechnicianProfile.find().populate('user');
    console.log('\nAll Technician Profiles:', techProfiles.map(tp => ({
      id: tp._id,
      name: tp.user ? `${tp.user.firstName} ${tp.user.lastName}` : 'No user',
      city: tp.user?.city,
      specialties: tp.specialties,
      isVerified: tp.isVerified
    })));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkData();
