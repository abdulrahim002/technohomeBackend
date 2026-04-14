const Device = require('../models/Device.model');
const User = require('../models/User.model');

/**
 * Get all devices for current user
 * GET /api/devices
 */
exports.getMyDevices = async (req, res, next) => {
  try {
    const devices = await Device.find({ owner: req.userId })
      .populate('brand')
      .populate('applianceType')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        count: devices.length,
        devices
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get device by ID
 * GET /api/devices/:id
 */
exports.getDeviceById = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('brand')
      .populate('applianceType');

    if (!device) {
      return res.status(404).json({
        status: 'fail',
        message: 'الجهاز غير موجود'
      });
    }

    // Check if user is the owner or admin
    if (device.owner.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحيات كافية'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        device
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new device
 * POST /api/devices
 */
exports.createDevice = async (req, res, next) => {
  try {
    const { brand, applianceType, modelName, serialNumber, purchaseDate, warrantyExpiry, notes, images } = req.body;

    if (!brand || !applianceType) {
      return res.status(400).json({
        status: 'fail',
        message: 'العلامة التجارية ونوع الجهاز مطلوبان'
      });
    }

    const device = await Device.create({
      owner: req.userId,
      brand,
      applianceType,
      modelName,
      serialNumber,
      purchaseDate,
      warrantyExpiry,
      notes,
      images: images || []
    });

    await device.populate(['brand', 'applianceType']);

    res.status(201).json({
      status: 'success',
      message: 'تم إضافة الجهاز بنجاح',
      data: {
        device
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update device
 * PATCH /api/devices/:id
 * تحديث الجهاز
 */
exports.updateDevice = async (req, res, next) => {
  try {
    let device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        status: 'fail',
        message: 'الجهاز غير موجود'
      });
    }

    // Check if user is the owner or admin
    if (device.owner.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحيات كافية'
      });
    }

    const { brand, applianceType, modelName, serialNumber, purchaseDate, warrantyExpiry, notes, images, isActive } = req.body;

    if (brand) device.brand = brand;
    if (applianceType) device.applianceType = applianceType;
    if (modelName) device.modelName = modelName;
    if (serialNumber) device.serialNumber = serialNumber;
    if (purchaseDate) device.purchaseDate = purchaseDate;
    if (warrantyExpiry) device.warrantyExpiry = warrantyExpiry;
    if (notes) device.notes = notes;
    if (images) device.images = images;
    if (isActive !== undefined) device.isActive = isActive;

    await device.save();
    await device.populate(['brand', 'applianceType']);

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث الجهاز بنجاح',
      data: {
        device
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete device
 * DELETE /api/devices/:id
 * حذف الجهاز
 */
exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        status: 'fail',
        message: 'الجهاز غير موجود'
      });
    }

    // Check if user is the owner or admin
    // التحقق من أن المستخدم هو المالك أو المدير
    if (device.owner.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحيات كافية'
      });
    }

    await Device.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'تم حذف الجهاز بنجاح'
    });
  } catch (error) {
    next(error);
  }
};