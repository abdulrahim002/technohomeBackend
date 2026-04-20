import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Wrench, 
  AlertCircle,
  X
} from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { motion, AnimatePresence } from 'framer-motion';

const Appliances = () => {
  const api = useAxios();
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    category: 'other',
    description: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAppliance) {
        await api.patch(`/admin/appliance-types/${editingAppliance._id}`, formData);
      } else {
        await api.post('/admin/appliance-types', formData);
      }
      setShowModal(false);
      setEditingAppliance(null);
      setFormData({ nameAr: '', nameEn: '', category: 'other', description: '' });
      fetchAppliances();
    } catch (error) {
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الجهاز؟ سيتم حذف جميع مسارات التشخيص المرتبطة به.')) {
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
      category: app.category,
      description: app.description || ''
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white mb-2 font-outfit tracking-tight">إدارة أنواع الأجهزة</h2>
          <p className="text-slate-400 font-bold text-sm">أضف، عدل، أو احذف أنواع الأجهزة المدعومة في المنصة</p>
        </div>
        <button 
          onClick={() => {
            setEditingAppliance(null);
            setFormData({ nameAr: '', nameEn: '', category: 'other', description: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة جهاز جديد</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="glass-card h-48 animate-pulse bg-white/5" />)
        ) : (
          appliances.map((app) => (
            <div key={app._id} className="glass-card p-6 group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/10 group-hover:bg-blue-500/20 transition-all">
                    <Wrench className="text-blue-500" size={24} />
                 </div>
                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(app)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                       <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(app._id)} className="p-2 bg-red-500/5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all">
                       <Trash2 size={16} />
                    </button>
                 </div>
              </div>

              <h3 className="text-xl font-black text-white mb-1 text-right font-outfit">{app.nameAr}</h3>
              <p className="text-slate-400 font-bold text-xs text-right uppercase tracking-widest">{app.nameEn}</p>
              
              <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-slate-500 border border-white/5">
                   {app.category}
                 </span>
                 <div className="flex items-center gap-2 text-emerald-500">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
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
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-xl glass p-10 rounded-[40px] shadow-2xl border border-white/10"
             >
                <div className="flex justify-between items-center mb-8">
                   <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                      <X size={20} />
                   </button>
                   <h3 className="text-2xl font-black text-white font-outfit">
                      {editingAppliance ? 'تعديل بيانات الجهاز' : 'إضافة نوع جهاز جديد'}
                   </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-slate-400 font-bold text-xs uppercase tracking-widest text-right block">الاسم بالعربية</label>
                         <input 
                           required
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-right font-bold focus:border-blue-500/50 focus:outline-none"
                           value={formData.nameAr}
                           onChange={e => setFormData({...formData, nameAr: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-slate-400 font-bold text-xs uppercase tracking-widest block">Name (English)</label>
                         <input 
                           required
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-blue-500/50 focus:outline-none"
                           value={formData.nameEn}
                           onChange={e => setFormData({...formData, nameEn: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="space-y-2 text-right">
                      <label className="text-slate-400 font-bold text-xs uppercase tracking-widest block">الفئة التصنيفية</label>
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-blue-500/50 focus:outline-none appearance-none cursor-pointer"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                         <option value="cooling">تبريد (Cooling)</option>
                         <option value="heating">تدفئة (Heating)</option>
                         <option value="kitchen">مطبخ (Kitchen)</option>
                         <option value="laundry">غسيل (Laundry)</option>
                         <option value="cleaning">تنظيف (Cleaning)</option>
                         <option value="other">أخرى (Other)</option>
                      </select>
                   </div>

                   <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-600/20 transition-all mt-6">
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
