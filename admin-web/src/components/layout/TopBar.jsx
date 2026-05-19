import React from 'react';
import { User, ChevronDown } from 'lucide-react';

const TopBar = ({ admin }) => {
  const adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'عبد الرحيم';

  return (
    <div className="h-24 w-[calc(100%-280px)] bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-end px-12 fixed top-0 right-0 z-10 shadow-sm">
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
  );
};

export default TopBar;
