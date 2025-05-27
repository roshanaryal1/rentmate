import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import AuthDebug from './components/AuthDebug';
import PaymentPage from './components/Dashboard/PaymentPage';


// Lazy load components for better performance
const Signup = React.lazy(() => import('./components/auth/Signup'));
const Login = React.lazy(() => import('./components/auth/Login'));
const ForgotPassword = React.lazy(() => import('./components/auth/ForgotPassword'));
const RenterDashboard = React.lazy(() => import('./components/Dashboard/RenterDashboard'));
const OwnerDashboard = React.lazy(() => import('./components/Dashboard/OwnerDashboard'));
const AdminDashboard = React.lazy(() => import('./components/Dashboard/AdminDashboard'));
const AddEquipment = React.lazy(() => import('./components/Dashboard/AddEquipment'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <AuthDebug />
        <Suspense fallback={<LoadingSpinner message="Loading RentMate..." />}>
          <AppContent />
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { currentUser, userRole, loading, authChecked } = useAuth();

  console.log('🎯 AppContent render:', { 
    currentUser: currentUser?.email, 
    userRole, 
    loading, 
    authChecked,
    timestamp: new Date().toISOString()
  });

  // Show loading while checking authentication
  if (!authChecked || loading) {
    return <LoadingSpinner 
      message={
        !authChecked ? "Checking authentication..." : 
        loading ? "Loading user data..." : 
        "Loading..."
      } 
    />;
  }

  return (
    <Routes>
      {/* Root route - redirect based on auth status */}
      <Route path="/" element={
        currentUser ? (
          <RoleBasedRedirect currentUser={currentUser} userRole={userRole} />
        ) : (
          <Navigate to="/login" />
        )
      } />
      
      {/* Authentication routes - redirect if already logged in */}
      <Route path="/login" element={
        currentUser ? (
          <RoleBasedRedirect currentUser={currentUser} userRole={userRole} />
        ) : (
          <Login />
        )
      } />
      
      <Route path="/signup" element={
        currentUser ? (
          <RoleBasedRedirect currentUser={currentUser} userRole={userRole} />
        ) : (
          <Signup />
        )
      } />
      
      <Route path="/register" element={<Navigate to="/signup" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Role-specific dashboard routes */}
      <Route 
        path="/renter-dashboard" 
        element={
          <ProtectedRoute role="renter" currentUser={currentUser} userRole={userRole}>
            <DashboardLayout title="Renter Dashboard">
              <RenterDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/owner-dashboard" 
        element={
          <ProtectedRoute role="owner" currentUser={currentUser} userRole={userRole}>
            <DashboardLayout title="Equipment Owner Dashboard">
              <OwnerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin-dashboard" 
        element={
          <ProtectedRoute role="admin" currentUser={currentUser} userRole={userRole}>
            <DashboardLayout title="Admin Dashboard">
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Owner-specific routes */}
      <Route 
        path="/add-equipment" 
        element={
          <ProtectedRoute role="owner" currentUser={currentUser} userRole={userRole}>
            <DashboardLayout title="Add Equipment">
              <AddEquipment />
            </DashboardLayout>
          </ProtectedRoute>
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

<Route path="/payment/:equipmentId" element={<PaymentPage />} />


// Helper component for role-based redirects
function RoleBasedRedirect({ currentUser, userRole }) {
  console.log('🚀 RoleBasedRedirect:', { 
    currentUser: currentUser?.email, 
    userRole,
    timestamp: new Date().toISOString()
  });
  
  if (!currentUser) {
    console.log('❌ No current user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Wait for userRole to be loaded
  if (!userRole) {
    console.log('⏳ Waiting for user role...');
    return <LoadingSpinner message="Loading user data..." />;
  }

  let redirectPath;
  switch (userRole) {
    case 'admin':
      redirectPath = '/admin-dashboard';
      break;
    case 'owner':
      redirectPath = '/owner-dashboard';
      break;
    case 'renter':
    default:
      redirectPath = '/renter-dashboard';
      break;
  }

  console.log(`🎯 Redirecting to: ${redirectPath}`);
  return <Navigate to={redirectPath} replace />;
}

// Helper component for protected routes
function ProtectedRoute({ role, currentUser, userRole, children }) {
  console.log('🔐 ProtectedRoute check:', { 
    requiredRole: role, 
    currentUser: currentUser?.email, 
    userRole,
    hasAccess: currentUser && (userRole === role || userRole === 'admin'),
    timestamp: new Date().toISOString()
  });

  if (!currentUser) {
    console.log('❌ No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Wait for userRole to be loaded
  if (!userRole) {
    console.log('⏳ Waiting for user role in protected route...');
    return <LoadingSpinner message="Loading user data..." />;
  }

  // Admin can access everything
  if (userRole === 'admin') {
    console.log('✅ Admin access granted');
    return children;
  }

  // Check if user has the required role
  if (userRole === role) {
    console.log('✅ Role access granted');
    return children;
  }

  // Redirect to appropriate dashboard if user doesn't have access
  console.log('❌ Access denied, redirecting to appropriate dashboard');
  return <RoleBasedRedirect currentUser={currentUser} userRole={userRole} />;
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
                      {currentUser?.displayName || currentUser?.email}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      userRole === 'admin' ? 'bg-red-100 text-red-800' :
                      userRole === 'owner' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {userRole === 'renter' ? 'Renter' : 
                       userRole === 'owner' ? 'Equipment Owner' : 
                       userRole === 'admin' ? 'Admin' : 'Unknown'}
                    </span>
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
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