import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle,
  Search,
  CheckCircle2,
  X,
  Layers,
  Wrench,
  Tag
} from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorCodes = () => {
  const api = useAxios();
  const [errorCodes, setErrorCodes] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    deviceId: '',
    brandId: '',
    actionStep: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [codesRes, appRes, brandRes] = await Promise.all([
        api.get('/error-codes'),
        api.get('/admin/appliance-types'),
        api.get('/admin/brands')
      ]);
      setErrorCodes(codesRes.data.data.errorCodes);
      setAppliances(appRes.data.data.applianceTypes);
      setBrands(brandRes.data.data.brands);
      setLoading(false);
    } catch (error) {
      console.error('Fetch failed:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCode) {
        await api.patch(`/error-codes/${editingCode._id}`, formData);
      } else {
        await api.post('/error-codes', formData);
      }
      setShowModal(false);
      setFormData({ code: '', description: '', deviceId: '', brandId: '', actionStep: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'خطأ في حفظ البيانات');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('حذف هذا الكود نهائياً؟')) {
      try {
        await api.delete(`/error-codes/${id}`);
        fetchData();
      } catch (error) {
        alert('فشل الحذف');
      }
    }
  };

  const openEditModal = (code) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description,
      deviceId: code.deviceId?._id || code.deviceId,
      brandId: code.brandId?._id || code.brandId,
      actionStep: code.actionStep
    });
    setShowModal(true);
  };

  const filteredCodes = errorCodes.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.deviceId?.nameAr?.includes(searchTerm) ||
    c.brandId?.nameAr?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white mb-2 font-outfit tracking-tight">إدارة أكواد الأعطال</h2>
          <p className="text-slate-400 font-bold text-sm">أضف شروحات الأكواد لكل ماركة وجهاز لتسهيل التشخيص للمستخدمين</p>
        </div>
        <button 
          onClick={() => {
            setEditingCode(null);
            setFormData({ code: '', description: '', deviceId: '', brandId: '', actionStep: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>إضافة كود جديد</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text"
          placeholder="ابحث عن كود، جهاز، أو ماركة..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-4 text-white font-bold focus:border-blue-500/50 focus:outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table List */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">الكود</th>
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">الجهاز</th>
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">الماركة</th>
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">الوصف</th>
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">خيارات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-16 border-b border-white/5" />)
            ) : filteredCodes.map((c) => (
              <tr key={c._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-black text-blue-400 font-outfit uppercase">{c.code}</td>
                <td className="px-6 py-4 font-bold text-white">{c.deviceId?.nameAr}</td>
                <td className="px-6 py-4 font-bold text-slate-400">{c.brandId?.nameAr}</td>
                <td className="px-6 py-4 font-medium text-slate-300 max-w-xs truncate">{c.description}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEditModal(c)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="p-2 bg-red-500/5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                className="relative w-full max-w-2xl glass p-10 rounded-[40px] shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto overflow-hidden"
             >
                <div className="flex justify-between items-center mb-10">
                   <button onClick={() => setShowModal(false)} className="p-2.5 bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                      <X size={20} />
                   </button>
                   <h3 className="text-2xl font-black text-white font-outfit">
                      {editingCode ? 'تعديل كود العطل' : 'إضافة كود جديد'}
                   </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2 text-right">
                         <label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block pr-2">كود العطل (مثال: E1)</label>
                         <input 
                           required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-right font-black uppercase focus:border-blue-500/50 focus:outline-none"
                           value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2 text-right">
                         <label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block pr-2">نوع الجهاز</label>
                         <select 
                            required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-right font-bold focus:border-blue-500/50 focus:outline-none appearance-none"
                            value={formData.deviceId} onChange={e => setFormData({...formData, deviceId: e.target.value})}
                         >
                            <option value="" className="bg-slate-900">اختر الجهاز...</option>
                            {appliances.map(app => <option key={app._id} value={app._id} className="bg-slate-900">{app.nameAr}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2 text-right">
                      <label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block pr-2">الماركة (تأكد من توافق الماركة مع الجهاز)</label>
                      <select 
                         required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-right font-bold focus:border-blue-500/50 focus:outline-none appearance-none"
                         value={formData.brandId} onChange={e => setFormData({...formData, brandId: e.target.value})}
                      >
                         <option value="" className="bg-slate-900">اختر الماركة...</option>
                         {brands.map(brand => <option key={brand._id} value={brand._id} className="bg-slate-900">{brand.nameAr}</option>)}
                      </select>
                   </div>

                   <div className="space-y-2 text-right">
                      <label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block pr-2">وصف العطل بالتفصيل</label>
                      <textarea 
                        required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-right font-bold focus:border-blue-500/50 focus:outline-none min-h-[100px]"
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                   </div>

                   <div className="space-y-2 text-right">
                      <label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block pr-2">نصيحة أولية للمستخدم (Action Step)</label>
                      <textarea 
                        required className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-emerald-400 text-right font-bold focus:border-emerald-500/50 focus:outline-none min-h-[80px]"
                        placeholder="مثال: يرجى فصل الغسالة لمدة 10 دقائق وإعادة التشغيل..."
                        value={formData.actionStep} onChange={e => setFormData({...formData, actionStep: e.target.value})}
                      />
                   </div>

                   <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-600/20 transition-all mt-4 active:scale-[0.98]">
                      {editingCode ? 'تحديث بيانات الكود' : 'حفظ الكود الجديد'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ErrorCodes;
