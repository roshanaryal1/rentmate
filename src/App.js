import { Link } from 'react-router-dom';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RoleRoute } from './components/RoleRoute';

import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Auth Pages
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';

// Dashboard
import AdminDashboard from './components/Dashboard/AdminDashboard';
import OwnerDashboard from './components/Dashboard/OwnerDashboard';
import RenterDashboard from './components/Dashboard/RenterDashboard';

// Equipment
import AddEquipment from './components/Dashboard/AddEquipment';
import EquipmentDetail from './components/Equipment/EquipmentDetail';
import RentEquipment from './components/Equipment/RentEquipment';

// Rental
import RentalHistory from './components/Rental/RentalHistory';
import PaymentPage from './components/Dashboard/PaymentPage';

// Admin Tools
import PopulateFirebase from './components/admin/PopulateFirebase';

// Common
import ErrorBoundary from './components/ErrorBoundary';
import AuthDebug from './components/AuthDebug';

// QR Code Tools Page
import QRCodePage from './pages/QRCodePage';

// CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './components/common/Header.css';
import './components/common/Footer.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App d-flex flex-column min-vh-100">
            <Header />

            {process.env.NODE_ENV === 'development' && <AuthDebug />}

            <main className="main-content flex-grow-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<RenterDashboard />} />
                <Route path="/browse" element={<RenterDashboard />} />
                <Route path="/equipment/:id" element={<EquipmentDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* QR Code Tools Route */}
                <Route path="/qr-tools" element={<QRCodePage />} />

                {/* Equipment rental */}
                <Route 
                  path="/rent/:equipmentId" 
                  element={
                    <RoleRoute allowedRoles={['admin', 'owner', 'renter']}>
                      <RentEquipment />
                    </RoleRoute>
                  } 
                />
                {/* Payment */}
                <Route 
                  path="/payment/:equipmentId" 
                  element={
                    <RoleRoute allowedRoles={['admin', 'owner', 'renter']}>
                      <PaymentPage />
                    </RoleRoute>
                  } 
                />

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

                {/* Admin Only */}
                <Route 
                  path="/admin-dashboard" 
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/admin-users" 
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <AdminUsersPage />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/admin-reports" 
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <AdminReportsPage />
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

                {/* Owner Only */}
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
                  path="/my-equipment" 
                  element={
                    <RoleRoute allowedRoles={['owner']}>
                      <MyEquipmentPage />
                    </RoleRoute>
                  } 
                />
                <Route 
                  path="/owner-rentals" 
                  element={
                    <RoleRoute allowedRoles={['owner']}>
                      <OwnerRentalsPage />
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

                {/* Renter Only */}
                <Route 
                  path="/renter-dashboard" 
                  element={
                    <RoleRoute allowedRoles={['renter']}>
                      <RenterDashboard />
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

                {/* Shared (Owner + Renter) */}
                <Route 
                  path="/notifications" 
                  element={
                    <RoleRoute allowedRoles={['owner', 'renter']}>
                      <NotificationsPage />
                    </RoleRoute>
                  } 
                />

                {/* Static/Public */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/safety" element={<SafetyPage />} />
                <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />

                {/* Legal */}
                <Route path="/terms-of-service" element={<TermsPage />} />
                <Route path="/privacy-policy" element={<PrivacyPage />} />
                <Route path="/cookie-policy" element={<CookiePolicyPage />} />
                <Route path="/accessibility" element={<AccessibilityPage />} />

                {/* Legacy redirect */}
                <Route path="/terms" element={<Navigate to="/terms-of-service" replace />} />
                <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />

                {/* Error */}
                <Route path="/not-authorized" element={<NotAuthorizedPage />} />
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Placeholder pages
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

// Admin
const AdminUsersPage = () => (
  <div className="container py-5">
    <h2>User Management</h2>
    <p>Manage platform users and their roles.</p>
  </div>
);

const AdminReportsPage = () => (
  <div className="container py-5">
    <h2>Reports & Analytics</h2>
    <p>Platform-wide analytics and reporting.</p>
  </div>
);

// Owner
const MyEquipmentPage = () => (
  <div className="container py-5">
    <h2>My Equipment</h2>
    <p>Manage your equipment listings.</p>
  </div>
);

const OwnerRentalsPage = () => (
  <div className="container py-5">
    <h2>Rental Management</h2>
    <p>Track and manage your equipment rentals.</p>
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

// Renter
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

// Shared
const NotificationsPage = () => (
  <div className="container py-5">
    <h2>Notifications</h2>
    <p>Your recent notifications and messages.</p>
  </div>
);

// Public
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

const CategoriesPage = () => (
  <div className="container py-5">
    <h2>Equipment Categories</h2>
    <p>Browse equipment by category.</p>
  </div>
);

const ContactPage = () => (
  <div className="container py-5">
    <h2>Contact Us</h2>
    <p>Get in touch with our support team.</p>
  </div>
);

const FAQPage = () => (
  <div className="container py-5">
    <h2>Frequently Asked Questions</h2>
    <p>Find answers to common questions.</p>
  </div>
);

const SafetyPage = () => (
  <div className="container py-5">
    <h2>Safety Guidelines</h2>
    <p>Important safety information for equipment rental.</p>
  </div>
);

const CommunityGuidelinesPage = () => (
  <div className="container py-5">
    <h2>Community Guidelines</h2>
    <p>Rules and guidelines for our community.</p>
  </div>
);

// Legal
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

const CookiePolicyPage = () => (
  <div className="container py-5">
    <h2>Cookie Policy</h2>
    <p>Information about how we use cookies.</p>
  </div>
);

const AccessibilityPage = () => (
  <div className="container py-5">
    <h2>Accessibility</h2>
    <p>Our commitment to accessibility and inclusive design.</p>
  </div>
);

// Error
const NotAuthorizedPage = () => (
  <div className="container py-5 text-center">
    <h2>Access Denied</h2>
    <p>You don't have permission to view this page.</p>
    <Link to="/" className="btn btn-primary">Go Home</Link>
  </div>
);

const NotFoundPage = () => (
  <div className="container py-5 text-center">
    <h2>Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <Link to="/" className="btn btn-primary">Go Home</Link>
  </div>
);

export default App;
