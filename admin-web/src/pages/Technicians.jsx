import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MapPin, 
  ShieldCheck,
  Phone,
  Calendar,
  Search,
  Filter,
  X,
  FileText,
  Star,
  Wallet,
  TrendingUp,
  Download
} from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { motion, AnimatePresence } from 'framer-motion';

const Technicians = () => {
  const api = useAxios();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'pending', 'verified', 'rejected'

  useEffect(() => {
    fetchTechnicians();
  }, [filter]);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'pending' ? '/admin/technicians/pending' : '/admin/technicians/verified';
      const response = await api.get(endpoint);
      
      const normalizedData = (response.data.data.technicians || []).map(t => ({
        _id: t._id,
        userId: t.user?._id,
        firstName: t.user?.firstName || 'غير معروف',
        lastName: t.user?.lastName || '',
        phone: t.user?.phone || 'غير متوفر',
        location: t.user?.city?.nameAr || 'غير محدد',
        createdAt: t.createdAt,
        specialties: t.specialties || [],
        brands: t.brands || [],
        profileImage: t.user?.profileImage,
        walletBalance: t.user?.walletBalance || 0,
        rating: t.rating || 0,
        reviewCount: t.reviewCount || 0,
        isPending: filter === 'pending'
      }));
        
      setTechnicians(normalizedData);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/technicians/${id}/approve`);
      alert('تم قبول الفني وتفعيل حسابه بنجاح ✅');
      setShowModal(false);
      fetchTechnicians();
    } catch (error) {
      alert('خطأ في عملية الاعتماد');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('يرجى إدخال سبب الرفض:');
    if (!reason) return;
    try {
      await api.post(`/admin/technicians/${id}/reject`, { rejectionReason: reason });
      alert('تم رفض الطلب وإبلاغ الفني');
      setShowModal(false);
      fetchTechnicians();
    } catch (error) {
      alert('خطأ في عملية الرفض');
    }
  };

  const handleRecharge = async (userId) => {
    const amount = window.prompt('أدخل المبلغ المراد شحنه (LYD):');
    if (!amount || isNaN(amount)) return;
    try {
      await api.post('/admin/wallet/charge', { techId: userId, amount: parseFloat(amount) });
      alert('تم شحن المحفظة بنجاح ✅');
      fetchTechnicians();
      setShowModal(false);
    } catch (error) {
      alert('فشل شحن المحفظة');
    }
  };

  const handleExportWallet = (userId) => {
    window.open(`${import.meta.env.VITE_API_URL}/admin/export/wallet/${userId}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-right">
        <div className="flex-1">
          <h2 className="text-3xl font-black text-slate-900 mb-2 font-outfit tracking-tight">إدارة الفنيين</h2>
          <p className="text-slate-400 font-bold text-sm">راجع طلبات الانضمام وفعل الحسابات</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
           {['pending', 'verified'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                  ${filter === type ? 'bg-blue-600 text-slate-900 shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {type === 'pending' ? 'طلبات معلقة' : 'فنيين معتمدين'}
              </button>
           ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="glass rounded-[32px] overflow-hidden border border-white/5">
         <div className="overflow-x-auto">
            <table className="w-full text-right">
               <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                     <th className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest">تاريخ التسجيل</th>
                     <th className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest">الحالة</th>
                     <th className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest text-left">التفاصيل</th>
                     <th className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest text-center">المدينة</th>
                     <th className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest text-right">الاسم الكامل</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.02]">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                         <td colSpan="5" className="px-8 py-8"><div className="h-4 bg-white/5 rounded-full w-full" /></td>
                      </tr>
                    ))
                  ) : technicians.map((tech) => (
                    <tr key={tech._id} className="hover:bg-white/[0.01] transition-all group">
                       <td className="px-8 py-6 text-slate-400 text-xs font-bold font-outfit">
                          {new Date(tech.createdAt).toLocaleDateString('ar-EG')}
                       </td>
                       <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                            ${filter === 'pending' 
                               ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' 
                               : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10'}`}>
                             {filter === 'pending' ? 'قيد المراجعة' : 'معتمد'}
                          </span>
                       </td>
                       <td className="px-8 py-6">
                          <button 
                             onClick={() => { setSelectedTech(tech); setShowModal(true); }}
                             className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-slate-900 transition-all scale-0 group-hover:scale-100 origin-left"
                          >
                             <Eye size={18} />
                          </button>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs">
                             <MapPin size={14} className="text-slate-500" />
                             <span>{tech.location}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                             <div className="text-right">
                                <p className="text-slate-900 font-black text-sm">{tech.firstName} {tech.lastName}</p>
                                <p className="text-slate-500 text-[10px] font-bold mt-0.5">{tech.phone}</p>
                             </div>
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-all overflow-hidden">
                                {tech.profileImage ? (
                                   <img src={`${import.meta.env.VITE_API_URL}/${tech.profileImage}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                   <Users size={20} className="text-slate-600" />
                                )}
                             </div>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {!loading && technicians.length === 0 && (
            <div className="py-24 text-center">
               <ShieldCheck className="mx-auto text-slate-800 mb-4" size={48} />
               <p className="text-slate-500 font-bold">لا توجد سجلات في هذا القسم حالياً</p>
            </div>
         )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && selectedTech && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
             />
             <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
             >
                <div className="flex justify-between items-center mb-10">
                   <div className="flex items-center gap-4">
                      <button onClick={() => setShowModal(false)} className="p-2.5 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 transition-all">
                         <X size={20} />
                      </button>
                      <h3 className="text-2xl font-black text-slate-900 font-outfit">تفاصيل ملف الفني</h3>
                   </div>
                   <div className="px-6 py-2 bg-blue-600/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                      طلب رقم: #{selectedTech._id.slice(-6)}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Left: Professional Info & Wallet */}
                    <div className="md:col-span-2 space-y-8">
                       <div className="grid grid-cols-2 gap-6">
                          <div className="glass-card p-6 flex items-center justify-between">
                             <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase mb-1">رصيد المحفظة</p>
                                <h3 className="text-2xl font-black text-slate-900 font-outfit">{selectedTech.walletBalance} د.ل</h3>
                             </div>
                             <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <Wallet className="text-blue-500" size={24} />
                             </div>
                          </div>
                          <div className="glass-card p-6 flex items-center justify-between">
                             <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase mb-1">متوسط التقييم</p>
                                <h3 className="text-2xl font-black text-slate-900 font-outfit">⭐ {selectedTech.rating}</h3>
                             </div>
                             <div className="p-3 bg-amber-500/10 rounded-2xl">
                                <Star className="text-amber-500" size={24} />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="text-slate-900 font-black text-lg text-right pr-2">التخصصات والماركات</h4>
                          <div className="glass-card p-8 text-right space-y-6">
                              <div>
                                 <p className="text-slate-500 text-[10px] font-black uppercase mb-3">الأجهزة المتخصص بها</p>
                                 <div className="flex flex-wrap gap-2 justify-end">
                                    {selectedTech.specialties?.length > 0 ? selectedTech.specialties.map(s => (
                                      <span key={s._id} className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-xs font-bold border border-blue-500/10">
                                         {s.nameAr}
                                      </span>
                                    )) : <span className="text-slate-600 text-xs italic">لم يتم تحديد أجهزة</span>}
                                 </div>
                              </div>
                              <div>
                                 <p className="text-slate-500 text-[10px] font-black uppercase mb-3">الماركات التي يعمل عليها</p>
                                 <div className="flex flex-wrap gap-2 justify-end">
                                    {selectedTech.brands?.length > 0 ? selectedTech.brands.map(b => (
                                      <span key={b._id} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/10">
                                         {b.nameAr}
                                      </span>
                                    )) : <span className="text-slate-600 text-xs italic">لم يتم تحديد ماركات</span>}
                                 </div>
                              </div>
                          </div>
                       </div>
                    </div>

                   {/* Right: Info Card */}
                   <div className="space-y-6">
                      <div className="glass-card p-8 flex flex-col items-center text-center">
                         <div className="w-24 h-24 bg-white rounded-[32px] border-2 border-white/5 mb-6 flex items-center justify-center overflow-hidden">
                            {selectedTech.profileImage ? (
                               <img src={`${import.meta.env.VITE_API_URL}/${selectedTech.profileImage}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                               <Users size={40} className="text-slate-700" />
                            )}
                         </div>
                         <h4 className="text-2xl font-black text-slate-900 mb-1 font-outfit">
                            {selectedTech.firstName} {selectedTech.lastName}
                         </h4>
                         <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-6">Expert Technician</p>
                         
                         <div className="w-full space-y-4 pt-6 border-t border-white/5">
                            <div className="flex justify-between items-center px-2">
                               <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Phone</span>
                               <span className="text-slate-900 font-black text-sm">{selectedTech.phone}</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                               <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">City</span>
                               <span className="text-slate-900 font-black text-sm">{selectedTech.location}</span>
                            </div>
                         </div>
                      </div>

                      {!selectedTech.isPending ? (
                        <div className="grid grid-cols-1 gap-4 pt-6">
                           <button 
                             onClick={() => handleRecharge(selectedTech.userId)}
                             className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3"
                           >
                              <TrendingUp size={20} />
                              <span>شحن المحفظة</span>
                           </button>
                           <button 
                             onClick={() => handleExportWallet(selectedTech.userId)}
                             className="w-full bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 font-black py-5 rounded-[24px] transition-all flex items-center justify-center gap-3"
                           >
                              <Download size={20} />
                              <span>تنزيل كشف الحساب</span>
                           </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 pt-6">
                           <button 
                             onClick={() => handleApprove(selectedTech._id)}
                             className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-[24px] shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3"
                           >
                              <CheckCircle size={20} />
                              <span>الموافقة والاعتماد</span>
                           </button>
                           <button 
                             onClick={() => handleReject(selectedTech._id)}
                             className="w-full bg-white/5 hover:bg-red-500 text-slate-500 hover:text-white border border-white/5 font-black py-5 rounded-[24px] transition-all flex items-center justify-center gap-3"
                           >
                              <XCircle size={20} />
                              <span>رفض الطلب</span>
                           </button>
                        </div>
                      )}
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Technicians;
