import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Tag, 
  Globe,
  CheckCircle2,
  X,
  Layers
} from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { motion, AnimatePresence } from 'framer-motion';

const Brands = () => {
  const api = useAxios();
  const [brands, setBrands] = useState([]);
  const [appliances, setAppliances] = useState([]); // Necessary for selection
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    applianceTypes: [] // العودة لنظام المصفوفة للسماح بتعدد الأجهزة
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await api.patch(`/admin/brands/${editingBrand._id}`, formData);
      } else {
        await api.post('/admin/brands', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert('خطأ في حفظ البيانات');
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
    setShowModal(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white mb-2 font-outfit tracking-tight">إدارة الماركات التجارية</h2>
          <p className="text-slate-400 font-bold text-sm">أضف الماركات واربطها بالأجهزة التي تدعم صيانها</p>
        </div>
        <button 
          onClick={() => {
            setEditingBrand(null);
            setFormData({ nameAr: '', nameEn: '', country: '', website: '', description: '', supportedAppliances: [] });
            setShowModal(true);
          }}
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
              <div className="absolute top-0 left-0 px-4 py-1.5 bg-blue-600/10 text-blue-400 text-[10px] font-black rounded-br-2xl border-r border-b border-white/5 uppercase tracking-widest">
                 {brand.country || 'International'}
              </div>

              <div className="flex justify-between items-start mt-4 mb-6">
                 <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                    <Tag className="text-blue-500" size={28} />
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => openEditModal(brand)} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                       <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleDelete(brand._id)} className="p-2.5 bg-red-500/5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
                       <Trash2 size={18} />
                    </button>
                 </div>
              </div>

              <div className="text-right mb-6">
                 <h3 className="text-2xl font-black text-white mb-1 font-outfit">{brand.nameAr}</h3>
                 <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{brand.nameEn}</p>
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

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
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
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
             />
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl glass p-10 rounded-[40px] shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
             >
                <div className="flex justify-between items-center mb-10">
                   <button onClick={() => setShowModal(false)} className="p-2.5 bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                      <X size={20} />
                   </button>
                   <h3 className="text-2xl font-black text-white font-outfit">
                      {editingBrand ? 'تعديل بيانات الماركة' : 'إضافة ماركة جديدة'}
                   </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2 text-right">
                         <label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block pr-2">الاسم بالعربية</label>
                         <input 
                           required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-right font-bold focus:border-blue-500/50 focus:outline-none"
                           value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block pl-2">Brand Name (EN)</label>
                         <input 
                           required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-blue-500/50 focus:outline-none"
                           value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})}
                         />
                      </div>
                   </div>

                   {/* No grid for country/website as they are removed */}


                   {/* Appliance Multi-Selector */}
                   <div className="space-y-4">
                      <label className="text-slate-400 font-black text-xs uppercase tracking-widest block text-right pr-2">ربط بأنواع الأجهزة (اختيار متعدد)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                         {appliances.map(app => (
                           <button
                             key={app._id}
                             type="button"
                             onClick={() => toggleAppliance(app._id)}
                             className={`p-3 rounded-xl border transition-all text-[11px] font-bold text-center flex flex-col items-center gap-2
                               ${formData.applianceTypes.includes(app._id) 
                                 ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10' 
                                 : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}
                           >
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.applianceTypes.includes(app._id) ? 'bg-blue-500' : 'bg-slate-800'}`}>
                                <Layers size={14} className={formData.applianceTypes.includes(app._id) ? 'text-white' : 'text-slate-600'} />
                             </div>
                             {app.nameAr}
                           </button>
                         ))}
                      </div>
                   </div>

                   <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-600/20 transition-all mt-6 active:scale-[0.98]">
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
