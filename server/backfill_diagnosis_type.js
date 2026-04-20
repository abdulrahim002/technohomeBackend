const mongoose = require('mongoose');
const ServiceRequest = require('./src/models/ServiceRequest.model');
require('dotenv').config();

async function backfillDiagnosisType() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const requests = await ServiceRequest.find({ diagnosisType: { $in: [null, 'none'] } });
    console.log(`Found ${requests.length} requests to update.`);

    let updatedCount = 0;
    for (const req of requests) {
      // الاستنتاج من وصف المشكلة
      if (req.problemDescription && req.problemDescription.includes('كود الخطأ')) {
        req.diagnosisType = 'manual';
      } else if (req.aiDiagnosis && req.aiDiagnosis.diagnosis && !req.aiDiagnosis.diagnosis.includes('قيد المعالجة')) {
        req.diagnosisType = 'ai';
      } else {
        req.diagnosisType = 'none';
      }
      await req.save();
      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} requests.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

backfillDiagnosisType();
