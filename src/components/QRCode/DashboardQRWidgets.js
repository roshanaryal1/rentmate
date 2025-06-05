// src/components/QRCode/DashboardQRWidgets.js
import React, { useState } from 'react';
import { EnhancedQRScanner } from './EnhancedQRScanner';
import { QRCodeModal } from './QRCodeModal';
import { useAuth } from '../../contexts/AuthContext';

// 1. Quick QR Scanner Widget (for all dashboards)
export const QuickQRScannerWidget = () => {
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = (decodedText) => {
    console.log('QR Scanned:', decodedText);
    setShowScanner(false);
    
    // Handle scan results
    if (decodedText.includes('/equipment/')) {
      const equipmentId = decodedText.split('/equipment/')[1];
      window.location.href = `/equipment/${equipmentId}`;
    } else if (decodedText.includes('/rental/')) {
      alert('Rental QR detected - processing...');
    } else {
      alert(`QR Content: ${decodedText}`);
    }
  };

  return (
    <div className="card">
      <div className="card-body text-center">
        <i className="bi bi-qr-code-scan display-4 text-primary mb-3"></i>
        <h5 className="card-title">Quick QR Scanner</h5>
        <p className="card-text text-muted">
          Scan equipment QR codes for instant access
        </p>
        <button
          onClick={() => setShowScanner(true)}
          className="btn btn-primary"
        >
          <i className="bi bi-camera me-2"></i>
          Open Scanner
        </button>

        {/* Scanner Modal */}
        {showScanner && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">QR Scanner</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowScanner(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <EnhancedQRScanner
                    onScanSuccess={handleScanSuccess}
                    onScanError={(error) => console.error('Scan error:', error)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Owner QR Management Widget (for Owner Dashboard)
export const OwnerQRWidget = () => {
  const [showAuthQR, setShowAuthQR] = useState(false);
  const { currentUser } = useAuth();

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="mb-0">
          <i className="bi bi-qr-code me-2"></i>
          QR Code Tools
        </h6>
      </div>
      <div className="card-body">
        <div className="row g-2">
          <div className="col-6">
            <button
              onClick={() => setShowAuthQR(true)}
              className="btn btn-outline-primary btn-sm w-100"
            >
              <i className="bi bi-person-badge d-block mb-1"></i>
              <small>Owner ID</small>
            </button>
          </div>
          <div className="col-6">
            <button
              onClick={() => window.location.href = '/qr-tools'}
              className="btn btn-outline-secondary btn-sm w-100"
            >
              <i className="bi bi-tools d-block mb-1"></i>
              <small>All Tools</small>
            </button>
          </div>
        </div>
        
        <div className="mt-2">
          <small className="text-muted">
            <i className="bi bi-lightbulb me-1"></i>
            Tip: QR codes appear on your equipment cards
          </small>
        </div>
      </div>

      {/* Owner Auth QR Modal */}
      <QRCodeModal
        isOpen={showAuthQR}
        onClose={() => setShowAuthQR(false)}
        qrValue={JSON.stringify({
          type: 'owner_auth',
          ownerId: currentUser?.uid,
          name: currentUser?.displayName,
          timestamp: Date.now()
        })}
        title="Owner Authentication"
        subtitle="Verify your identity"
        instructions={[
          "Show to renters during handover",
          "Proves you are the verified owner",
          "Scan with RentMate app",
          "Valid for current session"
        ]}
      />
    </div>
  );
};

// 3. Renter QR Widget (for Renter Dashboard)
export const RenterQRWidget = ({ activeRentals = [] }) => {
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    
    if (decodedText.includes('/equipment/')) {
      const equipmentId = decodedText.split('/equipment/')[1];
      window.location.href = `/equipment/${equipmentId}`;
    } else {
      alert(`QR Scanned: ${decodedText}`);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="mb-0">
          <i className="bi bi-qr-code-scan me-2"></i>
          QR Actions
        </h6>
      </div>
      <div className="card-body">
        <div className="d-grid gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="btn btn-primary btn-sm"
          >
            <i className="bi bi-camera me-2"></i>
            Scan Equipment QR
          </button>
          
          {activeRentals.length > 0 && (
            <button
              onClick={() => window.location.href = '/qr-tools?tab=features'}
              className="btn btn-outline-success btn-sm"
            >
              <i className="bi bi-list-check me-2"></i>
              Rental QR Codes ({activeRentals.length})
            </button>
          )}
        </div>
        
        <small className="text-muted d-block mt-2">
          <i className="bi bi-info-circle me-1"></i>
          Scan QR codes on equipment for instant details
        </small>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Scan Equipment QR</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowScanner(false)}
                ></button>
              </div>
              <div className="modal-body">
                <EnhancedQRScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={(error) => console.error('Scan error:', error)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Admin QR Widget (for Admin Dashboard)
export const AdminQRWidget = () => {
  const [showInviteQR, setShowInviteQR] = useState(false);
  const { currentUser } = useAuth();

  const generateInviteQR = () => {
    setShowInviteQR(true);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="mb-0">
          <i className="bi bi-shield-check me-2"></i>
          Admin QR Tools
        </h6>
      </div>
      <div className="card-body">
        <div className="row g-2">
          <div className="col-6">
            <button
              onClick={generateInviteQR}
              className="btn btn-outline-primary btn-sm w-100"
            >
              <i className="bi bi-person-plus d-block mb-1"></i>
              <small>Invite Admin</small>
            </button>
          </div>
          <div className="col-6">
            <button
              onClick={() => window.location.href = '/qr-tools'}
              className="btn btn-outline-secondary btn-sm w-100"
            >
              <i className="bi bi-tools d-block mb-1"></i>
              <small>All Tools</small>
            </button>
          </div>
        </div>
        
        <div className="mt-2">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Manage QR codes for system administration
          </small>
        </div>
      </div>

      {/* Admin Invite QR Modal */}
      <QRCodeModal
        isOpen={showInviteQR}
        onClose={() => setShowInviteQR(false)}
        qrValue={`${window.location.origin}/signup?type=admin&invite=${Math.random().toString(36).substring(2, 15)}`}
        title="Admin Invitation QR"
        subtitle="Invite new administrator"
        instructions={[
          "Share this QR with the new admin",
          "They scan to create admin account",
          "Invitation expires in 7 days",
          "Monitor usage in admin panel"
        ]}
      />
    </div>
  );
};

// 5. Floating QR Action Button (for any page)
export const FloatingQRButton = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    setShowMenu(false);
    // Handle scan result
    console.log('QR Scanned:', decodedText);
    if (decodedText.includes('/equipment/')) {
      const equipmentId = decodedText.split('/equipment/')[1];
      window.location.href = `/equipment/${equipmentId}`;
    } else {
      alert(`QR Scanned: ${decodedText}`);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div 
        className="position-fixed" 
        style={{ 
          bottom: '20px', 
          right: '20px', 
          zIndex: 1000 
        }}
      >
        {showMenu && (
          <div className="mb-2">
            <div className="d-grid gap-2">
              <button
                onClick={() => setShowScanner(true)}
                className="btn btn-primary btn-sm shadow"
              >
                <i className="bi bi-qr-code-scan me-2"></i>
                Scan QR
              </button>
              <button
                onClick={() => window.location.href = '/qr-tools'}
                className="btn btn-outline-primary btn-sm shadow"
              >
                <i className="bi bi-tools me-2"></i>
                QR Tools
              </button>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="btn btn-primary rounded-circle shadow"
          style={{ width: '56px', height: '56px' }}
        >
          <i className={`bi ${showMenu ? 'bi-x' : 'bi-qr-code'} fs-5`}></i>
        </button>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Quick QR Scanner</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowScanner(false)}
                ></button>
              </div>
              <div className="modal-body">
                <EnhancedQRScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={(error) => console.error('Scan error:', error)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};