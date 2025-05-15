import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import RenterDashboard from './components/Dashboard/RenterDashboard';
import OwnerDashboard from './components/Dashboard/OwnerDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import AddEquipment from './components/Dashboard/AddEquipment';

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
  const { currentUser, userRole, loading } = useAuth();

  console.log('AppContent render:', { currentUser, userRole, loading });

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
      {/* Redirect to role-specific dashboard based on user role */}
      <Route path="/" element={
        currentUser 
          ? userRole === 'renter' 
            ? <Navigate to="/renter-dashboard" />
            : userRole === 'owner'
            ? <Navigate to="/owner-dashboard" />
            : userRole === 'admin'
            ? <Navigate to="/admin-dashboard" />
            : <Navigate to="/renter-dashboard" /> // Default fallback
          : <Navigate to="/login" />
      } />
      
      {/* Authentication routes */}
      <Route path="/login" element={
        !currentUser ? <Login /> : 
        userRole === 'renter' ? <Navigate to="/renter-dashboard" /> :
        userRole === 'owner' ? <Navigate to="/owner-dashboard" /> :
        userRole === 'admin' ? <Navigate to="/admin-dashboard" /> :
        <Navigate to="/renter-dashboard" />
      } />
      <Route path="/signup" element={
        !currentUser ? <Signup /> : 
        userRole === 'renter' ? <Navigate to="/renter-dashboard" /> :
        userRole === 'owner' ? <Navigate to="/owner-dashboard" /> :
        userRole === 'admin' ? <Navigate to="/admin-dashboard" /> :
        <Navigate to="/renter-dashboard" />
      } />
      <Route path="/register" element={<Navigate to="/signup" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Role-specific dashboard routes */}
      <Route 
        path="/renter-dashboard" 
        element={
          currentUser && userRole === 'renter' 
            ? <DashboardLayout title="Renter Dashboard"><RenterDashboard /></DashboardLayout>
            : !currentUser 
            ? <Navigate to="/login" />
            : userRole === 'owner'
            ? <Navigate to="/owner-dashboard" />
            : <Navigate to="/admin-dashboard" />
        } 
      />
      <Route 
        path="/owner-dashboard" 
        element={
          currentUser && userRole === 'owner' 
            ? <DashboardLayout title="Equipment Owner Dashboard"><OwnerDashboard /></DashboardLayout>
            : !currentUser 
            ? <Navigate to="/login" />
            : userRole === 'renter'
            ? <Navigate to="/renter-dashboard" />
            : <Navigate to="/admin-dashboard" />
        } 
      />
      <Route 
        path="/admin-dashboard" 
        element={
          currentUser && userRole === 'admin' 
            ? <DashboardLayout title="Admin Dashboard"><AdminDashboard /></DashboardLayout>
            : !currentUser 
            ? <Navigate to="/login" />
            : userRole === 'renter'
            ? <Navigate to="/renter-dashboard" />
            : <Navigate to="/owner-dashboard" />
        } 
      />
      
      {/* Owner-specific routes */}
      <Route 
        path="/add-equipment" 
        element={
          currentUser && userRole === 'owner' 
            ? <DashboardLayout title="Add Equipment"><AddEquipment /></DashboardLayout>
            : <Navigate to="/login" />
        } 
      />
      
      {/* Legacy redirects */}
      <Route path="/my-dashboard" element={<Navigate to="/" />} />
      <Route path="/dashboard" element={<Navigate to="/" />} />
      
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// Layout component for dashboards
function DashboardLayout({ children, title }) {
  const { currentUser, userRole, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    setError('');
    
    try {
      setLoading(true);
      await logout();
      navigate('/login');
    } catch (error) {
      setError('Failed to log out');
      console.error(error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-blue-600">RentMate</Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {userRole === 'renter' ? 'Renter' : userRole === 'owner' ? 'Equipment Owner' : 'Admin'}
                    </span>
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? 'Logging out...' : 'Log Out'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              {title}
            </h1>
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {error && (
                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white shadow rounded-lg p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;