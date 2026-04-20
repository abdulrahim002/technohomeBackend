import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Activity, 
  MapPin, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveFeed = () => {
  const [requests, setRequests] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // الاتصال بخادم السوكت
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Live Feed');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // الاستماع للطلبات الجديدة
    socket.on('newServiceRequest', (data) => {
      setRequests(prev => [data, ...prev].slice(0, 20)); // نحفظ آخر 20 طلب فقط
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with connection status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3 font-outfit tracking-tight">
            البث الحي للطلبات
            <Activity className="text-red-500 animate-pulse" size={28} />
          </h2>
          <p className="text-slate-400 font-bold text-sm">راقب الطلبات التي تدخل النظام الآن بلحظتها</p>
        </div>
        
        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'} transition-all duration-500 shadow-lg shadow-emerald-500/5`}>
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest font-outfit">
            {isConnected ? 'Live Connection Active' : 'Connecting to Server...'}
          </span>
        </div>
      </div>

      {/* Main Feed */}
      <div className="max-w-4xl space-y-4">
        <AnimatePresence initial={false}>
          {requests.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="glass-card p-24 text-center border-dashed border-white/10"
            >
               <div className="w-24 h-24 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <Clock className="text-slate-600" size={36} />
               </div>
               <h3 className="text-white font-black text-2xl mb-3 font-outfit">في انتظار الطلبات...</h3>
               <p className="text-slate-500 font-bold text-sm mx-auto max-w-sm">بمجرد قيام أي عميل بطلب صيانة، سيظهر هنا فوراً بدون تحديث الصفحة</p>
            </motion.div>
          ) : (
            requests.map((request, index) => (
              <motion.div
                key={request._id + index}
                initial={{ opacity: 0, x: -20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`glass-card p-7 flex items-center justify-between border-l-4 ${request.type === 'emergency' ? 'border-red-500 shadow-red-500/5' : 'border-blue-500 shadow-blue-500/5'} shadow-2xl`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${request.type === 'emergency' ? 'bg-red-500/10 text-red-500 border border-red-500/10' : 'bg-blue-500/10 text-blue-500 border border-blue-500/10'}`}>
                    {request.type === 'emergency' ? <AlertCircle size={32} /> : <Wrench size={32} />}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-4 mb-1.5 text-right">
                      <h4 className="text-white font-black text-xl font-outfit">{request.title}</h4>
                      {request.type === 'emergency' && (
                        <span className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-lg shadow-lg shadow-red-500/20 uppercase tracking-widest">URGENT</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm font-bold mb-3 text-right">{request.message}</p>
                    <div className="flex items-center justify-end gap-6 text-slate-500">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                          <Clock size={14} />
                          <span>منذ ثوانٍ</span>
                       </div>
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                          <MapPin size={14} />
                          <span className="font-outfit">طرابلس، ليبيا</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <button className="px-8 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-300 hover:text-white font-black text-xs rounded-2xl transition-all active:scale-95">
                     تتبع الطلب
                  </button>
                  <ChevronRight size={24} className="text-slate-700" />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveFeed;
