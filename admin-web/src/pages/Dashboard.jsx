import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Wrench, 
  Clock,
  AlertCircle,
  ShieldCheck,
  Activity,
  AlertTriangle
} from 'lucide-react';
import useAxios from '../hooks/useAxios';

const DashboardCard = ({ title, value, icon, color, trend }) => (
  <div className="glass-card p-6 flex flex-col justify-between h-44 shadow-xl shadow-black/10">
    <div className="flex justify-between items-start">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-20 border border-white/5`}>
        {React.cloneElement(icon, { className: color.replace('bg-', 'text-') })}
      </div>
      {trend && (
        <div className="flex flex-col items-end ">
          <span className="text-emerald-500 text-[10px] font-black bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
            +{trend}%
          </span>
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-400 font-bold text-[10px] mb-1 uppercase tracking-widest font-outfit">{title}</p>
      <h3 className="text-3xl font-black text-white">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const api = useAxios();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/statistics');
        setStats(response.data.data);
        setLoading(false);
      } catch (err) {
        // عرض رسالة خطأ واضحة في حالة فشل الصلاحيات
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        } else {
          setError('فشل تحميل البيانات. يرجى المحاولة مرة أخرى.');
        }
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
     <div className="flex items-center justify-center h-[60vh]">
        <Activity className="text-blue-500 animate-spin" size={48} />
     </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
      <AlertTriangle className="text-red-500 mb-6" size={64} />
      <h2 className="text-2xl font-black text-white mb-3">عذراً، حدث خطأ</h2>
      <p className="text-slate-400 font-bold text-sm mb-8">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3 rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
      >
        إعادة تحميل الصفحة
      </button>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 font-outfit tracking-tight">مرحباً بك مجدداً</h2>
          <p className="text-slate-400 font-bold text-sm">هذه نظرة سريعة على أداء TechnoHome اليوم</p>
        </div>
        <div className="flex gap-4">
           <button className="glass px-6 py-3 rounded-2xl text-slate-300 font-bold text-sm border border-white/10 hover:bg-white/5 transition-colors">تنزيل التقرير</button>
           <button className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95">إضافة فني جديد</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="إجمالي المستخدمين" 
          value={stats?.users?.total || 0} 
          icon={<Users size={24} />} 
          color="bg-emerald-500"
        />
        <DashboardCard 
          title="طلبات الصيانة" 
          value={stats?.serviceRequests?.total || 0} 
          icon={<Wrench size={24} />} 
          color="bg-blue-500"
        />
        <DashboardCard 
          title="طلبات الطوارئ" 
          value={stats?.serviceRequests?.emergency || 0} 
          icon={<AlertCircle size={24} />} 
          color="bg-red-500"
        />
        <DashboardCard 
          title="الفنيين المعتمدين" 
          value={stats?.users?.technicians || 0} 
          icon={<ShieldCheck size={24} />} 
          color="bg-purple-500"
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Recent Activity (Can be linked to real activity later) */}
         <div className="lg:col-span-2 glass-card p-10">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-xl font-black text-white font-outfit">النشاط الأخير</h3>
               <button className="text-blue-400 hover:text-blue-300 transition-colors font-black text-[10px] uppercase tracking-widest">عرض سجل العمليات</button>
            </div>
            
            <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex items-center justify-between p-5 bg-white/[0.03] hover:bg-white/[0.06] rounded-[24px] border border-white/5 transition-all group">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-blue-500/20 transition-all">
                          <Clock className="text-slate-500 group-hover:text-blue-400 transition-colors" size={24} />
                       </div>
                       <div>
                          <p className="text-white font-bold text-base">عملية تحديث نظام</p>
                          <p className="text-slate-500 text-xs font-bold mt-0.5">بواسطة: النظام التلقائي</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">ناجح</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="glass-card p-10 flex flex-col">
             <h3 className="text-xl font-black text-white mb-10 font-outfit">توزيع المنصة</h3>
             <div className="space-y-8 flex-1">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50" />
                      <span className="text-slate-300 font-bold text-sm">العلامات التجارية</span>
                   </div>
                   <span className="text-white font-black text-lg">{stats?.system?.brands || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm shadow-indigo-500/50" />
                      <span className="text-slate-300 font-bold text-sm">أنواع الأجهزة</span>
                   </div>
                   <span className="text-white font-black text-lg">{stats?.system?.applianceTypes || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-sm shadow-amber-500/50" />
                      <span className="text-slate-300 font-bold text-sm">طلبات معلقة</span>
                   </div>
                   <span className="text-amber-500 font-black text-lg">{stats?.serviceRequests?.pending || 0}</span>
                </div>
             </div>
             
             <div className="mt-10 p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                <p className="text-slate-500 text-[10px] font-bold text-center">آخر تحديث للبيانات: الآن</p>
             </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
