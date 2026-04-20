const mongoose = require('mongoose');
const TechnicianProfile = require('./src/models/TechnicianProfile.model');
const ApplianceType = require('./src/models/ApplianceType.model');
require('dotenv').config();

async function addSpecialties() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all appliance types
    const appliances = await ApplianceType.find();
    const applianceIds = appliances.map(a => a._id);

    if (applianceIds.length === 0) {
      console.log('No appliance types found.');
      process.exit(0);
    }

    // Give all technicians all specialties for testing purposes
    // So they appear in every search
    const result = await TechnicianProfile.updateMany({}, { 
      $set: { 
        specialties: applianceIds,
        isVerified: true 
      } 
    });

    console.log(`Updated ${result.modifiedCount} technician profiles to have all specialties.`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

addSpecialties();
