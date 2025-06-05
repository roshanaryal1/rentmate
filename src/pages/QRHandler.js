// src/pages/QRHandler.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { qrCodeService } from '../services/qrCodeService';
import { useAuth } from '../contexts/AuthContext';

const QRHandler = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (qrId) {
      processQRCode();
    }
  }, [qrId]);

  const processQRCode = async () => {
    try {
      setLoading(true);
      const data = await qrCodeService.processScannedQR(qrId);
      setQrData(data);
      
      // Update usage statistics
      await qrCodeService.updateQRUsage(qrId, 'scanned');
      
      // Handle different QR types
      handleQRAction(data);
    } catch (error) {
      console.error('Error processing QR code:', error);
      setError(error.message || 'Invalid or expired QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleQRAction = (data) => {
    switch (data.type) {
      case 'equipment':
        handleEquipmentQR(data);
        break;
      case 'rental':
        handleRentalQR(data);
        break;
      case 'admin_invite':
        handleAdminInvite(data);
        break;
      case 'feedback':
        handleFeedbackQR(data);
        break;
      default:
        setError('Unknown QR code type');
    }
  };

  const handleEquipmentQR = (data) => {
    // Redirect to equipment details with QR context
    navigate(`/equipment/${data.equipmentId}?from=qr&qrId=${qrId}`);
  };

  const handleRentalQR = (data) => {
    if (!currentUser) {
      localStorage.setItem('pendingQRAction', JSON.stringify(data));
      navigate('/login');
      return;
    }

    // Handle rental check-in/out
    if (data.action === 'checkin' || data.action === 'checkout') {
      navigate(`/rental/${data.rentalId}/${data.action}?qrId=${qrId}`);
    }
  };

  const handleAdminInvite = (data) => {
    if (currentUser) {
      // User is already logged in, show invite acceptance
      navigate(`/admin-invite/${data.inviteCode}?qrId=${qrId}`);
    } else {
      // Redirect to signup with admin invite context
      localStorage.setItem('adminInvite', JSON.stringify(data));
      navigate('/signup?type=admin');
    }
  };

  const handleFeedbackQR = (data) => {
    if (!currentUser) {
      localStorage.setItem('pendingQRAction', JSON.stringify(data));
      navigate('/login');
      return;
    }
    
    navigate(`/feedback/${data.rentalId}?qrId=${qrId}&rewards=${data.rewardPoints}`);
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Processing QR Code...</h5>
          <p className="text-muted">Please wait while we process your request</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-exclamation-triangle display-1 text-warning mb-3"></i>
                  <h4 className="mb-3">QR Code Error</h4>
                  <p className="text-muted mb-4">{error}</p>
                  <div className="d-flex gap-2 justify-content-center">
                    <button 
                      onClick={() => navigate('/')}
                      className="btn btn-primary"
                    >
                      Go Home
                    </button>
                    <button 
                      onClick={() => window.location.reload()}
                      className="btn btn-outline-secondary"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This should rarely be shown as we redirect in handleQRAction
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <i className="bi bi-qr-code display-1 text-success mb-3"></i>
        <h5>QR Code Processed Successfully</h5>
        <p className="text-muted">Redirecting you now...</p>
      </div>
    </div>
  );
};

export default QRHandler;

// src/components/QRCode/QRDashboardIntegration.js
import React from 'react';
import { AdminQRFeatures } from './AdminQRFeatures';
import { OwnerQRFeatures } from './OwnerQRFeatures';
import { RenterQRFeatures } from './RenterQRFeatures';
import { useAuth } from '../../contexts/AuthContext';

export const QRDashboardIntegration = ({ dashboardType }) => {
  const { userRole } = useAuth();

  // Determine which QR features to show
  const getQRComponent = () => {
    switch (dashboardType || userRole) {
      case 'admin':
        return <AdminQRFeatures />;
      case 'owner':
        return <OwnerQRFeatures />;
      case 'renter':
      default:
        return <RenterQRFeatures />;
    }
  };

  return (
    <div className="qr-dashboard-integration">
      {getQRComponent()}
    </div>
  );
};

// Example integration into AdminDashboard.jsx - ADD THIS TO YOUR EXISTING ADMIN DASHBOARD
/*
// In your AdminDashboard.jsx, add this to the tab content:

{activeTab === 'QR Tools' && (
  <div>
    <AdminQRFeatures />
  </div>
)}

// And add 'QR Tools' to your navItems array:
const navItems = [
  { label: 'Dashboard', icon: <HouseDoor /> },
  { label: 'Equipment', icon: <Tools /> },
  { label: 'Users', icon: <People /> },
  { label: 'Rentals', icon: <FileEarmark /> },
  { label: 'Dispute Center', icon: <Flag /> },
  { label: 'Review Moderation', icon: <StarFill /> },
  { label: 'QR Tools', icon: <QrCode /> }, // Add this line
  { label: 'Analytics', icon: <GraphUp /> },
  { label: 'Settings', icon: <Gear /> }
];
*/

// Example integration into OwnerDashboard.jsx - ADD THIS TO YOUR EXISTING OWNER DASHBOARD
/*
// Add QR section to your owner dashboard:

<div className="row mb-4">
  <div className="col">
    <div className="card border-0 shadow-sm">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-qr-code me-2"></i>
          QR Code Management
        </h5>
      </div>
      <div className="card-body">
        <OwnerQRFeatures />
      </div>
    </div>
  </div>
</div>
*/

// Example integration into RenterDashboard.js - ADD THIS TO YOUR EXISTING RENTER DASHBOARD
/*
// Add QR tab to your existing tab navigation:

{activeTab === 'qr-tools' && (
  <div>
    <RenterQRFeatures />
  </div>
)}

// And update your tab navigation to include:
<button 
  className={`nav-link py-3 border-0 fw-semibold ${activeTab === 'qr-tools' ? 'active' : ''}`}
  onClick={() => setActiveTab('qr-tools')}
>
  <i className="bi bi-qr-code-scan me-2"></i>
  QR Tools
</button>
*/

// src/components/QRCode/QuickQRActions.js - Floating QR button for mobile
import React, { useState } from 'react';
import { EnhancedQRScanner } from './EnhancedQRGenerator';
import { useAuth } from '../../contexts/AuthContext';

export const QuickQRActions = () => {
  const [showScanner, setShowScanner] = useState(false);
  const { currentUser } = useAuth();

  const handleScanSuccess = (decodedText) => {
    // Process the scanned QR code
    if (decodedText.includes('/qr/')) {
      // Direct URL to QR handler
      window.location.href = decodedText;
    } else {
      // Try to extract QR ID and redirect
      try {
        const qrData = JSON.parse(decodedText);
        // Handle different QR types
        console.log('Scanned QR data:', qrData);
        alert('QR Code scanned successfully!');
      } catch (error) {
        alert('Invalid QR code format');
      }
    }
    setShowScanner(false);
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Floating QR Scanner Button */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1050 }}>
        <button
          onClick={() => setShowScanner(true)}
          className="btn btn-primary rounded-circle shadow-lg"
          style={{ width: '56px', height: '56px' }}
          title="Scan QR Code"
        >
          <i className="bi bi-qr-code-scan fs-5"></i>
        </button>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-qr-code-scan me-2"></i>
                  Quick QR Scanner
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowScanner(false)}
                ></button>
              </div>
              <div className="modal-body">
                <EnhancedQRScanner
                  onScanSuccess={handleScanSuccess}
                  title="Scan Any QR Code"
                  instructions="Point your camera at any RentMate QR code"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};