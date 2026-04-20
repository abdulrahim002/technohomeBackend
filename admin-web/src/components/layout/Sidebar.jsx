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
    <div className="w-[280px] h-screen glass border-r border-white/5 flex flex-col fixed left-0 top-0">
      {/* Brand Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-white font-black text-lg leading-none">TechnoHome</h1>
          <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group font-outfit
              ${isActive 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </span>
              <span className="font-semibold text-sm">{item.name}</span>
            </div>
            {item.badge && (
               <span className="bg-red-500/10 text-red-500 text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse border border-red-500/20">
                 {item.badge}
               </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Profile/Actions */}
      <div className="p-6 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-colors duration-300 font-bold text-sm"
        >
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
