const mongoose = require('mongoose');
const dotenv = require('dotenv');
const City = require('./src/models/core/City.model');
const Area = require('./src/models/core/Area.model');

dotenv.config();

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const cities = await City.find();
  console.log(`Found ${cities.length} cities`);
  
  for (const city of cities) {
    const areas = await Area.find({ cityId: city._id });
    console.log(`City: ${city.nameAr} (${city.id}) - Areas: ${areas.length}`);
    areas.forEach(a => console.log(`   - ${a.nameAr}`));
  }
  
  process.exit(0);
};

check();
