const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Load models
require('../src/models/core/City.model');
const User = require('../src/models/User.model');
const ApplianceType = require('../src/models/ApplianceType.model');
const ServiceRequestService = require('../src/services/serviceRequestService');

async function testImageStorage() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ role: 'client' });
    const appliance = await ApplianceType.findOne({ nameAr: /مكيف/ });

    if (!user || !appliance) {
      console.log("❌ Missing test data.");
      return;
    }

    const payload = {
      applianceType: appliance._id.toString(),
      brand: "TestBrand",
      bookingDate: new Date(),
      problemDescription: "اختبار لرفع الصور",
      serviceAddress: { cityId: user.city },
      images: ["uploads/requests/test1.jpg", "uploads/requests/test2.jpg"]
    };

    const result = await ServiceRequestService.createRequest(payload, user._id);
    
    if (result.images && result.images.length === 2) {
      console.log("✅ Image array stored successfully!");
      console.log("Stored Images:", result.images);
    } else {
      console.log("❌ Image storage failed.");
    }

  } catch (error) {
    console.error("❌ Test error:", error);
  } finally {
    await mongoose.connection.close();
  }
}

testImageStorage();
