 const TechnicianProfile = require('../models/TechnicianProfile.model');
const User = require('../models/User.model');

/**
 * خدمة إدارة الفنيين (Technician Discovery Service)
 * الدور: القيام بعمليات البحث والفلترة المتقدمة للفنيين.
 */
class TechnicianService {
  /**
   * البحث عن فنيين متاحين بناءً على التخصص والمدينة
   * @param {string} applianceTypeId - معرف نوع الجهاز (ObjectId)
   * @param {string} cityId - معرف المدينة (ObjectId)
   */
  async findTechniciansForBooking(applianceTypeId, cityId) {
    try {
      // 1. البحث عن بروفايلات الفنيين (فلترة التخصص والتوثيق)
      const query = {};
      if (applianceTypeId) query.specialties = applianceTypeId;
      
      console.log(`[DEBUG] Finding techs for appliance: ${applianceTypeId}, city: ${cityId}`);

      const techProfiles = await TechnicianProfile.find(query).populate({
        path: 'user',
        select: 'firstName lastName phone city profileImage',
      });

      // 2. تصفية النتائج يدوياً للتأكد من مطابقة المدينة (String vs ObjectId)
      const filteredTechs = techProfiles
        .filter(profile => {
          if (!profile.user) return false;
          // تحويل المعرفات لنصوص للمقارنة الدقيقة
          const userCity = profile.user.city?.toString();
          const targetCity = cityId?.toString();
          return !targetCity || userCity === targetCity;
        })
        .map(profile => ({
          techId: profile.user._id,
          fullName: `${profile.user.firstName} ${profile.user.lastName}`,
          phone: profile.user.phone,
          city: profile.user.city,
          rating: profile.rating,
          reviewCount: profile.reviewCount,
          yearsOfExperience: profile.yearsOfExperience,
          bio: profile.bio,
          profileImage: profile.profileImage
        }));

      console.log(`[DEBUG] Found ${filteredTechs.length} technicians`);
      return filteredTechs;
    } catch (error) {
      console.error('Error finding technicians:', error);
      throw error;
    }
  }
}

module.exports = new TechnicianService();
