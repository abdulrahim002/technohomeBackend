import { useState, useEffect } from 'react';
import { getCities, getApplianceTypes, getBrands } from '../api/lookupService';

/**
 * useLookups - Hook مخصص لجلب البيانات المساعدة (المدن، الأجهزة، الماركات)
 * مع دعم بسيط للتخزين المؤقت (In-memory caching) لتجنب تكرار الطلبات.
 */
let cachedCities = null;
let cachedAppliances = null;
let cachedBrands = null;

export const useLookups = () => {
  const [cities, setCities] = useState(cachedCities || []);
  const [appliances, setAppliances] = useState(cachedAppliances || []);
  const [brands, setBrands] = useState(cachedBrands || []);
  const [loading, setLoading] = useState(!cachedCities || !cachedAppliances);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // إذا كانت البيانات موجودة مسبقاً، لا داعي للجلب مرة أخرى
      if (cachedCities && cachedAppliances && cachedBrands) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [cityData, applianceData, brandData] = await Promise.all([
          !cachedCities ? getCities() : Promise.resolve(cachedCities),
          !cachedAppliances ? getApplianceTypes() : Promise.resolve(cachedAppliances),
          !cachedBrands ? getBrands() : Promise.resolve(cachedBrands)
        ]);

        cachedCities = cityData;
        cachedAppliances = applianceData;
        cachedBrands = brandData;

        setCities(cityData);
        setAppliances(applianceData);
        setBrands(brandData);
      } catch (err) {
        setError(err.message);
        console.error('Error in useLookups:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // دالة لتحديث البيانات يدوياً (Force Refresh)
  const refresh = async () => {
    cachedCities = null;
    cachedAppliances = null;
    cachedBrands = null;
    setLoading(true);
    // سيقوم الـ useEffect بالجلب مرة أخرى بسبب تغيير الحالة (أو يمكن استدعاء fetchData يدوياً)
  };

  return { cities, appliances, brands, loading, error, refresh };
};
