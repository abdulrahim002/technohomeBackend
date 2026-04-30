import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Dashboard from './pages/Dashboard';
import Appliances from './pages/Appliances';
import Brands from './pages/Brands';
import LiveFeed from './pages/LiveFeed';
import Technicians from './pages/Technicians';
import ServiceRequests from './pages/ServiceRequests';
import ErrorCodes from './pages/ErrorCodes';
import LoginPage from './pages/LoginPage';

function App() {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('techno_admin_user');
    if (savedAdmin) setAdmin(JSON.parse(savedAdmin));
    setChecking(false);
  }, []);

  if (checking) return null;

  if (!admin) {
    return <LoginPage onLogin={(user) => setAdmin(user)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('techno_admin_token');
    localStorage.removeItem('techno_admin_user');
    setAdmin(null);
  };

  return (
    <Router>
      <div className="flex bg-[#F8FAFC] min-h-screen text-slate-900 font-outfit">
        {/* Fixed Sidebar */}
        <Sidebar onLogout={handleLogout} />

        {/* Main Content Area */}
        <div className="flex-1 ml-[280px]">
          {/* Fixed TopBar */}
          <TopBar admin={admin} />

          {/* Page Content Rendering Area */}
          <main className="pt-28 pb-12 px-12 animate-in fade-in duration-500">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/requests" element={<ServiceRequests />} />
              <Route path="/live-feed" element={<LiveFeed />} />
              <Route path="/appliances" element={<Appliances />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/technicians" element={<Technicians />} />
              <Route path="/error-codes" element={<ErrorCodes />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
