import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye } from 'lucide-react';
import useAxios from '../hooks/useAxios';

// ترجمة الحالات
const STATUS = {
  pending: { label: 'معلق', color: 'bg-amber-500/10 text-amber-500 border-amber-500/10' },
  accepted: { label: 'مقبول', color: 'bg-blue-500/10 text-blue-500 border-blue-500/10' },
  on_the_way: { label: 'في الطريق', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/10' },
  arrived: { label: 'وصل', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/10' },
  in_progress: { label: 'قيد الإصلاح', color: 'bg-orange-500/10 text-orange-500 border-orange-500/10' },
  completed: { label: 'مكتمل', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' },
  cancelled: { label: 'ملغي', color: 'bg-red-500/10 text-red-500 border-red-500/10' },
};

const ServiceRequests = () => {
  const api = useAxios();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/service-requests');
      setRequests(res.data.data.requests || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // فلترة حسب الحالة
  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-8">
      {/* العنوان + فلتر */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 font-outfit">سجل الطلبات</h2>
          <p className="text-slate-400 text-sm font-bold mt-1">جميع طلبات الصيانة في المنصة</p>
        </div>

        {/* أزرار الفلترة */}
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'accepted', 'on_the_way', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${filter === s
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}`}
            >
              {s === 'all' ? 'الكل' : STATUS[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* عداد النتائج */}
      <p className="text-slate-500 text-xs font-bold">{filtered.length} طلب</p>

      {/* الجدول */}
      <div className="glass rounded-[28px] overflow-hidden border border-slate-200">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">السعر</th>
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">الحالة</th>
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">التاريخ</th>
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">الجهاز</th>
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">العميل</th>
              <th className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">#</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i}>
                  <td colSpan="6" className="px-6 py-6">
                    <div className="h-4 bg-white/5 rounded-full animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-16 text-slate-500 font-bold">لا توجد طلبات</td>
              </tr>
            ) : (
              filtered.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-5 text-slate-900 font-black text-sm">
                    {req.finalPrice ? `${req.finalPrice} د.ل` : '—'}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${STATUS[req.status]?.color || 'text-slate-400'}`}>
                      {STATUS[req.status]?.label || req.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-400 text-xs font-bold">
                    {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-5 text-slate-900 font-bold text-sm">
                    {req.device?.name || 'غير محدد'}
                  </td>
                  <td className="px-6 py-5 text-slate-900 font-bold text-sm">
                    {req.customer?.firstName} {req.customer?.lastName}
                  </td>
                  <td className="px-6 py-5 text-slate-400 font-bold text-xs">
                    #{req._id?.slice(-6).toUpperCase()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceRequests;
