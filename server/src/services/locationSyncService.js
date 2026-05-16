const City = require('../models/core/City.model');
const Area = require('../models/core/Area.model');
const locationsData = require('../constants/libya-locations.json');

/**
 * LocationSyncService - المسؤول عن مزامنة البيانات من ملف الـ JSON إلى قاعدة البيانات
 */
class LocationSyncService {
  /**
   * المزامنة الشاملة للمدن والمناطق
   */
  async syncAll() {
    console.log('🚀 Starting Location Synchronization...');
    
    for (const cityData of locationsData) {
      try {
        // 1. مزامنة المدينة - نحاول البحث بالـ ID أولاً ثم بالاسم لتبني السجلات القديمة
        let city = await City.findOne({ id: cityData.id });
        
        if (!city) {
          city = await City.findOne({ name: cityData.nameEn });
        }
        
        const cityPayload = {
          id: cityData.id,
          name: cityData.nameEn, // نستخدم الاسم الإنجليزي كـ slug افتراضي
          nameAr: cityData.nameAr,
          nameEn: cityData.nameEn,
          latitude: cityData.latitude,
          longitude: cityData.longitude,
          isActive: true
        };

        if (city) {
          await City.findByIdAndUpdate(city._id, cityPayload);
          console.log(`✅ Updated City: ${cityData.nameAr}`);
        } else {
          city = await City.create(cityPayload);
          console.log(`✨ Created City: ${cityData.nameAr}`);
        }

        // 2. مزامنة المناطق التابعة لهذه المدينة
        if (cityData.areas && cityData.areas.length > 0) {
          for (const areaData of cityData.areas) {
            let area = await Area.findOne({ id: areaData.id });
            
            const areaPayload = {
              id: areaData.id,
              nameAr: areaData.nameAr,
              nameEn: areaData.nameEn,
              cityId: city._id,
              isActive: true
            };

            if (area) {
              await Area.findByIdAndUpdate(area._id, areaPayload);
            } else {
              await Area.create(areaPayload);
              console.log(`   🔹 Created Area: ${areaData.nameAr}`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error syncing city ${cityData.nameAr}:`, error.message);
      }
    }
    
    console.log('🏁 Location Synchronization Completed!');
  }
}

module.exports = new LocationSyncService();
