const mongoose = require('mongoose');
require('dotenv').config();
const ServiceRequest = require('./src/models/ServiceRequest.model');

async function checkAllJobs() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const allRequests = await ServiceRequest.find({}).populate('technician', 'firstName');
  console.log(`Total Requests in DB: ${allRequests.length}`);
  
  allRequests.forEach(r => {
    console.log(`- ID: ${r._id}, Status: ${r.status}, Tech: ${r.technician ? r.technician.firstName : 'NONE'}, CreatedAt: ${r.createdAt}`);
  });

  process.exit();
}

checkAllJobs();
