import React from 'react';
import { Bell, Search, User, ChevronDown } from 'lucide-react';

const TopBar = ({ admin }) => {
  const adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'عبد الرحيم';

  return (
    <div className="h-24 w-[calc(100%-280px)] bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-12 fixed top-0 right-0 z-10 shadow-sm">
      {/* Search Area */}
      <div className="relative w-96 group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="البحث عن فنيين، طلبات، أو تقارير..."
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-14 pr-6 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-outfit"
        />
      </div>
      

      {/* Right Actions */}
      <div className="flex items-center gap-8">
        {/* Notifications */}
        <button className="relative p-3 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all border border-slate-100 group">
           <Bell size={22} className="text-slate-400 group-hover:text-indigo-600" />
           <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm shadow-red-500/20" />
        </button>

        {/* Vertical Divider */}
        <div className="h-10 w-[1px] bg-slate-100" />

        {/* User Profile */}
        <button className="flex items-center gap-4 py-2 group">
           <div className="text-right">
              <p className="text-slate-900 font-black text-sm leading-tight font-outfit">{adminName}</p>
              <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-0.5">Super Admin</p>
           </div>
           <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm group-hover:bg-indigo-100 transition-all">
              <User size={24} className="text-indigo-600" />
           </div>
           <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
