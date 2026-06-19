import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Wrench,
  X,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { motion, AnimatePresence } from 'framer-motion';

// عنوان السيرفر لعرض الصور — يُعدَّل حسب البيئة
const SERVER_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * دالة مساعدة: بناء عنوان URL كامل للشعار
 */
const buildLogoUrl = (logoUrl) => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  return `${SERVER_URL}${logoUrl}`;
};

const CATEGORY_LABELS = {
  cooling: 'تبريد',
  heating: 'تدفئة',
  kitchen: 'مطبخ',
  laundry: 'غسيل',
  cleaning: 'تنظيف',
  other: 'أخرى',
};

const CATEGORY_COLORS = {
  cooling:  'bg-sky-50 text-sky-600 border-sky-100',
  heating:  'bg-orange-50 text-orange-600 border-orange-100',
  kitchen:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  laundry:  'bg-violet-50 text-violet-600 border-violet-100',
  cleaning: 'bg-teal-50 text-teal-600 border-teal-100',
  other:    'bg-slate-50 text-slate-600 border-slate-200',
};

const Appliances = () => {
  const api = useAxios();
  const fileInputRef = useRef(null); // [+] مرجع لحقل رفع الملف

  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState(null);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    category: 'other',
    description: ''
  });

  // [+] حالة ملف الشعار والمعاينة
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchAppliances();
  }, []);

  const fetchAppliances = async () => {
    try {
      const response = await api.get('/admin/appliance-types');
      setAppliances(response.data.data.applianceTypes);
      setLoading(false);
    } catch (error) {
      console.error('Fetch failed:', error);
      setLoading(false);
    }
  };

  // [+] معالجة اختيار ملف الشعار مع معاينة فورية
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
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
        data.append('category', formData.category);
        if (formData.description) data.append('description', formData.description);
        data.append('logo', logoFile);

        if (editingAppliance) {
          await api.patch(`/admin/appliance-types/${editingAppliance._id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await api.post('/admin/appliance-types', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // إرسال JSON عادي عند عدم وجود ملف
        if (editingAppliance) {
          await api.patch(`/admin/appliance-types/${editingAppliance._id}`, formData);
        } else {
          await api.post('/admin/appliance-types', formData);
        }
      }

      closeModal();
      fetchAppliances();
    } catch (error) {
      alert('حدث خطأ أثناء حفظ البيانات: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الجهاز؟')) {
      try {
        await api.delete(`/admin/appliance-types/${id}`);
        fetchAppliances();
      } catch (error) {
        alert('فشل الحذف');
      }
    }
  };

  const openEditModal = (app) => {
    setEditingAppliance(app);
    setFormData({
      nameAr: app.nameAr,
      nameEn: app.nameEn,
      category: app.category || 'other',
      description: app.description || ''
    });
    // [+] عرض الشعار الحالي كمعاينة
    setLogoPreview(buildLogoUrl(app.logoUrl));
    setLogoFile(null);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingAppliance(null);
    setFormData({ nameAr: '', nameEn: '', category: 'other', description: '' });
    setLogoFile(null);
    setLogoPreview(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAppliance(null);
    setLogoFile(null);
    setLogoPreview(null);
    setFormData({ nameAr: '', nameEn: '', category: 'other', description: '' });
  };

  const filtered = appliances.filter(a =>
    a.nameAr?.includes(search) || a.nameEn?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 font-outfit tracking-tight">إدارة أنواع الأجهزة</h2>
          <p className="text-slate-500 font-bold text-sm">أضف، عدل، أو احذف أنواع الأجهزة وشعاراتها المدعومة في المنصة</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة جهاز جديد</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          placeholder="ابحث عن جهاز..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-11 pl-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 text-right"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="glass-card h-48 animate-pulse bg-slate-50" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400 font-bold">
            لا توجد أجهزة مطابقة
          </div>
        ) : (
          filtered.map((app) => (
            <div key={app._id} className="glass-card p-6 group hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-5">
                {/* [+] عرض الشعار أو الأيقونة الاحتياطية */}
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-100 transition-all overflow-hidden">
                  {app.logoUrl ? (
                    <img
                      src={buildLogoUrl(app.logoUrl)}
                      alt={app.nameEn}
                      className="w-full h-full object-contain p-1.5"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.querySelector('.fallback-icon').style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    className="fallback-icon w-full h-full items-center justify-center"
                    style={{ display: app.logoUrl ? 'none' : 'flex' }}
                  >
                    <Wrench className="text-indigo-600" size={24} />
                  </span>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => openEditModal(app)}
                    className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    title="تعديل"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(app._id)}
                    className="p-2 bg-red-50 rounded-xl text-red-400 hover:bg-red-100 transition-all"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1 text-right font-outfit">{app.nameAr}</h3>
              <p className="text-slate-400 font-bold text-xs text-right uppercase tracking-widest mb-5">{app.nameEn}</p>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">نشط</span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${CATEGORY_COLORS[app.category] || CATEGORY_COLORS.other}`}>
                  {CATEGORY_LABELS[app.category] || app.category}
                </span>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <button
                  onClick={closeModal}
                  className="p-2.5 bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <X size={20} />
                </button>
                <h3 className="text-2xl font-black text-slate-900 font-outfit">
                  {editingAppliance ? 'تعديل بيانات الجهاز' : 'إضافة نوع جهاز جديد'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* الاسم بالعربية والإنجليزية */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-widest text-right block">الاسم بالعربية</label>
                    <input
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-right font-bold focus:border-indigo-400 focus:outline-none transition-colors"
                      placeholder="مثال: مكيف هواء"
                      value={formData.nameAr}
                      onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-widest block">Name (English)</label>
                    <input
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-400 focus:outline-none transition-colors"
                      placeholder="e.g. Air Conditioner"
                      value={formData.nameEn}
                      onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                    />
                  </div>
                </div>

                {/* [+] حقل رفع الشعار مع معاينة فورية */}
                <div className="space-y-3">
                  <label className="text-slate-500 font-black text-xs uppercase tracking-widest block text-right">
                    شعار الجهاز (اختياري)
                  </label>

                  {logoPreview ? (
                    <div className="relative w-full h-36 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden flex items-center justify-center">
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
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-28 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-all">
                        <ImageIcon size={20} className="text-slate-400 group-hover:text-indigo-500" />
                      </div>
                      <span className="text-slate-400 font-bold text-xs group-hover:text-indigo-500">
                        اضغط لرفع شعار الجهاز (PNG, JPG, WEBP)
                      </span>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>

                {/* الفئة التصنيفية */}
                <div className="space-y-3 text-right">
                  <label className="text-slate-500 font-bold text-xs uppercase tracking-widest block">الفئة التصنيفية</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: val })}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center
                          ${formData.category === val
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[24px] shadow-xl shadow-indigo-600/20 transition-all mt-2 active:scale-[0.98]"
                >
                  {editingAppliance ? 'تحديث البيانات' : 'حفظ وإضافة الجهاز'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Appliances;
