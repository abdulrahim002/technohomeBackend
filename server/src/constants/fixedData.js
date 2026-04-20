/**
 * FIXED DATA - CENTRAL SOURCE OF TRUTH
 * هذا الملف هو المرجع الوحيد للمعرفات الثابتة في النظام
 */

const LIBYAN_CITIES = [
  { name: 'Tripoli', nameAr: 'طرابلس', nameEn: 'Tripoli' },
  { name: 'Benghazi', nameAr: 'بنغازي', nameEn: 'Benghazi' },
  { name: 'Misrata', nameAr: 'مصراتة', nameEn: 'Misrata' },
  { name: 'Zawiya', nameAr: 'الزاوية', nameEn: 'Zawiya' },
  { name: 'Sebha', nameAr: 'سبها', nameEn: 'Sebha' },
  { name: 'Bayda', nameAr: 'البيضاء', nameEn: 'Bayda' },
  { name: 'Tobruk', nameAr: 'طبرق', nameEn: 'Tobruk' },
  { name: 'Zliten', nameAr: 'زليتن', nameEn: 'Zliten' },
  { name: 'Khoms', nameAr: 'الخمس', nameEn: 'Khoms' },
];

const getCityName = async (cityId) => {
  const city = await City.findById(cityId);
  return city ? city.nameAr : cityId;
};

// خريطة لتنميط المدخلات النصية القديمة إلى IDs (للهجرة فقط)
const CITY_TO_ID = {
  'طرابلس': 'Tripoli',
  'بنغازي': 'Benghazi',
  'مصراتة': 'Misrata',
  'الزاوية': 'Zawiya',
  'سبها': 'Sebha',
};

module.exports = {
  LIBYAN_CITIES,
  getCityName,
  CITY_TO_ID
};
