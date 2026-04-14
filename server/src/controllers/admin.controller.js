const User = require('../models/User.model');
const TechnicianProfile = require('../models/TechnicianProfile.model');
const ServiceRequest = require('../models/ServiceRequest.model');
const Brand = require('../models/Brand.model');
const ApplianceType = require('../models/ApplianceType.model');
const Troubleshoot = require('../models/Troubleshoot.model');
const Transaction = require('../models/Transaction.model');
const notificationService = require('../services/notificationService');
const reportService = require('../services/reportService');

/**
 * Get all users (Admin only)
 * GET /api/admin/users
 */
// الحصول على جميع المستخدمين
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;
    let query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        count: users.length,
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending technician applications
 * GET /api/admin/technicians/pending
 */
// الحصول على طلبات الفنيين المعلقة
exports.getPendingTechnicians = async (req, res, next) => {
  try {
    const technicians = await TechnicianProfile.find({ verificationStatus: 'pending' })
      .populate('user')
      .sort({ createdAt: -1 });

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
 * Approve technician application
 * POST /api/admin/technicians/:technicianId/approve
 */
// الموافقة على طلب الفني
exports.approveTechnician = async (req, res, next) => {
  try {
    const profile = await TechnicianProfile.findById(req.params.technicianId);

    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: 'ملف الفني غير موجود'
      });
    }

    profile.verificationStatus = 'verified';
    profile.verificationDocuments.forEach(doc => {
      doc.status = 'approved';
    });

    await profile.save();

    // Update user verification status
    // تحديث حالة المستخدم
    await User.findByIdAndUpdate(profile.user, { isVerified: true });

    await profile.populate('user');

    // إشعار الفني بقبول طلبه
    await notificationService.createNotification({
      recipientId: profile.user._id || profile.user,
      title: 'تم قبول طلبك! 🎉',
      message: 'تهانينا! تم التحقق من حسابك كفني معتمد. يمكنك الآن استقبال طلبات الصيانة.',
      type: 'system'
    });

    res.status(200).json({
      status: 'success',
      message: 'تم الموافقة على طلب الفني بنجاح',
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject technician application
 * POST /api/admin/technicians/:technicianId/reject
 */
// رفض طلب الفني
exports.rejectTechnician = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    const profile = await TechnicianProfile.findById(req.params.technicianId);

    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: 'ملف الفني غير موجود'
      });
    }

    profile.verificationStatus = 'rejected';
    profile.verificationDocuments.forEach(doc => {
      doc.status = 'rejected';
      doc.rejectedReason = rejectionReason || 'لم يتم توفير سبب';
    });

    await profile.save();
    await profile.populate('user');

    res.status(200).json({
      status: 'success',
      message: 'تم رفض طلب الفني',
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suspend/Unsuspend user account
 * POST /api/admin/users/:userId/toggle-status
 */
// تعطيل/تفعيل حساب المستخدم
exports.toggleUserStatus = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `تم ${user.isActive ? 'تفعيل' : 'تعطيل'} حساب المستخدم`,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user identity manually
 * POST /api/admin/users/:userId/verify
 */
exports.verifyUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'تم تأكيد هوية المستخدم بنجاح',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject user identity manually
 * POST /api/admin/users/:userId/reject
 */
exports.rejectUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    user.isVerified = false;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'تم رفض/إلغاء توثيق هوية المستخدم',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all service requests (Admin Dashboard)
 * GET /api/admin/service-requests
 */
// الحصول على جميع طلبات الخدمة
exports.getAllServiceRequests = async (req, res, next) => {
  try {
    const { status, serviceType } = req.query;
    let query = {};

    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;

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
 * Get system statistics/analytics
 * GET /api/admin/statistics
 */
// الحصول على إحصائيات النظام
exports.getStatistics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalTechnicians = await User.countDocuments({ role: 'technician' });
    const pendingTechnicians = await TechnicianProfile.countDocuments({ verificationStatus: 'pending' });

    const totalServiceRequests = await ServiceRequest.countDocuments();
    const completedRequests = await ServiceRequest.countDocuments({ status: 'completed' });
    const pendingRequests = await ServiceRequest.countDocuments({ status: 'pending' });
    const emergencyRequests = await ServiceRequest.countDocuments({ serviceType: 'emergency' });

    const totalBrands = await Brand.countDocuments();
    const totalApplianceTypes = await ApplianceType.countDocuments();

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          technicians: totalTechnicians,
          pendingVerification: pendingTechnicians
        },
        serviceRequests: {
          total: totalServiceRequests,
          completed: completedRequests,
          pending: pendingRequests,
          emergency: emergencyRequests
        },
        system: {
          brands: totalBrands,
          applianceTypes: totalApplianceTypes
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create appliance type (Admin only)
 * POST /api/admin/appliance-types
 */
// إنشاء نوع جهاز
exports.createApplianceType = async (req, res, next) => {
  try {
    const { nameAr, nameEn, category, commonProblems } = req.body;

    if (!nameAr || !nameEn) {
      return res.status(400).json({
        status: 'fail',
        message: 'الاسم بالعربية والإنجليزية مطلوبان'
      });
    }

    const applianceType = await ApplianceType.create({
      name: `${nameAr}-${nameEn}`,
      nameAr,
      nameEn,
      category: category || 'other',
      commonProblems: commonProblems || []
    });

    // Auto-create a default Troubleshoot Tree for this new device
    const defaultTroubleshoot = await Troubleshoot.create({
      title: `التشخيص الافتراضي للجهاز: ${nameAr}`,
      deviceType: applianceType._id,
      errorCode: 'GENERAL', // A general placeholder code
      problemDescription: 'حل تشخيصي افتراضي لجميع مشاكل هذا الجهاز',
      difficultyLevel: 'easy',
      diagnosticSteps: [
        {
          stepId: 'root_question',
          question: `ما هو رمز الخطأ الذي يظهر على ${nameAr}؟`,
          options: [
            { answerText: 'لا يوجد رمز محدد', suggestedSolution: 'حاول إطفاء الجهاز وفصله عن التيار الكهربائي لمدة 10 دقائق ثم إعادة تشغيله.' }
          ]
        }
      ]
    });

    res.status(201).json({
      status: 'success',
      message: 'تم إنشاء نوع الجهاز مع عقدة التشخيص الافتراضية بنجاح',
      redirectHint: `/admin/troubleshoots/edit/${defaultTroubleshoot._id}`,
      data: {
        applianceType,
        defaultTroubleshootId: defaultTroubleshoot._id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all appliance types
 * GET /api/admin/appliance-types
 */
// الحصول على جميع أنواع الأجهزة
exports.getAllApplianceTypes = async (req, res, next) => {
  try {
    const applianceTypes = await ApplianceType.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        count: applianceTypes.length,
        applianceTypes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update appliance type
 * PATCH /api/admin/appliance-types/:id
 */
exports.updateApplianceType = async (req, res, next) => {
  try {
    const applianceType = await ApplianceType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!applianceType) {
      return res.status(404).json({
        status: 'fail',
        message: 'نوع الجهاز غير موجود'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث البيانات بنجاح',
      data: { applianceType }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete appliance type
 * DELETE /api/admin/appliance-types/:id
 */
exports.deleteApplianceType = async (req, res, next) => {
  try {
    const applianceType = await ApplianceType.findByIdAndDelete(req.params.id);

    if (!applianceType) {
      return res.status(404).json({
        status: 'fail',
        message: 'نوع الجهاز غير موجود'
      });
    }

    // Cascade Delete: Remove all Troubleshoot nodes linked to this ApplianceType
    const deleteResult = await Troubleshoot.deleteMany({ deviceType: req.params.id });

    res.status(200).json({
      status: 'success',
      message: `تم حذف الجهاز وحذف (${deleteResult.deletedCount}) مسار تشخيصي مرتبط به بنجاح.`,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manual Top-Up for User Wallet (Technician)
 * POST /api/admin/users/:userId/top-up
 */
exports.manualTopUp = async (req, res, next) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'المبلغ مطلوب ويجب أن يكون أكبر من صفر'
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'المستخدم غير موجود'
      });
    }

    // Update wallet balance
    user.walletBalance = (user.walletBalance || 0) + parseFloat(amount);
    await user.save();

    // Create transaction record
    await Transaction.create({
      user: user._id,
      amount: parseFloat(amount),
      type: 'top-up',
      description: description || 'شحن يدوي من قبل الإدارة',
      status: 'completed'
    });

    // Notify user
    await notificationService.createNotification({
      recipientId: user._id,
      title: '💰 تم شحن محفظتك',
      message: `تم إضافة ${amount} دينار إلى محفظتك بنجاح. رصيدك الحالي هو ${user.walletBalance} دينار.`,
      type: 'system'
    });

    res.status(200).json({
      status: 'success',
      message: 'تم شحن الرصيد بنجاح',
      data: {
        userId: user._id,
        newBalance: user.walletBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Service Requests Report
 * GET /api/admin/reports/service-requests
 */
exports.exportServiceRequestsReport = async (req, res, next) => {
  try {
    const { format = 'excel', status, fromDate, toDate } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const requests = await ServiceRequest.find(query)
      .populate('customer', 'firstName lastName')
      .populate('technician', 'firstName lastName')
      .populate('device', 'name')
      .sort({ createdAt: -1 });

    if (format === 'pdf') {
       const reportData = {
         title: 'تقرير طلبات الصيانة',
         subtitle: `الفترة: ${fromDate || 'البداية'} إلى ${toDate || 'الآن'}`,
         headers: ['التاريخ', 'العميل', 'الفني', 'الجهاز', 'الحالة'],
         rows: requests.map(r => [
           r.createdAt.toLocaleDateString('ar-EG'),
           r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : '---',
           r.technician ? `${r.technician.firstName} ${r.technician.lastName}` : 'لم يحدد',
           r.device ? r.device.name : '---',
           r.status
         ])
       };
       res.setHeader('Content-Type', 'application/pdf');
       res.setHeader('Content-Disposition', 'attachment; filename=service_requests_report.pdf');
       return reportService.generatePDF(reportData, res);
    } 
    
    // Default Excel
    const columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'العميل', key: 'customer', width: 25 },
      { header: 'الفني', key: 'technician', width: 25 },
      { header: 'الجهاز', key: 'device', width: 20 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'التكلفة الإجمالية', key: 'totalPrice', width: 15 }
    ];

    const rows = requests.map(r => ({
      date: r.createdAt.toLocaleDateString('ar-EG'),
      customer: r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : '---',
      technician: r.technician ? `${r.technician.firstName} ${r.technician.lastName}` : 'لم يحدد',
      device: r.device ? r.device.name : '---',
      status: r.status,
      totalPrice: r.totalPrice || 0
    }));

    const workbook = await reportService.generateExcel('Service Requests', columns, rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=service_requests.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    next(error);
  }
};

/**
 * Export Financial Report
 * GET /api/admin/reports/financial
 */
exports.exportFinancialReport = async (req, res, next) => {
  try {
    const { format = 'excel', fromDate, toDate } = req.query;
    
    let query = {};
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'firstName lastName role')
      .sort({ createdAt: -1 });

    if (format === 'pdf') {
       const reportData = {
         title: 'التقرير المالي وحركات المحفظة',
         subtitle: `الفترة: ${fromDate || 'البداية'} إلى ${toDate || 'الآن'}`,
         headers: ['التاريخ', 'المستخدم', 'النوع', 'المبلغ', 'الوصف'],
         rows: transactions.map(t => [
           t.createdAt.toLocaleDateString('ar-EG'),
           t.user ? `${t.user.firstName} ${t.user.lastName}` : '---',
           t.type,
           `${t.amount} ر.س`,
           t.description || '---'
         ])
       };
       res.setHeader('Content-Type', 'application/pdf');
       res.setHeader('Content-Disposition', 'attachment; filename=financial_report.pdf');
       return reportService.generatePDF(reportData, res);
    } 

    // Default Excel
    const columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'المستخدم', key: 'user', width: 25 },
      { header: 'الدور', key: 'role', width: 15 },
      { header: 'النوع', key: 'type', width: 20 },
      { header: 'المبلغ', key: 'amount', width: 15 },
      { header: 'الوصف', key: 'description', width: 40 }
    ];

    const rows = transactions.map(t => ({
      date: t.createdAt.toLocaleDateString('ar-EG'),
      user: t.user ? `${t.user.firstName} ${t.user.lastName}` : '---',
      role: t.user ? t.user.role : '---',
      type: t.type,
      amount: t.amount,
      description: t.description || '---'
    }));

    const workbook = await reportService.generateExcel('Financial Report', columns, rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=financial_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    next(error);
  }
};
