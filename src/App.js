// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import OwnerDashboard from './components/Dashboard/OwnerDashboard';
import RenterDashboard from './components/Dashboard/RenterDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

function AppContent() {
  const { currentUser, loading, role } = useAuth(); // `role` must be provided by your AuthContext

  if (loading) return <LoadingSpinner />;

  const renderDashboard = () => {
    if (role === 'admin') return <AdminDashboard />;
    if (role === 'owner') return <OwnerDashboard />;
    if (role === 'renter') return <RenterDashboard />;
    return <Dashboard />; // fallback or shared dashboard
  };

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!currentUser ? <Signup /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!currentUser ? <Signup /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Dashboard - Protected */}
      <Route
        path="/dashboard"
        element={currentUser ? renderDashboard() : <Navigate to="/login" />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;