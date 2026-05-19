import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  MapPin, 
  Phone, 
  ShieldAlert, 
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import useAxios from '../hooks/useAxios';

const Customers = () => {
  const api = useAxios();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users?role=client');
      setCustomers(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const actionText = currentStatus ? 'تجميد' : 'تنشيط';
    const confirmed = window.confirm(`هل أنت متأكد من ${actionText} حساب هذا العميل؟`);
    if (!confirmed) return;

    try {
      await api.post(`/admin/users/${userId}/toggle-status`);
      alert(`تم ${actionText} حساب العميل بنجاح ✅`);
      fetchCustomers();
    } catch (error) {
      alert('فشل تغيير حالة الحساب');
    }
  };

  // تصفية العملاء محلياً بناءً على الاسم أو رقم الهاتف
  const filteredCustomers = customers.filter(c => {
    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

  const totalCount = customers.length;
  const activeCount = customers.filter(c => c.isActive).length;
  const suspendedCount = customers.filter(c => !c.isActive).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-right">
        <div className="flex-1">
          <h2 className="text-3xl font-black text-slate-900 mb-2 font-outfit tracking-tight">إدارة العملاء</h2>
          <p className="text-slate-400 font-bold text-sm">شاهد بيانات العملاء، وتحكم في صلاحيات وحالة حساباتهم</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center justify-between shadow-xl shadow-black/5 bg-white border border-slate-100 rounded-3xl">
          <div>
            <p className="text-slate-400 font-bold text-[10px] mb-1 uppercase tracking-widest font-outfit text-right">إجمالي العملاء</p>
            <h3 className="text-3xl font-black text-slate-900 text-right">{totalCount}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-500 bg-opacity-10 border border-indigo-500/10">
            <Users className="text-indigo-600" size={24} />
          </div>
        </div>
        <div className="glass-card p-6 flex items-center justify-between shadow-xl shadow-black/5 bg-white border border-slate-100 rounded-3xl">
          <div>
            <p className="text-slate-400 font-bold text-[10px] mb-1 uppercase tracking-widest font-outfit text-right">الحسابات النشطة</p>
            <h3 className="text-3xl font-black text-slate-900 text-right">{activeCount}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500 bg-opacity-10 border border-emerald-500/10">
            <UserCheck className="text-emerald-600" size={24} />
          </div>
        </div>
        <div className="glass-card p-6 flex items-center justify-between shadow-xl shadow-black/5 bg-white border border-slate-100 rounded-3xl">
          <div>
            <p className="text-slate-400 font-bold text-[10px] mb-1 uppercase tracking-widest font-outfit text-right">الحسابات المجمدة</p>
            <h3 className="text-3xl font-black text-slate-900 text-red-500 text-right">{suspendedCount}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-red-500 bg-opacity-10 border border-red-500/10">
            <UserX className="text-red-600" size={24} />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-end">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="ابحث باسم العميل أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-12 pl-6 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-outfit text-right"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="glass rounded-[32px] overflow-hidden border border-white/5 bg-white/40">
         <div className="overflow-x-auto">
            <table className="w-full text-right">
               <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                     <th className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest">تاريخ الانضمام</th>
                     <th className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest text-center">المدينة</th>
                     <th className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest">الحالة</th>
                     <th className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest text-left">الإجراءات</th>
                     <th className="px-8 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest text-right">الاسم الكامل</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                         <td colSpan="5" className="px-8 py-8"><div className="h-4 bg-slate-200/50 rounded-full w-full" /></td>
                      </tr>
                    ))
                  ) : filteredCustomers.map((cust) => (
                    <tr key={cust._id} className="hover:bg-white/[0.2] transition-all group">
                       <td className="px-8 py-6 text-slate-400 text-xs font-bold font-outfit">
                          {new Date(cust.createdAt).toLocaleDateString('ar-EG')}
                       </td>
                       <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs">
                             <MapPin size={14} className="text-slate-500" />
                             <span>{cust.city?.nameAr || 'غير محدد'}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                            ${cust.isActive 
                               ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' 
                               : 'bg-red-500/10 text-red-500 border-red-500/10'}`}>
                             {cust.isActive ? 'نشط' : 'مجمد'}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-left">
                          <button 
                             onClick={() => handleToggleStatus(cust._id, cust.isActive)}
                             className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                               cust.isActive 
                                 ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                                 : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                             }`}
                          >
                             {cust.isActive ? 'تجميد الحساب 🚫' : 'تنشيط الحساب ✅'}
                          </button>
                       </td>
                       <td className="px-8 py-6 text-right font-outfit">
                          <div className="flex items-center justify-end gap-3">
                             <div className="text-right">
                                <p className="text-slate-900 font-black text-sm">{cust.firstName} {cust.lastName}</p>
                                <p className="text-slate-500 text-[10px] font-bold mt-0.5">{cust.phone}</p>
                             </div>
                             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100/50">
                                <Users size={20} className="text-indigo-500" />
                             </div>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {!loading && filteredCustomers.length === 0 && (
            <div className="py-24 text-center">
               <ShieldAlert className="mx-auto text-slate-800 mb-4" size={48} />
               <p className="text-slate-500 font-bold">
                 {searchQuery ? 'لا توجد نتائج تطابق بحثك حالياً' : 'لا يوجد عملاء مسجلين حالياً'}
               </p>
            </div>
         )}
      </div>
    </div>
  );
};

export default Customers;
