
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/Dashboard';
import Login from '@/components/Login';
import { Toaster } from '@/components/ui/toaster';
import { pdfjs } from 'react-pdf';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

function App() {
  const { user, loading } = useAuth();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  if (loading) {
    return (
      <div className={`${theme} min-h-screen flex items-center justify-center bg-background`}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`${theme} antialiased`}>
      <Toaster />
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="/dashboard/*" 
            element={user ? <Dashboard toggleTheme={toggleTheme} currentTheme={theme} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/register-entry" 
            element={user ? <Dashboard toggleTheme={toggleTheme} currentTheme={theme} initialModule="register-entry" /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="*" 
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
    </div>
  );
}

export default App;
