 const TechnicianProfile = require('../models/TechnicianProfile.model');
const User = require('../models/User.model');
const ServiceRequest = require('../models/ServiceRequest.model');

/**
 * خدمة إدارة الفنيين (Technician Discovery Service)
 * الدور: القيام بعمليات البحث والفلترة المتقدمة للفنيين.
 */
class TechnicianService {
  /**
   * البحث عن فنيين متاحين بناءً على التخصص والمدينة
   */
  async findTechniciansForBooking(applianceTypeId, cityId) {
    try {
      const query = {
        isAvailable: true,
        isVerified: true
      };
      
      if (applianceTypeId) query.specialties = applianceTypeId;
      
      console.log(`[DEBUG] Finding available techs for appliance: ${applianceTypeId}, city: ${cityId}`);

      const techProfiles = await TechnicianProfile.find(query).populate({
        path: 'user',
        select: 'firstName lastName phone city profileImage location',
        populate: { path: 'city', select: 'name nameAr' }
      });

      // تصفية النتائج حسب المدينة (بناءً على الـ ID أو الاسم الفريد)
      const filtered = techProfiles.filter(profile => {
        if (!profile.user || !profile.user.city) return false;
        if (!cityId) return true;

        const cityObj = profile.user.city;
        const userCityId = cityObj._id?.toString() || cityObj.toString();
        const userCityName = cityObj.name; // الحقل 'name' في موديل City يمثل الـ slug عادة

        return userCityId === cityId || userCityName === cityId;
      });

      // جلب عدد المهام المكتملة لكل فني دفعة واحدة
      const techIds = filtered.map(p => p.user._id);
      const completedCounts = await ServiceRequest.aggregate([
        { $match: { technician: { $in: techIds }, status: 'completed' } },
        { $group: { _id: '$technician', count: { $sum: 1 } } }
      ]);
      const completedMap = {};
      completedCounts.forEach(c => { completedMap[c._id.toString()] = c.count; });

      const result = filtered.map(profile => ({
        _id: profile.user._id,
        techId: profile.user._id,
        fullName: `${profile.user.firstName} ${profile.user.lastName}`,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        phone: profile.user.phone,
        city: profile.user.city?.nameAr || profile.user.city,
        rating: profile.rating || 0,
        reviewCount: profile.reviewCount || 0,
        completedJobs: completedMap[profile.user._id.toString()] || 0,
        yearsOfExperience: profile.yearsOfExperience || 0,
        reliabilityScore: profile.reliabilityScore || 0,
        bio: profile.bio,
        profileImage: profile.user.profileImage || null, // ✅ الصورة من User وليس TechnicianProfile
        isOnline: profile.isAvailable,
        location: profile.user.location
      }));

      console.log(`[DEBUG] Found ${result.length} technicians`);
      return result;
    } catch (error) {
      console.error('Error finding technicians:', error);
      throw error;
    }
  }

  /**
   * جلب بروفايل فني عام (للعميل) مع آخر التقييمات
   */
  async getTechnicianPublicProfile(techId) {
    const Review = require('../models/Review.model');

    const profile = await TechnicianProfile.findOne({ user: techId })
      .populate({
        path: 'user',
        select: 'firstName lastName phone city profileImage',
        populate: { path: 'city', select: 'name nameAr' }
      })
      .populate('specialties', 'nameAr')
      .lean();

    if (!profile) throw { status: 404, message: 'الفني غير موجود' };

    // عدد المهام المكتملة
    const completedJobs = await ServiceRequest.countDocuments({ technician: techId, status: 'completed' });

    // آخر التقييمات
    const reviews = await Review.find({ technician: techId })
      .populate('customer', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      _id: profile.user._id,
      fullName: `${profile.user.firstName} ${profile.user.lastName}`,
      phone: profile.user.phone,
      city: profile.user.city?.nameAr || profile.user.city,
      profileImage: profile.user.profileImage || null, // ✅ الصورة من User وليس TechnicianProfile
      rating: profile.rating || 0,
      reviewCount: profile.reviewCount || 0,
      completedJobs,
      yearsOfExperience: profile.yearsOfExperience || 0,
      reliabilityScore: profile.reliabilityScore || 0,
      specialties: profile.specialties || [],
      bio: profile.bio,
      isVerified: profile.isVerified,
      reviews
    };
  }
}

module.exports = new TechnicianService();
