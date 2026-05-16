const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const locationSyncService = require('../src/services/locationSyncService');

// تحميل الإعدادات
dotenv.config({ path: path.join(__dirname, '../.env') });

const sync = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/technohome';
    console.log(`📡 Connecting to: ${dbUri}`);
    
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');

    await locationSyncService.syncAll();

    console.log('🎉 Done!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Sync failed:', error);
    process.exit(1);
  }
};

sync();
