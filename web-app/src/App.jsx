import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ManageUsersPage from './pages/ManageUsersPage';
import StatisticsPage from './pages/StatisticsPage';
import SyncPage from './pages/SyncPage';
import './App.css';

function App() {
  const { loadFromStorage, user } = useAuthStore();
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    console.log('🚀 App initializing...');
    console.log('📍 DEV mode:', import.meta.env.DEV);

    // Load auth state from localStorage on app mount
    loadFromStorage();
    console.log('📦 Loaded from storage - current user:', user);
  }, [loadFromStorage]);

  return (
    <Router>
      <div className="min-vh-100 bg-light">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/manage-users" element={<ManageUsersPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/sync" element={<SyncPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
