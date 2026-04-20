const mongoose = require('mongoose');
const TechnicianProfile = require('./src/models/TechnicianProfile.model');
require('dotenv').config();

async function fixTechs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Verify all technicians for testing purposes
    const result = await TechnicianProfile.updateMany({}, { $set: { isVerified: true } });
    console.log(`Verified ${result.modifiedCount} technicians.`);

    // Also, let's make sure Ahmad has some specialties if he's the only one verified
    // But since I verified all, Kamal and Snais should now show up.

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixTechs();
