import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Tag,
  Globe,
  CheckCircle2,
  X,
  Layers,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { motion, AnimatePresence } from 'framer-motion';

// عنوان السيرفر لعرض الصور — يُعدَّل حسب البيئة
const SERVER_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * دالة مساعدة: بناء عنوان URL كامل للشعار
 * تدعم المسارات النسبية المخزنة في قاعدة البيانات (/uploads/logos/...)
 * وتُعيد null إذا لم يكن هناك شعار.
 */
const buildLogoUrl = (logoUrl) => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  return `${SERVER_URL}${logoUrl}`;
};

const Brands = () => {
  const api = useAxios();
  const fileInputRef = useRef(null); // [+] مرجع لحقل رفع الملف

  const [brands, setBrands] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  // حالة النموذج
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    applianceTypes: []
  });

  // [+] حالة ملف الشعار والمعاينة
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [brandRes, appRes] = await Promise.all([
        api.get('/admin/brands'),
        api.get('/admin/appliance-types')
      ]);
      setBrands(brandRes.data.data.brands);
      setAppliances(appRes.data.data.applianceTypes);
      setLoading(false);
    } catch (error) {
      console.error('Fetch failed:', error);
      setLoading(false);
    }
  };

  const toggleAppliance = (id) => {
    setFormData(prev => {
      const current = prev.applianceTypes;
      if (current.includes(id)) {
        return { ...prev, applianceTypes: current.filter(item => item !== id) };
      }
      return { ...prev, applianceTypes: [...current, id] };
    });
  };

  // [+] معالجة اختيار ملف الشعار مع معاينة فورية
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    // إنشاء رابط معاينة مؤقت من الذاكرة (Object URL)
    setLogoPreview(URL.createObjectURL(file));
  };

  // [+] إزالة الشعار المختار
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (logoFile) {
        // [+] إرسال كـ FormData عند وجود ملف
        const data = new FormData();
        data.append('nameAr', formData.nameAr);
        data.append('nameEn', formData.nameEn);
        formData.applianceTypes.forEach(id => data.append('applianceTypes[]', id));
        data.append('logo', logoFile);

        if (editingBrand) {
          await api.patch(`/admin/brands/${editingBrand._id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await api.post('/admin/brands', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // إرسال JSON عادي عند عدم وجود ملف (backward-compatible)
        if (editingBrand) {
          await api.patch(`/admin/brands/${editingBrand._id}`, formData);
        } else {
          await api.post('/admin/brands', formData);
        }
      }

      closeModal();
      fetchData();
    } catch (error) {
      alert('خطأ في حفظ البيانات: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('حذف هذه الماركة؟')) {
      try {
        await api.delete(`/admin/brands/${id}`);
        fetchData();
      } catch (error) {
        alert('فشل الحذف');
      }
    }
  };

  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setFormData({
      nameAr: brand.nameAr,
      nameEn: brand.nameEn,
      applianceTypes: brand.applianceTypes?.map(a => a._id || a) || []
    });
    // [+] عرض الشعار الحالي كمعاينة
    setLogoPreview(buildLogoUrl(brand.logoUrl));
    setLogoFile(null);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({ nameAr: '', nameEn: '', applianceTypes: [] });
    setLogoFile(null);
    setLogoPreview(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setLogoFile(null);
    setLogoPreview(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 font-outfit tracking-tight">إدارة الماركات التجارية</h2>
          <p className="text-slate-500 font-bold text-sm">أضف الماركات، شعاراتها، واربطها بالأجهزة التي تدعم صيانها</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة ماركة جديدة</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="glass-card h-64 animate-pulse" />)
        ) : (
          brands.map((brand) => (
            <div key={brand._id} className="glass-card p-8 group relative overflow-hidden">
              {/* Country Badge */}
              <div className="absolute top-0 left-0 px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-br-2xl border-r border-b border-slate-100 uppercase tracking-widest">
                {brand.country || 'International'}
              </div>

              <div className="flex justify-between items-start mt-4 mb-6">
                {/* [+] عرض الشعار أو الأيقونة الاحتياطية */}
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 overflow-hidden">
                  {brand.logoUrl ? (
                    <img
                      src={buildLogoUrl(brand.logoUrl)}
                      alt={brand.nameEn}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  {/* Fallback Icon — يظهر دائماً إذا لم يكن هناك شعار أو إذا فشل تحميله */}
                  <span
                    className="w-full h-full items-center justify-center"
                    style={{ display: brand.logoUrl ? 'none' : 'flex' }}
                  >
                    <Tag className="text-indigo-500" size={28} />
                  </span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEditModal(brand)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(brand._id)} className="p-2.5 bg-red-50 rounded-xl text-red-400 hover:bg-red-100 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="text-right mb-6">
                <h3 className="text-2xl font-black text-slate-900 mb-1 font-outfit">{brand.nameAr}</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{brand.nameEn}</p>
              </div>

              {/* Supported Appliances Tags */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Layers size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">نوع الجهاز</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {brand.applianceTypes?.length > 0 ? (
                    brand.applianceTypes.map(app => (
                      <span key={app._id} className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/10">
                        {app.nameAr || 'غير محدد'}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600 text-[10px] font-bold italic">غير مرتبط بأي جهاز</span>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                <a href={brand.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <Globe size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">الموقع الرسمي</span>
                </a>
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-white/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <button onClick={closeModal} className="p-2.5 bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-all">
                  <X size={20} />
                </button>
                <h3 className="text-2xl font-black text-slate-900 font-outfit">
                  {editingBrand ? 'تعديل بيانات الماركة' : 'إضافة ماركة جديدة'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* الاسم بالعربية والإنجليزية */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-right">
                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block pr-2">الاسم بالعربية</label>
                    <input
                      required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-right font-bold focus:border-indigo-400 focus:outline-none"
                      value={formData.nameAr} onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block pl-2">Brand Name (EN)</label>
                    <input
                      required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-400 focus:outline-none"
                      value={formData.nameEn} onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                    />
                  </div>
                </div>

                {/* [+] حقل رفع الشعار مع معاينة فورية */}
                <div className="space-y-3">
                  <label className="text-slate-500 font-black text-xs uppercase tracking-widest block text-right pr-2">
                    شعار الماركة (اختياري)
                  </label>

                  {logoPreview ? (
                    // معاينة الصورة المختارة
                    <div className="relative w-full h-40 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden flex items-center justify-center">
                      <img src={logoPreview} alt="logo preview" className="max-h-full max-w-full object-contain p-4" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-3 left-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                        title="إزالة الشعار"
                      >
                        <X size={14} />
                      </button>
                      {logoFile && (
                        <div className="absolute bottom-3 right-3 px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-500/20">
                          صورة جديدة محددة
                        </div>
                      )}
                    </div>
                  ) : (
                    // منطقة الرفع (Drag & Click)
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-all">
                        <ImageIcon size={20} className="text-slate-400 group-hover:text-indigo-500" />
                      </div>
                      <span className="text-slate-400 font-bold text-xs group-hover:text-indigo-500">
                        اضغط لرفع شعار الماركة (PNG, JPG, WEBP)
                      </span>
                    </button>
                  )}

                  {/* حقل الملف المخفي */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>

                {/* Appliance Multi-Selector */}
                <div className="space-y-4">
                  <label className="text-slate-500 font-black text-xs uppercase tracking-widest block text-right pr-2">ربط بأنواع الأجهزة (اختيار متعدد)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {appliances.map(app => (
                      <button
                        key={app._id}
                        type="button"
                        onClick={() => toggleAppliance(app._id)}
                        className={`p-3 rounded-xl border transition-all text-[11px] font-bold text-center flex flex-col items-center gap-2
                          ${formData.applianceTypes.includes(app._id)
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-600 shadow-md'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        {/* [+] عرض شعار الجهاز مصغراً داخل المحدد */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${formData.applianceTypes.includes(app._id) ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                          {app.logoUrl ? (
                            <img src={buildLogoUrl(app.logoUrl)} alt={app.nameEn} className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <Layers size={14} className={formData.applianceTypes.includes(app._id) ? 'text-white' : 'text-slate-500'} />
                          )}
                        </div>
                        {app.nameAr}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[24px] shadow-xl shadow-indigo-600/20 transition-all mt-6 active:scale-[0.98]">
                  {editingBrand ? 'تحديث بيانات الماركة' : 'حفظ وإضافة الماركة'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Brands;
