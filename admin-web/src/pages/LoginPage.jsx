import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const LoginPage = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { phone, password });
      const { token, user } = res.data.data;

      if (user.role !== 'admin') {
        setError('هذا الحساب ليس حساب إدارة');
        setLoading(false);
        return;
      }

      localStorage.setItem('techno_admin_token', token);
      localStorage.setItem('techno_admin_user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-6 font-outfit">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-white font-black text-2xl">TechnoHome</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Admin Panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="glass p-8 rounded-[32px] border border-white/10 space-y-6">
          <div>
            <label className="text-slate-400 font-bold text-xs block mb-2 text-right">رقم الهاتف</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09XXXXXXXX"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-right focus:border-blue-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 font-bold text-xs block mb-2 text-right">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-right focus:border-blue-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm font-bold text-center bg-red-500/10 py-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
