import React from 'react';
import { Bell, Search, User, ChevronDown } from 'lucide-react';

const TopBar = ({ admin }) => {
  const adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'عبد الرحيم';

  return (
    <div className="h-20 w-[calc(100%-280px)] glass border-b border-white/5 flex items-center justify-between px-12 fixed top-0 right-0 z-10">
      {/* Search Area */}
      <div className="relative w-96 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="ابحث عن طلبات، فنيين، أو عملاء..."
          className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-outfit"
        />
      </div>
      

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10 group">
           <Bell size={20} className="text-slate-400 group-hover:text-white" />
           <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-slate-900 shadow-sm shadow-blue-500/50" />
        </button>

        {/* Vertical Divider */}
        <div className="h-8 w-[1px] bg-white/10" />

        {/* User Profile */}
        <button className="flex items-center gap-3 pl-2 pr-4 py-2 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 group">
           <div className="text-right">
              <p className="text-white font-black text-sm leading-tight font-outfit">{adminName}</p>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Super Admin</p>
           </div>
           <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center border border-white/10 shadow-lg group-hover:border-blue-500/30 transition-all">
              <User size={20} className="text-white" />
           </div>
           <ChevronDown size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
