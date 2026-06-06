/**
 * 🌍 Golden Source of Truth for IDs
 * This file MUST match the server's canonical IDs.
 */

export const LIBYAN_CITIES = [
  { id: 'tripoli', nameAr: 'طرابلس', slug: 'tripoli', coords: { latitude: 32.8872, longitude: 13.1913 } },
  { id: 'benghazi', nameAr: 'بنغازي', slug: 'benghazi', coords: { latitude: 32.1859, longitude: 20.0717 } },
  { id: 'misrata', nameAr: 'مصراتة', slug: 'misrata', coords: { latitude: 32.3754, longitude: 15.0925 } },
  { id: 'zawiya', nameAr: 'الزاوية', slug: 'zawiya', coords: { latitude: 32.7522, longitude: 12.7244 } },
  { id: 'sebha', nameAr: 'سبها', slug: 'sebha', coords: { latitude: 27.0377, longitude: 14.4283 } },
];

export const getCityCoords = (id) => {
  const city = LIBYAN_CITIES.find(c => c.id === id);
  return city ? city.coords : { latitude: 32.8872, longitude: 13.1913 };
};

export const APPLIANCE_TYPES = [
  { id: '69d1aede0b9f1ed86b3e29f5', nameAr: 'غسالات ملابس', slug: 'washing_machines', icon: '🧺' },
  { id: '69d1aede0b9f1ed86b3e29f8', nameAr: 'مكيفات هواء', slug: 'air_conditioning', icon: '🌬️' },
  { id: '69ded739c3a83a93e00f81fb', nameAr: 'جلايات صحون', slug: 'dishwashers', icon: '🍽️' },
  { id: 'ovens', nameAr: 'أفران طهي', slug: 'ovens', icon: '🍳' },
  { id: 'refrigeration', nameAr: 'تبريد وثلاجات', slug: 'refrigeration', icon: '❄️' },
];

export const getCityNameAr = (id) => {
  const city = LIBYAN_CITIES.find(c => c.id === id);
  return city ? city.nameAr : (id === 'tripoli' ? 'طرابلس' : id);
};

export const getApplianceNameAr = (idOrSlug) => {
  if (!idOrSlug) return 'جهاز عام';
  
  // إذا كان المدخل كائناً كاملاً مأخوذاً من قاعدة البيانات
  if (typeof idOrSlug === 'object') {
    if (idOrSlug.nameAr) return idOrSlug.nameAr;
    idOrSlug = idOrSlug._id || idOrSlug.id || '';
  }
  
  if (!idOrSlug) return 'جهاز عام';
  const type = APPLIANCE_TYPES.find(t => t.id === idOrSlug || t.slug === idOrSlug);
  return type ? type.nameAr : (typeof idOrSlug === 'string' && idOrSlug.length > 10 ? 'جهاز صيانة' : idOrSlug);
};
