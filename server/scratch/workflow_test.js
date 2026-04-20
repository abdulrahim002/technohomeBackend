const mongoose = require('mongoose');
const serviceRequestService = require('../src/services/serviceRequestService');
const technicianService = require('../src/services/technicianService');
require('dotenv').config();

const TEST_USER_ID = '69e2e7be58645502fbe6596d';
const TEST_TYPE_ID = '69e3a810cc8eb22d4996d697';
const TEST_CITY_ID = '69e3a80fcc8eb22d4996d67b';

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- STARTING WORKFLOW SIMULATION ---');

    // 1. Test AI Diagnosis Only
    console.log('\n[STEP 1] Testing AI Diagnosis Only...');
    const diagnosisResult = await serviceRequestService.analyzeOnly({
      applianceType: TEST_TYPE_ID,
      brand: 'Samsung',
      problemDescription: 'المكيف يصدر صوتاً عالياً ولا يبرد'
    }, TEST_USER_ID);
    
    console.log('Result Success:', diagnosisResult.success);
    console.log('Diagnosis:', diagnosisResult.data?.aiDiagnosis?.diagnosis);
    
    const aiData = diagnosisResult.data?.aiDiagnosis;

    // 2. Test Technician Discovery
    console.log('\n[STEP 2] Testing Technician Discovery...');
    const techs = await technicianService.findTechniciansForBooking(TEST_TYPE_ID, TEST_CITY_ID);
    console.log('Technicians found:', techs.length);
    if (techs.length > 0) {
      console.log('First Tech found:', techs[0].fullName, '(ID:', techs[0].techId, ')');
    }

    // 3. Test Hybrid Booking (Using Pre-computed Diagnosis)
    console.log('\n[STEP 3] Testing Hybrid Booking (Saving Diagnostic Result + Tech)...');
    const bookingPayload = {
      applianceType: TEST_TYPE_ID,
      brand: 'Samsung',
      problemDescription: 'المكيف يصدر صوتاً عالياً ولا يبرد',
      technicianId: techs.length > 0 ? techs[0].techId : undefined,
      preComputedDiagnosis: aiData, // IMPORTANT: Avoids second AI call
      serviceAddress: { cityId: TEST_CITY_ID, details: 'شارع النصر، طرابلس' }
    };

    const request = await serviceRequestService.createRequest(bookingPayload, TEST_USER_ID);
    console.log('Service Request Created!');
    console.log('ID:', request._id);
    console.log('Status:', request.status);
    console.log('Has AI Diagnosis:', !!request.aiDiagnosis);

    console.log('\n--- SIMULATION COMPLETED SUCCESSFULLY! ---');
    process.exit(0);
  } catch (error) {
    console.error('--- SIMULATION FAILED ---');
    console.error(error);
    process.exit(1);
  }
}

runTest();
