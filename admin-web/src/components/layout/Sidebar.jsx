import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Users, 
  Settings, 
  Package, 
  Tag,
  LogOut,
  ShieldCheck,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const menuItems = [
    { name: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'سجل الطلبات', icon: <ClipboardList size={20} />, path: '/requests' },
    { name: 'البث الحي الآن', icon: <Activity size={20} />, path: '/live-feed', badge: 'LIVE' },
    { name: 'الفنيين', icon: <Users size={20} />, path: '/technicians' },
    { name: 'أنواع الأجهزة', icon: <Package size={20} />, path: '/appliances' },
    { name: 'الماركات التجارية', icon: <Tag size={20} />, path: '/brands' },
    { name: 'أكواد الأعطال', icon: <AlertTriangle size={20} />, path: '/error-codes' },
  ];

  return (
    <div className="w-[280px] h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 shadow-xl shadow-slate-200/20">
      {/* Brand Logo */}
      <div className="p-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <ShieldCheck className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-slate-900 font-black text-xl leading-none">TechnoHome</h1>
          <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-1 block">Admin Core</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group font-outfit
              ${isActive 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}
            `}
          >
            <div className="flex items-center gap-4">
              <span className={`transition-transform duration-300 group-hover:scale-110`}>
                {item.icon}
              </span>
              <span className="font-bold text-[14px]">{item.name}</span>
            </div>
            {item.badge && (
               <span className="bg-red-50 text-red-500 text-[9px] font-black px-2.5 py-1 rounded-lg border border-red-100">
                 {item.badge}
               </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Profile/Actions */}
      <div className="p-8 border-t border-slate-50">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 font-bold text-sm"
        >
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
