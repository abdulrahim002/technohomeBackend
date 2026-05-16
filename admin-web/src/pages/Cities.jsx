import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  MapPin, 
  X,
  CheckCircle2,
  Navigation,
  RefreshCcw,
  Layers
} from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { motion, AnimatePresence } from 'framer-motion';

const Cities = () => {
  const api = useAxios();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    nameEn: '',
    latitude: 32.8872,
    longitude: 13.1913,
    isActive: true
  });

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await api.get('/admin/cities');
      setCities(response.data.data.cities);
      setLoading(false);
    } catch (error) {
      console.error('Fetch failed:', error);
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!window.confirm('هل تريد مزامنة البيانات مع ملف المدن الرئيسي؟ سيؤدي هذا لتحديث كافة المناطق والإحداثيات.')) return;
    
    setSyncing(true);
    try {
      await api.post('/admin/cities/sync');
      await fetchCities();
      alert('تمت المزامنة بنجاح!');
    } catch (error) {
      alert('فشلت عملية المزامنة');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCity) {
        await api.patch(`/admin/cities/${editingCity._id}`, formData);
      } else {
        await api.post('/admin/cities', formData);
      }
      setShowModal(false);
      setEditingCity(null);
      setFormData({ name: '', nameAr: '', nameEn: '', latitude: 32.8872, longitude: 13.1913, isActive: true });
      fetchCities();
    } catch (error) {
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المدينة؟ سيؤثر هذا على المستخدمين المرتبطين بها.')) {
      try {
        await api.delete(`/admin/cities/${id}`);
        fetchCities();
      } catch (error) {
        alert('فشل الحذف');
      }
    }
  };

  const toggleStatus = async (city) => {
    try {
      await api.patch(`/admin/cities/${city._id}`, { isActive: !city.isActive });
      fetchCities();
    } catch (error) {
      alert('فشل تغيير الحالة');
    }
  };

  const openEditModal = (city) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      nameAr: city.nameAr,
      nameEn: city.nameEn,
      latitude: city.latitude || 32.8872,
      longitude: city.longitude || 13.1913,
      isActive: city.isActive
    });
    setShowModal(true);
  };

  const filtered = cities.filter(c =>
    c.nameAr?.includes(search) || c.nameEn?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 font-outfit tracking-tight">إدارة المدن</h2>
          <p className="text-slate-500 font-bold text-sm">تحكم في التغطية الجغرافية للخدمات في ليبيا</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing}
          className={`flex items-center gap-2 ${syncing ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95`}
        >
          <RefreshCcw size={20} className={syncing ? 'animate-spin' : ''} />
          <span>{syncing ? 'جاري المزامنة...' : 'مزامنة مع ملف المدن'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          placeholder="ابحث عن مدينة..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-11 pl-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 text-right"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="glass-card h-48 animate-pulse bg-slate-50" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400 font-bold">
            لا توجد مدن مطابقة
          </div>
        ) : (
          filtered.map((city) => (
            <div key={city._id} className="glass-card p-6 group hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${city.isActive ? 'bg-indigo-50 border-indigo-100 group-hover:bg-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
                  <MapPin className={city.isActive ? 'text-indigo-600' : 'text-slate-400'} size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button 
                    onClick={() => openEditModal(city)} 
                    className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    title="تعديل"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(city._id)} 
                    className="p-2 bg-red-50 rounded-xl text-red-400 hover:bg-red-100 transition-all"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1 text-right font-outfit">{city.nameAr}</h3>
              <p className="text-slate-400 font-bold text-xs text-right uppercase tracking-widest mb-4">{city.nameEn}</p>
              
              <div className="flex items-center justify-end gap-2 mb-5">
                <span className="bg-slate-50 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-100 flex items-center gap-1.5">
                  {city.areas?.length || 0} منطقة
                  <Layers size={10} />
                </span>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button 
                  onClick={() => toggleStatus(city)}
                  className={`flex items-center gap-2 transition-all ${city.isActive ? 'text-emerald-500' : 'text-slate-300'}`}
                >
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{city.isActive ? 'نشط' : 'معطل'}</span>
                </button>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                  <Navigation size={10} />
                  <span>
                    {city.latitude ? city.latitude.toFixed(2) : '0.00'}, {city.longitude ? city.longitude.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-2.5 bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <X size={20} />
                </button>
                <h3 className="text-2xl font-black text-slate-900 font-outfit">
                  {editingCity ? 'تعديل بيانات المدينة' : 'إضافة مدينة جديدة'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-widest text-right block">الاسم بالعربية</label>
                    <input 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-right font-bold focus:border-indigo-400 focus:outline-none transition-colors"
                      placeholder="مثال: طرابلس"
                      value={formData.nameAr}
                      onChange={e => setFormData({...formData, nameAr: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-widest block">Name (English)</label>
                    <input 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-400 focus:outline-none transition-colors"
                      placeholder="e.g. Tripoli"
                      value={formData.nameEn}
                      onChange={e => setFormData({...formData, nameEn: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-500 font-bold text-xs uppercase tracking-widest block">الاسم المختصر (Slug - Unique Name)</label>
                  <input 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-400 focus:outline-none transition-colors"
                    placeholder="e.g. tripoli"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-widest block">Latitude</label>
                    <input 
                      required
                      type="number"
                      step="any"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-400 focus:outline-none transition-colors"
                      value={formData.latitude}
                      onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 font-bold text-xs uppercase tracking-widest block">Longitude</label>
                    <input 
                      required
                      type="number"
                      step="any"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:border-indigo-400 focus:outline-none transition-colors"
                      value={formData.longitude}
                      onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                   <input 
                      type="checkbox" 
                      id="isActive"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-5 h-5 accent-indigo-600"
                   />
                   <label htmlFor="isActive" className="text-sm font-bold text-slate-700">تفعيل المدينة لاستقبال الطلبات فوراً</label>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[24px] shadow-xl shadow-indigo-600/20 transition-all mt-2 active:scale-[0.98]"
                >
                  {editingCity ? 'تحديث بيانات المدينة' : 'إضافة المدينة'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cities;
