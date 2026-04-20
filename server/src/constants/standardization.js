/**
 * 🌍 قاموس التنميط العالمي للنظام (Standardization Layer)
 * يهدف لتوحيد مسميات المدن لمنع فوارق اللغة أو الإملاء
 */

const CITY_MAP = {
  // طرابلس
  'tripoli': 'tripoli',
  'طرابلس': 'tripoli',
  'طرابلس الغرب': 'tripoli',
  
  // بنغازي
  'benghazi': 'benghazi',
  'بنغازي': 'benghazi',
  
  // مصراتة
  'misrata': 'misrata',
  'misurata': 'misrata',
  'مصراتة': 'misrata',
  
  // الزاوية
  'az zawiyah': 'zawiya',
  'zawiya': 'zawiya',
  'الزاوية': 'zawiya',
  
  // سبها
  'sebha': 'sebha',
  'sabha': 'sebha',
  'سبها': 'sebha',
};

/**
 * دالة تنظيف وتوحيد المدينة
 */
const normalizeCity = (city) => {
  if (!city) return 'طرابلس';
  const clean = city.trim().toLowerCase();
  return CITY_MAP[clean] || city.trim();
};

module.exports = {
  CITY_MAP,
  normalizeCity
};
