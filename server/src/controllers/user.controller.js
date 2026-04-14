const User = require('../models/User.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');

/**
 * Get user profile
 * GET /api/users/profile
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PATCH /api/users/profile
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, profileImage, bio, address } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;
    if (bio) user.bio = bio;
    if (address) user.address = address;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث البروفايل بنجاح',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user location
 * PATCH /api/users/location
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({
        status: 'fail',
        message: 'الموقع الجغرافي مطلوب (longitude, latitude)'
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    user.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث الموقع بنجاح',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get technician profile
 * GET /api/users/technician-profile
 */
exports.getTechnicianProfile = async (req, res, next) => {
  try {
    const profile = await TechnicianProfile.findOne({ user: req.userId })
      .populate('user');

    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: 'ملف الفني غير موجود'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update technician profile
 * PATCH /api/users/technician-profile
 */
exports.updateTechnicianProfile = async (req, res, next) => {
  try {
    const { specialty, specialtyAr, experienceYears, serviceAreas, baseServiceFee, emergencyServiceFee } = req.body;

    let profile = await TechnicianProfile.findOne({ user: req.userId });

    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: 'ملف الفني غير موجود'
      });
    }

    if (specialty) profile.specialty = specialty;
    if (specialtyAr) profile.specialtyAr = specialtyAr;
    if (experienceYears !== undefined) profile.experienceYears = experienceYears;
    if (serviceAreas) profile.serviceAreas = serviceAreas;
    if (baseServiceFee !== undefined) profile.baseServiceFee = baseServiceFee;
    if (emergencyServiceFee !== undefined) profile.emergencyServiceFee = emergencyServiceFee;

    await profile.save();
    await profile.populate('user');

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث ملف الفني بنجاح',
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload verification documents (Technician)
 * POST /api/users/upload-documents
 */
exports.uploadVerificationDocuments = async (req, res, next) => {
  try {
    const { documents } = req.body; // Array of {documentUrl, documentType}

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        status: 'fail',
        message: 'المستندات مطلوبة'
      });
    }

    const profile = await TechnicianProfile.findOne({ user: req.userId });

    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: 'ملف الفني غير موجود'
      });
    }

    profile.verificationDocuments = documents.map(doc => ({
      ...doc,
      status: 'pending'
    }));

    profile.verificationStatus = 'pending';

    await profile.save();
    await profile.populate('user');

    res.status(200).json({
      status: 'success',
      message: 'تم رفع المستندات بنجاح. سيتم التحقق منها قريباً',
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update FCM Token (for Push Notifications)
 * PATCH /api/users/fcm-token
 */
exports.updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'FCM Token مطلوب'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { fcmToken },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث معرف الجهاز بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (Admin only)
 * GET /api/users/:userId
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List technicians based on city and specialty (for Customers)
 * GET /api/users/technicians
 */
exports.listTechnicians = async (req, res, next) => {
  try {
    const { city, specialty } = req.query;
    
    // بناء استعلام البحث
    let query = { role: 'technician', isActive: true };
    
    // فلترة حسب المدينة إذا تم توفيرها
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    // البحث عن المستخدمين أولاً
    let users = await User.find(query).select('-password');

    // جلب ملفات الفنيين لفلترة التخصص
    const technicianIds = users.map(u => u._id);
    
    let profileQuery = { user: { $in: technicianIds } };
    
    // فلترة حسب التخصص (بحث جزئي في القائمة)
    if (specialty) {
      profileQuery.$or = [
        { specialties: { $in: [specialty.toLowerCase()] } },
        { specialtiesAr: { $regex: specialty, $options: 'i' } }
      ];
    }

    const profiles = await TechnicianProfile.find(profileQuery).populate('user');

    // استخراج الفنيين النهائيين من البروفايلات
    const finalTechnicians = profiles.map(p => {
      const userObj = p.user.toObject();
      return {
        ...userObj,
        technicianProfile: p._id,
        specialtiesAr: p.specialtiesAr,
        experienceYears: p.experienceYears,
        rating: p.rating
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        count: finalTechnicians.length,
        users: finalTechnicians
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports.default = exports;
