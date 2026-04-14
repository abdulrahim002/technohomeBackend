const ServiceRequest = require('../models/ServiceRequest.model');
const Device = require('../models/Device.model');
const User = require('../models/User.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');
const Troubleshoot = require('../models/Troubleshoot.model');
const Transaction = require('../models/Transaction.model');
const visionService = require('../services/visionService');
const notificationService = require('../services/notificationService');

/**
 * Create new service request
 * POST /api/service-requests
 */
exports.createServiceRequest = async (req, res, next) => {
  try {
    const { device, problemDescription, errorCode, errorCodeImage, serviceType, preferredDate, serviceLocation, serviceAddress } = req.body;

    if (!device || !problemDescription) {
      return res.status(400).json({
        status: 'fail',
        message: 'الجهاز ووصف المشكلة مطلوبان'
      });
    }

    // Verify device exists and belongs to user
    const deviceExists = await Device.findById(device).populate('applianceType');
    if (!deviceExists || deviceExists.owner.toString() !== req.userId) {
      return res.status(404).json({
        status: 'fail',
        message: 'الجهاز غير موجود'
      });
    }

    // Input-Based Diagnostic (صيانة ذاتية تعتمد على الإدخال اليدوي الدقيق)
    let diySolution = null;
    let diagnosticMessage = 'مبدئي';

    if (errorCode) {
      const troubleshoot = await Troubleshoot.findOne({
        errorCode: errorCode.toUpperCase(),
        deviceType: deviceExists.applianceType?._id,
        isActive: true
      });

      if (troubleshoot) {
        diySolution = troubleshoot;
        diagnosticMessage = `تم التعرف بنجاح على موديل الجهاز ونوع العطل (${errorCode.toUpperCase()})`;
      } else {
        diagnosticMessage = 'لم يتم العثور على حل برمجي لهذا الكود، نحتاج لفحص فني.';
      }
    }

    const serviceRequest = await ServiceRequest.create({
      customer: req.userId,
      device,
      problemDescription,
      errorCode: errorCode ? errorCode.toUpperCase() : undefined,
      errorCodeImage,
      serviceType: serviceType || 'regular',
      preferredDate,
      serviceLocation,
      serviceAddress,
      status: 'pending'
    });

    await serviceRequest.populate('customer').populate('device').populate('technician');

    // إشعار فوري للإدارة عند الطلبات الطارئة
    if (serviceType === 'emergency') {
      await notificationService.notifyAdmins({
        senderId: req.userId,
        title: '🚨 طلب صيانة طارئ جديد!',
        message: `عميل يحتاج صيانة عاجلة للجهاز: ${deviceExists.name || 'غير محدد'}. يرجى المتابعة الفورية.`,
        type: 'emergency',
        relatedId: serviceRequest._id
      });
    }

    // إشعار الفنيين القريبين (15km) بوجود طلب جديد في منطقتهم
    if (serviceLocation && serviceLocation.coordinates) {
      await notificationService.notifyNearbyTechnicians({
        coordinates: serviceLocation.coordinates,
        maxDistanceInMeters: 15000, // 15 كم — المعيار المعتمد
        title: '🔧 طلب صيانة قريب منك',
        message: `توجد وظيفة صيانة${serviceType === 'emergency' ? ' طارئة' : ''} قريبة منك. تحقق من التفاصيل وقبل الطلب.`,
        senderId: req.userId,
        relatedId: serviceRequest._id
      });
    }

    // Return different response based on DIY availability
    if (diySolution && (diySolution.difficultyLevel === 'easy' || diySolution.difficultyLevel === 'medium')) {
      return res.status(201).json({
        status: 'success',
        statusMessage: diagnosticMessage,
        message: 'تم إنشاء طلب الصيانة، ونقترح عليك تجربة خطوات الصيانة الذاتية أولاً',
        data: {
          serviceRequest,
          diyProposal: diySolution
        }
      });
    }

    res.status(201).json({
      status: 'success',
      statusMessage: errorCode ? diagnosticMessage : 'تم الاستلام بدون كود عطل',
      message: 'تم إنشاء طلب الصيانة بنجاح وسيتم تعيين فني قريباً',
      data: { serviceRequest }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my service requests (for customer)
 * GET /api/service-requests/my-requests
 */
exports.getMyServiceRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = { customer: req.userId };

    if (status) {
      query.status = status;
    }

    const requests = await ServiceRequest.find(query)
      .populate('customer')
      .populate('device')
      .populate('technician')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        count: requests.length,
        requests
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get service request by ID
 * GET /api/service-requests/:id
 */
exports.getServiceRequestById = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customer')
      .populate('device')
      .populate('technician');

    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'طلب الصيانة غير موجود'
      });
    }

    // Check authorization
    if (request.customer._id.toString() !== req.userId && 
        request.technician?._id.toString() !== req.userId && 
        req.userRole !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحيات كافية'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update service request (Customer can update pending requests)
 * PATCH /api/service-requests/:id
 */
exports.updateServiceRequest = async (req, res, next) => {
  try {
    let request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'طلب الصيانة غير موجود'
      });
    }

    // Only customer can update pending requests
    if (request.customer.toString() !== req.userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحيات كافية'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: 'لا يمكن تعديل طلب غير معلق'
      });
    }

    const { problemDescription, preferredDate, serviceAddress } = req.body;

    if (problemDescription) request.problemDescription = problemDescription;
    if (preferredDate) request.preferredDate = preferredDate;
    if (serviceAddress) request.serviceAddress = serviceAddress;

    await request.save();
    await request.populate('customer').populate('device').populate('technician');

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث طلب الصيانة بنجاح',
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel service request (Customer can cancel pending requests)
 * POST /api/service-requests/:id/cancel
 */
exports.cancelServiceRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'طلب الصيانة غير موجود'
      });
    }

    if (request.customer.toString() !== req.userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحيات كافية'
      });
    }

    if (request.status === 'completed' || request.status === 'cancelled') {
      return res.status(400).json({
        status: 'fail',
        message: 'لا يمكن إلغاء هذا الطلب'
      });
    }

    request.status = 'cancelled';
    await request.save();
    await request.populate('customer').populate('device').populate('technician');

    res.status(200).json({
      status: 'success',
      message: 'تم إلغاء طلب الصيانة بنجاح',
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rate service request (Customer only, after completion)
 * POST /api/service-requests/:id/rate
 */
exports.rateServiceRequest = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'التقييم يجب أن يكون بين 1 و 5'
      });
    }

    let request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'طلب الصيانة غير موجود'
      });
    }

    if (request.customer.toString() !== req.userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحيات كافية'
      });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({
        status: 'fail',
        message: 'لا يمكن تقييم طلب لم يكتمل بعد'
      });
    }

    request.rating = rating;
    request.customerFeedback = feedback || '';

    await request.save();

    // Update technician rating
    const technicianProfile = await TechnicianProfile.findOne({ user: request.technician });
    if (technicianProfile) {
      const totalRating = (technicianProfile.rating.average * technicianProfile.rating.count) + rating;
      technicianProfile.rating.count += 1;
      technicianProfile.rating.average = totalRating / technicianProfile.rating.count;
      await technicianProfile.save();
    }

    await request.populate('customer').populate('device').populate('technician');

    res.status(200).json({
      status: 'success',
      message: 'تم تقييم الطلب بنجاح',
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Find nearby technicians (Geo-filtering)
 * GET /api/service-requests/find-technicians?lat=&lng=&radius=
 */
exports.findNearbyTechnicians = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        status: 'fail',
        message: 'الموقع الجغرافي مطلوب (lat, lng)'
      });
    }

    const technicians = await User.find({
      role: 'technician',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    }).populate('technicianProfile');

    res.status(200).json({
      status: 'success',
      data: {
        count: technicians.length,
        technicians
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Technician starts the trip to customer
 * PATCH /api/service-requests/:id/start-trip
 * @access Private (Technician only)
 */
exports.startTrip = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
    }

    // فقط الفني المعيّن يملك صلاحية هذا الإجراء
    if (!request.technician || request.technician.toString() !== req.userId) {
      return res.status(403).json({ status: 'fail', message: 'ليس لديك صلاحية' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({
        status: 'fail',
        message: 'لا يمكن بدء الرحلة إلا بعد قبول الطلب (accepted)'
      });
    }

    request.status = 'on_the_way';
    await request.save();

    // إشعار العميل بأن الفني في الطريق
    await notificationService.createNotification({
      recipientId: request.customer,
      senderId: req.userId,
      title: '🚗 الفني في الطريق إليك',
      message: 'الفني المعيّن لطلبك بدأ رحلته نحوك. يرجى التواجد في المنزل.',
      type: 'order',
      relatedId: request._id
    });

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث الحالة: الفني في الطريق',
      data: { requestId: request._id, status: request.status }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Technician marks arrival at customer location
 * PATCH /api/service-requests/:id/arrive
 * @access Private (Technician only)
 */
exports.arriveAtLocation = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ status: 'fail', message: 'الطلب غير موجود' });
    }

    if (!request.technician || request.technician.toString() !== req.userId) {
      return res.status(403).json({ status: 'fail', message: 'ليس لديك صلاحية' });
    }

    // منطق الحالة: لا يُسمح بالوصول إلا بعد أن يكون الفني 'في الطريق'
    if (request.status !== 'on_the_way') {
      return res.status(400).json({
        status: 'fail',
        message: 'لا يمكن تسجيل الوصول إلا إذا كانت الحالة الحالية (on_the_way)'
      });
    }

    request.status = 'arrived';
    request.startedAt = new Date(); // بدء احتساب وقت الصيانة الفعلي
    await request.save();

    // إشعار العميل بوصول الفني
    await notificationService.createNotification({
      recipientId: request.customer,
      senderId: req.userId,
      title: '✅ وصل الفني',
      message: 'وصل الفني إلى موقعك. سيبدأ العمل على إصلاح الجهاز الآن.',
      type: 'order',
      relatedId: request._id
    });

    res.status(200).json({
      status: 'success',
      message: 'تم تسجيل وصول الفني وبدأت الصيانة',
      data: { requestId: request._id, status: request.status, startedAt: request.startedAt }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Technician accepts a service request
 * PATCH /api/service-requests/:id/accept
 * @access Private (Technician only)
 */
exports.acceptRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'طلب الصيانة غير موجود'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: 'يمكن قبول الطلبات المعلقة فقط'
      });
    }

    // التحقق من رصيد المحفظة (خصم عمولة ثابتة 5 دينار)
    const technician = await User.findById(req.userId);
    const COMMISSION_RATE = 5;

    if (!technician.walletBalance || technician.walletBalance < COMMISSION_RATE) {
      return res.status(400).json({
        status: 'fail',
        message: 'عذراً، رصيدك غير كافٍ للقيام بهذه العملية. يرجى شحن محفظتك أولاً.'
      });
    }

    // خصم العمولة وتحديث حالة الطلب
    technician.walletBalance -= COMMISSION_RATE;
    await technician.save();

    // تسجيل المعاملة المالية
    await Transaction.create({
      user: technician._id,
      amount: -COMMISSION_RATE,
      type: 'commission_deduction',
      description: `خصم عمولة قبول طلب الصيانة برقم: ${request._id}`,
      relatedId: request._id,
      status: 'completed'
    });

    // تعيين الفني للطلب
    request.technician = req.userId;
    request.status = 'accepted';
    request.acceptedAt = Date.now();
    await request.save();

    // إرسال إشعار مالي للفني بخصم العمولة
    await notificationService.createNotification({
      recipientId: technician._id,
      title: '💸 خصم عمولة المنصة',
      message: `تم خصم ${COMMISSION_RATE} دينار من رصيدك مقابل قبول الطلب الجديد. رصيدك المتبقي: ${technician.walletBalance} دينار.`,
      type: 'system'
    });

    // إشعار العميل بقبول طلبه
    await notificationService.createNotification({
      recipientId: request.customer,
      senderId: req.userId,
      title: '✅ تم قبول طلبك',
      message: `تم قبول طلب الصيانة الخاص بك من قبل الفني: ${technician.fullName || technician.firstName}. سيبدأ الفني التواصل معك قريباً.`,
      type: 'order',
      relatedId: request._id
    });

    res.status(200).json({
      status: 'success',
      message: 'تم قبول طلب الصيانة وخصم العمولة بنجاح',
      data: {
        request,
        newBalance: technician.walletBalance
      }
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Mark expert system (DIY path) as completed
 * PATCH /api/service-requests/:id/expert-complete
 * @access Private (Customer only)
 */
exports.completeExpertSystem = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ status: 'fail', message: 'طلب الصيانة غير موجود' });
    }

    if (request.customer.toString() !== req.userId) {
      return res.status(403).json({ status: 'fail', message: 'غير مصرح لك بهذا الإجراء' });
    }

    // إرسال إشعار اكتمال التشخيص بنجاح
    await notificationService.createNotification({
      recipientId: req.userId,
      title: '🧠 اكتمل التشخيص الذكي',
      message: 'تم تشخيص العطل بنجاح، يمكنك الآن اختيار طلب فني أو اتباع خطوات الإصلاح المقترحة في صفحة الطلب.',
      type: 'system',
      relatedId: request._id
    });

    res.status(200).json({
      status: 'success',
      message: 'تم تسجيل اكتمال التشخيص بنجاح'
    });
  } catch (error) {
    next(error);
  }
};