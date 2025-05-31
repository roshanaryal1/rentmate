// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RoleRoute } from './components/RoleRoute';

// Import Header Component
import Header from './components/common/Header';

// Import Page Components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';

// Dashboard Components
import AdminDashboard from './components/Dashboard/AdminDashboard';
import OwnerDashboard from './components/Dashboard/OwnerDashboard';
import RenterDashboard from './components/Dashboard/RenterDashboard';

// Equipment Components
import AddEquipment from './components/Dashboard/AddEquipment';
import EquipmentDetail from './components/Equipment/EquipmentDetail';
import RentEquipment from './components/Equipment/RentEquipment';

// Rental Components
import RentalHistory from './components/Rental/RentalHistory';
import PaymentPage from './components/Dashboard/PaymentPage';

// Admin Tools
import PopulateFirebase from './components/admin/PopulateFirebase';

// Common Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Auth Debug (only in development)
import AuthDebug from './components/AuthDebug';

// Import CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './components/common/Header.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            {/* Header - shown on all pages */}
            <Header />
            
            {/* Auth Debug - only in development */}
            {process.env.NODE_ENV === 'development' && <AuthDebug />}
            
            {/* Main Content */}
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/equipment/:id" element={<EquipmentDetail />} />
                
                {/* Protected Routes - All Authenticated Users */}
                <Route 
                  path="/profile" 
                  element={
                    <RoleRoute allowedRoles={['admin', 'owner', 'renter']}>
                      <ProfilePage />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <RoleRoute allowedRoles={['admin', 'owner', 'renter']}>
                      <SettingsPage />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/help" 
                  element={
                    <RoleRoute allowedRoles={['admin', 'owner', 'renter']}>
                      <HelpPage />
                    </RoleRoute>
                  } 
                />

                {/* Admin Only Routes */}
                <Route 
                  path="/admin-dashboard" 
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/populate-firebase" 
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <PopulateFirebase />
                    </RoleRoute>
                  } 
                />

                {/* Owner Routes */}
                <Route 
                  path="/owner-dashboard" 
                  element={
                    <RoleRoute allowedRoles={['owner']}>
                      <OwnerDashboard />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/add-equipment" 
                  element={
                    <RoleRoute allowedRoles={['owner']}>
                      <AddEquipment />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/edit-equipment/:id" 
                  element={
                    <RoleRoute allowedRoles={['owner']}>
                      <EditEquipmentPage />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <RoleRoute allowedRoles={['owner']}>
                      <AnalyticsPage />
                    </RoleRoute>
                  } 
                />

                {/* Renter Routes */}
                <Route 
                  path="/renter-dashboard" 
                  element={
                    <RoleRoute allowedRoles={['renter']}>
                      <RenterDashboard />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/rent/:equipmentId" 
                  element={
                    <RoleRoute allowedRoles={['renter']}>
                      <RentEquipment />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/rental-history" 
                  element={
                    <RoleRoute allowedRoles={['renter']}>
                      <RentalHistory />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/rental-details/:id" 
                  element={
                    <RoleRoute allowedRoles={['renter']}>
                      <RentalDetailsPage />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/favorites" 
                  element={
                    <RoleRoute allowedRoles={['renter']}>
                      <FavoritesPage />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/payment/:equipmentId" 
                  element={
                    <RoleRoute allowedRoles={['renter']}>
                      <PaymentPage />
                    </RoleRoute>
                  } 
                />

                {/* Shared Routes (Owner + Renter) */}
                <Route 
                  path="/notifications" 
                  element={
                    <RoleRoute allowedRoles={['owner', 'renter']}>
                      <NotificationsPage />
                    </RoleRoute>
                  } 
                />

                {/* Static Pages */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Error Routes */}
                <Route path="/not-authorized" element={<NotAuthorizedPage />} />
                <Route path="/404" element={<NotFoundPage />} />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </main>

            {/* Footer (optional) */}
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Placeholder Components (you can replace these with actual components)
const LandingPage = () => (
  <div className="container py-5">
    <div className="row">
      <div className="col-lg-8 mx-auto text-center">
        <h1 className="display-4 fw-bold mb-4">
          Rent Equipment, <span className="text-primary">Made Simple</span>
        </h1>
        <p className="lead mb-4">
          Connect with equipment owners in your area and rent what you need, when you need it.
        </p>
        <div className="d-flex gap-3 justify-content-center">
          <a href="/signup" className="btn btn-primary btn-lg">
            Get Started
          </a>
          <a href="/how-it-works" className="btn btn-outline-primary btn-lg">
            How It Works
          </a>
        </div>
      </div>
    </div>
  </div>
);

const ProfilePage = () => (
  <div className="container py-5">
    <h2>My Profile</h2>
    <p>User profile settings and information.</p>
  </div>
);

const SettingsPage = () => (
  <div className="container py-5">
    <h2>Settings</h2>
    <p>Account settings and preferences.</p>
  </div>
);

const HelpPage = () => (
  <div className="container py-5">
    <h2>Help & Support</h2>
    <p>Frequently asked questions and contact information.</p>
  </div>
);

const EditEquipmentPage = () => (
  <div className="container py-5">
    <h2>Edit Equipment</h2>
    <p>Edit your equipment listing.</p>
  </div>
);

const AnalyticsPage = () => (
  <div className="container py-5">
    <h2>Analytics</h2>
    <p>View your equipment performance and earnings.</p>
  </div>
);

const RentalDetailsPage = () => (
  <div className="container py-5">
    <h2>Rental Details</h2>
    <p>Detailed information about a specific rental.</p>
  </div>
);

const FavoritesPage = () => (
  <div className="container py-5">
    <h2>My Favorites</h2>
    <p>Equipment you've saved for later.</p>
  </div>
);

const NotificationsPage = () => (
  <div className="container py-5">
    <h2>Notifications</h2>
    <p>Your recent notifications and messages.</p>
  </div>
);

const AboutPage = () => (
  <div className="container py-5">
    <h2>About RentMate</h2>
    <p>Learn more about our platform and mission.</p>
  </div>
);

const HowItWorksPage = () => (
  <div className="container py-5">
    <h2>How It Works</h2>
    <p>Step-by-step guide to using RentMate.</p>
  </div>
);

const TermsPage = () => (
  <div className="container py-5">
    <h2>Terms of Service</h2>
    <p>Our terms and conditions.</p>
  </div>
);

const PrivacyPage = () => (
  <div className="container py-5">
    <h2>Privacy Policy</h2>
    <p>How we handle your data and privacy.</p>
  </div>
);

const ContactPage = () => (
  <div className="container py-5">
    <h2>Contact Us</h2>
    <p>Get in touch with our support team.</p>
  </div>
);

const NotAuthorizedPage = () => (
  <div className="container py-5 text-center">
    <h2>Access Denied</h2>
    <p>You don't have permission to view this page.</p>
    <a href="/" className="btn btn-primary">Go Home</a>
  </div>
);

const NotFoundPage = () => (
  <div className="container py-5 text-center">
    <h2>Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/" className="btn btn-primary">Go Home</a>
  </div>
);

const Footer = () => (
  <footer className="bg-dark text-light py-4 mt-auto">
    <div className="container">
      <div className="row">
        <div className="col-md-6">
          <h5>RentMate</h5>
          <p>Equipment rental made simple.</p>
        </div>
        <div className="col-md-6 text-md-end">
          <p>&copy; 2024 RentMate. All rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>
);

export default App;