import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/Dashboard/Dashboard';
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
  const { currentUser, userRole, loading } = useAuth();

  console.log('AppContent render:', { currentUser, userRole, loading }); // Add debug logging

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
      {/* Redirect to login as default for non-authenticated users */}
      <Route path="/" element={currentUser ? <Navigate to="/my-dashboard" /> : <Navigate to="/login" />} />
      <Route path="/dashboard" element={currentUser ? <Navigate to="/my-dashboard" /> : <Navigate to="/login" />} />
      
      {/* Authentication routes */}
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/my-dashboard" />} />
      <Route path="/signup" element={!currentUser ? <Signup /> : <Navigate to="/my-dashboard" />} />
      <Route path="/register" element={!currentUser ? <Signup /> : <Navigate to="/my-dashboard" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Protected dashboard for authenticated users - will automatically show the right dashboard based on role */}
      <Route path="/my-dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/login" />} />
      
      {/* Role-specific routes for direct access */}
      <Route 
        path="/renter-dashboard" 
        element={
          currentUser && userRole === 'renter' ? <Dashboard /> : 
          currentUser ? <Navigate to="/my-dashboard" /> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/owner-dashboard" 
        element={
          currentUser && userRole === 'owner' ? <Dashboard /> : 
          currentUser ? <Navigate to="/my-dashboard" /> : 
          <Navigate to="/login" />
        } 
      />
      <Route 
        path="/admin-dashboard" 
        element={
          currentUser && userRole === 'admin' ? <Dashboard /> : 
          currentUser ? <Navigate to="/my-dashboard" /> : 
          <Navigate to="/login" />
        } 
      />
      
      {/* Catch-all route to handle any undefined paths */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;