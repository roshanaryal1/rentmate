import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/Dashboard/Dashboard';
import PublicDashboard from './components/Dashboard/PublicDashboard';
// import AuthDebug from './components/AuthDebug'; // Uncomment this line and add the component

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        {/* <AuthDebug /> */} {/* Uncomment this to see auth status */}
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { currentUser, loading } = useAuth();

  console.log('AppContent render:', { currentUser, loading }); // Add debug logging

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
      {/* Show PublicDashboard as the default page for everyone */}
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/dashboard" element={<PublicDashboard />} />
      
      {/* Authentication routes */}
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/my-dashboard" />} />
      <Route path="/signup" element={!currentUser ? <Signup /> : <Navigate to="/my-dashboard" />} />
      <Route path="/register" element={!currentUser ? <Signup /> : <Navigate to="/my-dashboard" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Protected dashboard for authenticated users */}
      <Route path="/my-dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/login" />} />
      
      {/* Catch-all route to handle any undefined paths */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;