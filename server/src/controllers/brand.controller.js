const Brand = require('../models/Brand.model');

/**
 * Get all brands
 * GET /api/brands
 */
exports.getAllBrands = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;
    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { nameAr: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } }
      ];
    }

    const brands = await Brand.find(query)
      .sort({ createdAt: -1 })
      .populate('supportedAppliances');

    res.status(200).json({
      status: 'success',
      data: {
        count: brands.length,
        brands
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get brand by ID
 * GET /api/brands/:id
 */
exports.getBrandById = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id)
      .populate('supportedAppliances');// لعرض الاجهزة المدعومة

    if (!brand) {
      return res.status(404).json({
        status: 'fail',
        message: 'العلامة التجارية غير موجودة'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        brand
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new brand (Admin only)
 * POST /api/brands
 */
exports.createBrand = async (req, res, next) => {
  try {
    const { nameAr, nameEn, logo, description, country, website } = req.body;

    if (!nameAr || !nameEn) {
      return res.status(400).json({
        status: 'fail',
        message: 'الاسم بالعربية والإنجليزية مطلوبان'
      });
    }

    const brand = await Brand.create({
      name: `${nameAr}-${nameEn}`,
      nameAr,
      nameEn,
      logo,
      description,
      country,
      website
    });

    res.status(201).json({
      status: 'success',
      message: 'تم إنشاء العلامة التجارية بنجاح',
      data: {
        brand
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update brand (Admin only)
 * PATCH /api/brands/:id
 */
exports.updateBrand = async (req, res, next) => {
  try {
    const { nameAr, nameEn, logo, description, country, website, isActive } = req.body;

    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        status: 'fail',
        message: 'العلامة التجارية غير موجودة'
      });
    }

    if (nameAr) brand.nameAr = nameAr;
    if (nameEn) brand.nameEn = nameEn;
    if (logo) brand.logo = logo;
    if (description) brand.description = description;
    if (country) brand.country = country;
    if (website) brand.website = website;
    if (isActive !== undefined) brand.isActive = isActive;

    if (nameAr || nameEn) {
      brand.name = `${brand.nameAr}-${brand.nameEn}`;
    }

    await brand.save();

    res.status(200).json({
      status: 'success',
      message: 'تم تحديث العلامة التجارية بنجاح',
      data: {
        brand
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete brand (Admin only)
 * DELETE /api/brands/:id
 */
exports.deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(404).json({
        status: 'fail',
        message: 'العلامة التجارية غير موجودة'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'تم حذف العلامة التجارية بنجاح'
    });
  } catch (error) {
    next(error);
  }
};