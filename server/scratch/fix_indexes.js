const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const collection = mongoose.connection.collection('users');
    
    // Drop the old email_1 index
    try {
      await collection.dropIndex('email_1');
      console.log('Successfully dropped index: email_1');
    } catch (e) {
      console.log('Index email_1 not found, skipping drop.');
    }

    console.log('Indexes will be recreated automatically by Mongoose on next start.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error fixing indexes:', err);
    process.exit(1);
  }
}

fixIndexes();
