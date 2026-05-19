import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  User, 
  Calendar, 
  Search, 
  MessageSquare, 
  FileText, 
  CheckCircle,
  Ban,
  Unlock,
  Coins,
  X
} from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { motion, AnimatePresence } from 'framer-motion';

const Reports = () => {
  const api = useAxios();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'pending', 'resolved'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'no_show', 'behavior', 'bypass_commission', 'other'
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchReports();
  }, [filter, categoryFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `/reports?status=${filter}`;
      if (categoryFilter !== 'all') {
        url += `&category=${categoryFilter}`;
      }
      const response = await api.get(url);
      setReports(response.data.data.reports || []);
      setLoading(false);
    } catch (error) {
      console.error('Fetch reports error:', error);
      setLoading(false);
    }
  };

  const handleResolve = async (id, action) => {
    try {
      await api.patch(`/reports/${id}/resolve`, {
        adminNotes,
        action
      });
      alert('تم معالجة البلاغ واتخاذ الإجراء بنجاح ✅');
      setShowModal(false);
      setAdminNotes('');
      fetchReports();
    } catch (error) {
      alert('خطأ في معالجة البلاغ، يرجى المحاولة لاحقاً');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      alert('تم تغيير حالة نشاط الحساب بنجاح ✅');
      // Refresh current report details
      if (selectedReport && selectedReport.reported._id === userId) {
        setSelectedReport(prev => ({
          ...prev,
          reported: {
            ...prev.reported,
            isActive: !prev.reported.isActive
          }
        }));
      }
      fetchReports();
    } catch (error) {
      alert('فشل تغيير حالة الحساب');
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'no_show': return 'عدم الحضور ⏰';
      case 'behavior': return 'سلوك غير لائق 🚫';
      case 'bypass_commission': return 'التفاف على العمولة 💰';
      default: return 'سبب آخر ✏️';
    }
  };

  const getRoleLabel = (role) => {
    return role === 'technician' ? 'فني' : 'عميل';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-right">
        <div className="flex-1">
          <h2 className="text-3xl font-black text-slate-900 mb-2 font-outfit tracking-tight">إدارة البلاغات والشكاوى</h2>
          <p className="text-slate-400 font-bold text-sm">راجع بلاغات العملاء والفنيين بخصوص المعاملات وسلوكيات الشات</p>
        </div>
        
        {/* Status Tabs */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
           {['pending', 'resolved'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                  ${filter === type 
                     ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                     : 'text-slate-400 hover:text-slate-600'}`}
              >
                {type === 'pending' ? 'بلاغات نشطة' : 'بلاغات معالجة'}
              </button>
           ))}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 justify-end">
        {[
          { key: 'all', label: 'الكل 📁' },
          { key: 'no_show', label: 'عدم الحضور ⏰' },
          { key: 'behavior', label: 'سلوك غير لائق 🚫' },
          { key: 'bypass_commission', label: 'تهرب من العمولة 💰' },
          { key: 'other', label: 'أسباب أخرى ✏️' }
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border
              ${categoryFilter === cat.key 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/20">
         <div className="overflow-x-auto">
            <table className="w-full text-right">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-8 py-5 text-slate-400 font-bold text-[11px] uppercase tracking-widest">التاريخ</th>
                     <th className="px-8 py-5 text-slate-400 font-bold text-[11px] uppercase tracking-widest">نوع المصدر</th>
                     <th className="px-8 py-5 text-slate-400 font-bold text-[11px] uppercase tracking-widest">المشكلة</th>
                     <th className="px-8 py-5 text-slate-400 font-bold text-[11px] uppercase tracking-widest">المشتكى عليه</th>
                     <th className="px-8 py-5 text-slate-400 font-bold text-[11px] uppercase tracking-widest">مقدّم البلاغ</th>
                     <th className="px-8 py-5 text-slate-400 font-bold text-[11px] uppercase tracking-widest text-left">التفاصيل</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                         <td colSpan="6" className="px-8 py-8"><div className="h-4 bg-slate-100 rounded-full w-full" /></td>
                      </tr>
                    ))
                  ) : reports.map((rep) => (
                    <tr key={rep._id} className="hover:bg-slate-50/50 transition-all group">
                       <td className="px-8 py-6 text-slate-400 text-xs font-bold font-outfit">
                          {new Date(rep.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                       </td>
                       <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold border
                            ${rep.source === 'chat' 
                               ? 'bg-blue-50 text-blue-600 border-blue-100' 
                               : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                             {rep.source === 'chat' ? <MessageSquare size={12} /> : <FileText size={12} />}
                             {rep.source === 'chat' ? 'محادثة شات' : 'طلب صيانة'}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-slate-900 font-bold text-sm">
                          {getCategoryLabel(rep.category)}
                       </td>
                       <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2.5">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border
                                ${rep.reported?.role === 'technician' 
                                   ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                   : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                 {getRoleLabel(rep.reported?.role)}
                              </span>
                              <span className="text-slate-900 font-black text-sm">
                                {rep.reported?.firstName} {rep.reported?.lastName}
                              </span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2.5">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border
                                ${rep.reporter?.role === 'technician' 
                                   ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                   : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                 {getRoleLabel(rep.reporter?.role)}
                              </span>
                              <span className="text-slate-900 font-black text-sm">
                                {rep.reporter?.firstName} {rep.reporter?.lastName}
                              </span>
                           </div>
                        </td>
                       <td className="px-8 py-6">
                          <button 
                             onClick={() => { setSelectedReport(rep); setShowModal(true); }}
                             className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all scale-100"
                          >
                             <Eye size={16} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {!loading && reports.length === 0 && (
            <div className="py-24 text-center">
               <ShieldAlert className="mx-auto text-slate-300 mb-4" size={48} />
               <p className="text-slate-400 font-bold text-sm">لا توجد بلاغات مسجلة في هذا القسم حالياً</p>
            </div>
         )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showModal && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
             />
             <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white p-8 rounded-[36px] shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
             >
                <div className="flex flex-row-reverse justify-between items-center mb-8 border-b border-slate-100 pb-6">
                   <div className="flex flex-row-reverse items-center gap-4">
                      <h3 className="text-xl font-black text-slate-900">معالجة وحل الشكوى ⚖️</h3>
                      <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-black tracking-wider">
                         بلاغ رقم: #{selectedReport._id.slice(-6)}
                      </span>
                   </div>
                   <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-400 transition-all">
                      <X size={18} />
                   </button>
                </div>

                <div className="space-y-6 text-right">
                  {/* Parties Card */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">المشتكى عليه</p>
                      <h4 className="text-sm font-black text-slate-900">
                        {selectedReport.reported?.firstName} {selectedReport.reported?.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{selectedReport.reported?.phone}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold ${selectedReport.reported?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedReport.reported?.isActive ? 'نشط' : 'حساب مجمد 🚫'}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">مقدم الشكوى</p>
                      <h4 className="text-sm font-black text-slate-900">
                        {selectedReport.reporter?.firstName} {selectedReport.reporter?.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{selectedReport.reporter?.phone}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] bg-slate-200 text-slate-600 font-bold">
                        {getRoleLabel(selectedReport.reporter?.role)}
                      </span>
                    </div>
                  </div>

                  {/* Complaint details */}
                  <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                    <p className="text-[10px] text-indigo-500 font-black uppercase mb-1.5">تفاصيل الشكوى المقدمة</p>
                    <h5 className="text-sm font-black text-slate-900 mb-2">{getCategoryLabel(selectedReport.category)}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">{selectedReport.description}</p>
                    {selectedReport.chatRoomId && (
                      <div className="mt-3 pt-3 border-t border-indigo-100/50 flex justify-between items-center">
                        <span className="text-[10px] font-black font-outfit text-indigo-600">ID: {selectedReport.chatRoomId}</span>
                        <span className="text-[10px] text-slate-400 font-bold">معرف محادثة الشات</span>
                      </div>
                    )}
                  </div>

                  {selectedReport.status === 'pending' ? (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      {/* Action trigger controls */}
                      <p className="text-xs font-black text-slate-500 pr-1">الإجراءات السريعة الفورية للإدارة:</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Freeze user toggler */}
                        <button 
                          onClick={() => handleToggleUserStatus(selectedReport.reported?._id)}
                          className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-xs border transition-all
                            ${selectedReport.reported?.isActive 
                              ? 'bg-red-50 hover:bg-red-100 border-red-100 text-red-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-600'}`}
                        >
                          {selectedReport.reported?.isActive ? <Ban size={16} /> : <Unlock size={16} />}
                          <span>{selectedReport.reported?.isActive ? 'تجميد حساب المشتكى عليه' : 'تنشيط وإلغاء حظر الحساب'}</span>
                        </button>

                        {/* Refund tech commission */}
                        {selectedReport.source === 'booking' && (
                          <button 
                            onClick={() => handleResolve(selectedReport._id, 'refund_commission')}
                            className="flex items-center justify-center gap-2 py-4 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-600 rounded-2xl font-bold text-xs transition-all"
                          >
                            <Coins size={16} />
                            <span>رد عمولة الطلب للفني المتضرر</span>
                          </button>
                        )}
                      </div>

                      {/* Notes & resolve confirmation */}
                      <div className="space-y-2 mt-4">
                        <label className="text-xs font-black text-slate-500 pr-1 block">ملاحظات الأدمن لحل الشكوى:</label>
                        <textarea 
                          value={adminNotes} 
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="اكتب ملاحظاتك حول طريقة حل النزاع هنا..." 
                          className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:border-indigo-500 focus:outline-none min-h-[80px]"
                        />
                      </div>

                      <button 
                        onClick={() => handleResolve(selectedReport._id, 'none')}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        <span>إغلاق وتحديد الشكوى كـ "تمت المعالجة"</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                      <div className="text-right">
                        <p className="text-xs font-black">تمت معالجة وحل هذه الشكوى مسبقاً</p>
                        {selectedReport.adminNotes && (
                          <p className="text-[11px] mt-1 text-emerald-600/80 font-bold">ملاحظات الإدارة: {selectedReport.adminNotes}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
