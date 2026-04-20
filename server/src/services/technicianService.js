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
      // 1. البحث عن بروفايلات الفنيين الذين لديهم هذا التخصص وموثقين من الآدمن
      const techProfiles = await TechnicianProfile.find({
        specialties: applianceTypeId,
        isVerified: true
      }).populate({
        path: 'user',
        select: 'firstName lastName phone city profileImage',
        match: { city: cityId } // الفلترة بالمدينة داخل كائن المستخدم
      });

      // 2. تصفية النتائج (لأن populate قد يعيد null للمستخدمين الذين لا يطابقون المدينة)
      const filteredTechs = techProfiles
        .filter(profile => profile.user !== null)
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

      return filteredTechs;
    } catch (error) {
      console.error('Error finding technicians:', error);
      throw error;
    }
  }
}

module.exports = new TechnicianService();
