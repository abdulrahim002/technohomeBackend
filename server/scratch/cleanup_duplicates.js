// scratch/cleanup_duplicates.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ApplianceType = require('../src/models/ApplianceType.model');
const Brand = require('../src/models/Brand.model');

dotenv.config();

async function cleanup() {
  try {
    console.log('--- STARTING CLEANUP ---');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // تنظيف الأجهزة المكررة
    await removeDuplicates(ApplianceType, 'nameAr');
    await removeDuplicates(ApplianceType, 'nameEn');
    
    // تنظيف الماركات المكررة
    await removeDuplicates(Brand, 'nameAr');
    await removeDuplicates(Brand, 'nameEn');

    console.log('--- CLEANUP COMPLETED ---');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

async function removeDuplicates(Model, fieldName) {
  const duplicates = await Model.aggregate([
    { $group: { _id: `$${fieldName}`, count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  for (const dup of duplicates) {
    console.log(`Found ${dup.count} duplicates for ${fieldName}: ${dup._id}. Keeping the first one...`);
    const idsToRemove = dup.ids.slice(1);
    await Model.deleteMany({ _id: { $in: idsToRemove } });
  }
}

cleanup();
