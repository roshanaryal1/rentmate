import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Signup from './components/auth/Signup';  // Ensure 'auth' is lowercase
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/Dashboard/Dashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.5rem'
    }}>
      Loading...
    </div>;
  }

  return (
    <Routes>
      {/* Show Signup as the default page */}
      <Route path="/" element={!currentUser ? <Signup /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!currentUser ? <Signup /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!currentUser ? <Signup /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/signup" />} />
      {/* Catch-all route to handle any undefined paths */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;