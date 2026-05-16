const mongoose = require('mongoose');
require('dotenv').config();
const ServiceRequest = require('./src/models/ServiceRequest.model');
const User = require('./src/models/User.model');

async function checkTechJobs() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // البحث عن أول فني
  const tech = await User.findOne({ role: 'technician' });
  if (!tech) {
    console.log('No technician found in DB');
    process.exit();
  }

  console.log(`Checking jobs for Tech: ${tech.firstName} (${tech._id})`);

  const activeJobs = await ServiceRequest.find({
    technician: tech._id,
    status: { $in: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'] }
  });

  console.log(`Found ${activeJobs.length} active jobs.`);
  activeJobs.forEach(j => console.log(` - JobID: ${j._id}, Status: ${j.status}`));

  process.exit();
}

checkTechJobs();
