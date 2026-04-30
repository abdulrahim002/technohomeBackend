/**
 * 🌍 Golden Source of Truth for IDs
 * This file MUST match the server's canonical IDs.
 */

export const LIBYAN_CITIES = [
  { id: 'tripoli', nameAr: 'طرابلس', slug: 'tripoli' },
  { id: 'benghazi', nameAr: 'بنغازي', slug: 'benghazi' },
  { id: 'misrata', nameAr: 'مصراتة', slug: 'misrata' },
  { id: 'zawiya', nameAr: 'الزاوية', slug: 'zawiya' },
  { id: 'sebha', nameAr: 'سبها', slug: 'sebha' },
];

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
  const type = APPLIANCE_TYPES.find(t => t.id === idOrSlug || t.slug === idOrSlug);
  return type ? type.nameAr : 'جهاز عام';
};
