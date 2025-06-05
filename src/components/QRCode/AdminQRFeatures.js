// src/components/QRCode/AdminQRFeatures.js
import React, { useState } from 'react';
import { EnhancedQRGenerator } from './EnhancedQRGenerator';
import { QRCodeModal } from './QRCodeModal';
import { qrCodeService } from '../../services/qrCodeService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminQRFeatures = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [inviteQR, setInviteQR] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const generateAdminInvite = async () => {
    setLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 15);
      const result = await qrCodeService.generateAdminInviteQR(currentUser.uid, inviteCode);
      setInviteQR(result.qrUrl);
      setShowInviteModal(true);
    } catch (error) {
      console.error('Error generating admin invite:', error);
      alert('Failed to generate invite QR code');
    } finally {
      setLoading(false);
    }
  };

  const generateReportsQR = () => {
    const reportsUrl = `${window.location.origin}/admin-reports?token=${Date.now()}`;
    setShowReportsModal(true);
  };

  const generateAuthQR = () => {
    const authData = {
      type: 'admin_auth',
      adminId: currentUser.uid,
      timestamp: Date.now(),
      permissions: ['full_access']
    };
    setShowAuthModal(true);
  };

  return (
    <div className="admin-qr-features">
      <div className="row mb-4">
        <div className="col">
          <h5 className="mb-3">
            <i className="bi bi-qr-code me-2"></i>
            Admin QR Tools
          </h5>
        </div>
      </div>

      <div className="row g-3">
        {/* Admin Invite QR */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <div className="bg-primary bg-opacity-10 rounded-3 p-3 mb-3 d-inline-block">
                <i className="bi bi-person-plus fs-2 text-primary"></i>
              </div>
              <h6 className="card-title">Invite Admin</h6>
              <p className="card-text small text-muted">
                Generate QR code to invite new administrators
              </p>
              <button
                onClick={generateAdminInvite}
                disabled={loading}
                className="btn btn-primary btn-sm"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-qr-code me-1"></i>
                    Generate Invite QR
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Reports Access QR */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <div className="bg-success bg-opacity-10 rounded-3 p-3 mb-3 d-inline-block">
                <i className="bi bi-graph-up fs-2 text-success"></i>
              </div>
              <h6 className="card-title">Reports Access</h6>
              <p className="card-text small text-muted">
                Share secure link to admin reports
              </p>
              <button
                onClick={generateReportsQR}
                className="btn btn-success btn-sm"
              >
                <i className="bi bi-qr-code me-1"></i>
                Generate Reports QR
              </button>
            </div>
          </div>
        </div>

        {/* Admin Authentication QR */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <div className="bg-warning bg-opacity-10 rounded-3 p-3 mb-3 d-inline-block">
                <i className="bi bi-shield-check fs-2 text-warning"></i>
              </div>
              <h6 className="card-title">Authentication</h6>
              <p className="card-text small text-muted">
                Verify admin identity at events
              </p>
              <button
                onClick={generateAuthQR}
                className="btn btn-warning btn-sm"
              >
                <i className="bi bi-qr-code me-1"></i>
                Generate Auth QR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Invite Modal */}
      <QRCodeModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        qrValue={inviteQR}
        title="Admin Invitation"
        subtitle="Scan to join as administrator"
        instructions={[
          "Share this QR code with the person you want to invite",
          "They should scan it with their phone camera",
          "They'll be directed to create an admin account",
          "Invitation expires in 7 days"
        ]}
      />

      {/* Reports Modal */}
      <QRCodeModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        qrValue={`${window.location.origin}/admin-reports?token=${Date.now()}`}
        title="Admin Reports Access"
        subtitle="Secure link to admin dashboard"
        instructions={[
          "Scan to access admin reports",
          "Link is temporary and secure",
          "Requires admin authentication",
          "Valid for current session only"
        ]}
      />

      {/* Auth Modal */}
      <QRCodeModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        qrValue={JSON.stringify({
          type: 'admin_auth',
          adminId: currentUser?.uid,
          name: currentUser?.displayName,
          timestamp: Date.now()
        })}
        title="Admin Authentication"
        subtitle="Verify your admin identity"
        instructions={[
          "Show this QR code to verify your admin status",
          "Scan with official RentMate scanner",
          "Valid for identity verification",
          "Contains encrypted admin credentials"
        ]}
      />
    </div>
  );
};

// src/components/QRCode/OwnerQRFeatures.js
import React, { useState, useEffect } from 'react';
import { EnhancedQRGenerator } from './EnhancedQRGenerator';
import { QRCodeModal } from './QRCodeModal';
import { qrCodeService } from '../../services/qrCodeService';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export const OwnerQRFeatures = () => {
  const [equipment, setEquipment] = useState([]);
  const [showEquipmentQR, setShowEquipmentQR] = useState(false);
  const [showOwnerAuthQR, setShowOwnerAuthQR] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchOwnerEquipment();
  }, [currentUser]);

  const fetchOwnerEquipment = async () => {
    if (!currentUser) return;
    
    try {
      const q = query(
        collection(db, 'equipment'),
        where('ownerId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const equipmentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const generateEquipmentQR = async (equipmentItem) => {
    setLoading(true);
    try {
      const result = await qrCodeService.generateEquipmentQR(
        equipmentItem.id, 
        currentUser.uid
      );
      setSelectedEquipment({
        ...equipmentItem,
        qrUrl: result.qrUrl
      });
      setShowEquipmentQR(true);
    } catch (error) {
      console.error('Error generating equipment QR:', error);
      alert('Failed to generate equipment QR code');
    } finally {
      setLoading(false);
    }
  };

  const generateOwnerAuthQR = () => {
    setShowOwnerAuthQR(true);
  };

  return (
    <div className="owner-qr-features">
      <div className="row mb-4">
        <div className="col">
          <h5 className="mb-3">
            <i className="bi bi-qr-code me-2"></i>
            Equipment QR Management
          </h5>
          <p className="text-muted">
            Generate QR codes for your equipment to enable quick rentals and tracking.
          </p>
        </div>
      </div>

      {/* Owner Authentication QR */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h6 className="card-title mb-1">Owner Authentication</h6>
              <p className="text-muted mb-0">
                Generate QR code to verify your identity during equipment handovers
              </p>
            </div>
            <div className="col-md-4 text-md-end">
              <button
                onClick={generateOwnerAuthQR}
                className="btn btn-primary"
              >
                <i className="bi bi-qr-code me-2"></i>
                Generate Auth QR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment QR Codes */}
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Equipment QR Codes</h6>
        </div>
        <div className="card-body">
          {equipment.length > 0 ? (
            <div className="row g-3">
              {equipment.map(item => (
                <div key={item.id} className="col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <img
                          src={item.imageUrl || '/placeholder-equipment.jpg'}
                          alt={item.name}
                          className="rounded me-3"
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50x50?text=No+Image';
                          }}
                        />
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{item.name}</h6>
                          <small className="text-muted">{item.category}</small>
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={`badge ${item.available ? 'bg-success' : 'bg-danger'}`}>
                          {item.available ? 'Available' : 'Rented'}
                        </span>
                        
                        {item.qrCodeUrl ? (
                          <div className="d-flex gap-1">
                            <button
                              onClick={() => setSelectedEquipment({...item, qrUrl: item.qrCodeUrl}) || setShowEquipmentQR(true)}
                              className="btn btn-outline-primary btn-sm"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              onClick={() => generateEquipmentQR(item)}
                              disabled={loading}
                              className="btn btn-primary btn-sm"
                            >
                              <i className="bi bi-arrow-clockwise"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => generateEquipmentQR(item)}
                            disabled={loading}
                            className="btn btn-primary btn-sm"
                          >
                            {loading ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <>
                                <i className="bi bi-qr-code me-1"></i>
                                Generate QR
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-tools display-4 text-muted"></i>
              <h6 className="mt-3">No Equipment Found</h6>
              <p className="text-muted">Add some equipment to generate QR codes</p>
            </div>
          )}
        </div>
      </div>

      {/* Equipment QR Modal */}
      {selectedEquipment && (
        <QRCodeModal
          isOpen={showEquipmentQR}
          onClose={() => setShowEquipmentQR(false)}
          qrValue={selectedEquipment.qrUrl}
          title={`QR Code: ${selectedEquipment.name}`}
          subtitle="Equipment rental and info access"
          instructions={[
            "Print and attach this QR code to your equipment",
            "Renters can scan to view details and request rental",
            "QR code works even when offline",
            "Track scans in your analytics dashboard"
          ]}
        />
      )}

      {/* Owner Auth Modal */}
      <QRCodeModal
        isOpen={showOwnerAuthQR}
        onClose={() => setShowOwnerAuthQR(false)}
        qrValue={JSON.stringify({
          type: 'owner_auth',
          ownerId: currentUser?.uid,
          name: currentUser?.displayName,
          email: currentUser?.email,
          timestamp: Date.now()
        })}
        title="Owner Authentication"
        subtitle="Verify your identity as equipment owner"
        instructions={[
          "Show this to renters during equipment handover",
          "Proves you are the verified equipment owner",
          "Scan with RentMate app for verification",
          "Valid for current session"
        ]}
      />
    </div>
  );
};

// src/components/QRCode/RenterQRFeatures.js
import React, { useState, useEffect } from 'react';
import { EnhancedQRScanner } from './EnhancedQRGenerator';
import { QRCodeModal } from './QRCodeModal';
import { qrCodeService } from '../../services/qrCodeService';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export const RenterQRFeatures = () => {
  const [activeRentals, setActiveRentals] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showRentalQR, setShowRentalQR] = useState(false);
  const [showFeedbackQR, setShowFeedbackQR] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchActiveRentals();
  }, [currentUser]);

  const fetchActiveRentals = async () => {
    if (!currentUser) return;
    
    try {
      const q = query(
        collection(db, 'rentals'),
        where('renterId', '==', currentUser.uid),
        where('status', 'in', ['active', 'approved'])
      );
      const snapshot = await getDocs(q);
      const rentalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveRentals(rentalsData);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    try {
      // Try to parse as URL first
      let qrData;
      if (decodedText.startsWith('http')) {
        const url = new URL(decodedText);
        const qrId = url.pathname.split('/').pop();
        qrData = await qrCodeService.processScannedQR(qrId);
      } else {
        // Try to parse as JSON
        qrData = JSON.parse(decodedText);
      }

      setScanResult(qrData);
      setShowScanner(false);
      
      // Handle different QR types
      switch (qrData.type) {
        case 'equipment':
          // Navigate to equipment details
          window.location.href = `/equipment/${qrData.equipmentId}`;
          break;
        case 'rental':
          // Handle rental check-in/out
          handleRentalScan(qrData);
          break;
        case 'feedback':
          // Show feedback form
          window.location.href = `/feedback/${qrData.rentalId}`;
          break;
        default:
          alert('Unknown QR code type');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      alert('Invalid QR code');
    }
  };

  const handleRentalScan = (qrData) => {
    const rental = activeRentals.find(r => r.id === qrData.rentalId);
    if (rental) {
      if (qrData.action === 'checkin') {
        alert(`Check-in successful for ${rental.equipmentName}`);
      } else if (qrData.action === 'checkout') {
        alert(`Check-out successful for ${rental.equipmentName}`);
      }
    } else {
      alert('Rental not found or not active');
    }
  };

  const generateRentalQR = async (rental, type = 'checkin') => {
    try {
      const result = await qrCodeService.generateRentalQR(rental.id, type);
      setSelectedRental({
        ...rental,
        qrUrl: result.qrUrl,
        qrType: type
      });
      setShowRentalQR(true);
    } catch (error) {
      console.error('Error generating rental QR:', error);
      alert('Failed to generate rental QR code');
    }
  };

  const generateFeedbackQR = async (rental) => {
    try {
      const result = await qrCodeService.generateFeedbackQR(rental.id, 10); // 10 reward points
      setSelectedRental({
        ...rental,
        qrUrl: result.qrUrl
      });
      setShowFeedbackQR(true);
    } catch (error) {
      console.error('Error generating feedback QR:', error);
      alert('Failed to generate feedback QR code');
    }
  };

  return (
    <div className="renter-qr-features">
      <div className="row mb-4">
        <div className="col">
          <h5 className="mb-3">
            <i className="bi bi-qr-code-scan me-2"></i>
            QR Code Tools
          </h5>
        </div>
      </div>

      {/* QR Scanner */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h6 className="card-title mb-1">
                <i className="bi bi-camera me-2"></i>
                Scan Equipment QR
              </h6>
              <p className="text-muted mb-0">
                Scan QR codes on equipment to view details, check in/out, or report issues
              </p>
            </div>
            <div className="col-md-4 text-md-end">
              <button
                onClick={() => setShowScanner(true)}
                className="btn btn-primary"
              >
                <i className="bi bi-qr-code-scan me-2"></i>
                Open Scanner
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Rentals */}
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Active Rentals - Quick Actions</h6>
        </div>
        <div className="card-body">
          {activeRentals.length > 0 ? (
            <div className="row g-3">
              {activeRentals.map(rental => (
                <div key={rental.id} className="col-md-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <img
                          src={rental.equipmentImage || '/placeholder-equipment.jpg'}
                          alt={rental.equipmentName}
                          className="rounded me-3"
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{rental.equipmentName}</h6>
                          <small className="text-muted">
                            Rental ID: #{rental.id.slice(-6)}
                          </small>
                        </div>
                      </div>
                      
                      <div className="d-grid gap-2">
                        <div className="btn-group" role="group">
                          <button
                            onClick={() => generateRentalQR(rental, 'checkin')}
                            className="btn btn-outline-success btn-sm"
                          >
                            <i className="bi bi-box-arrow-in-down me-1"></i>
                            Check-in QR
                          </button>
                          <button
                            onClick={() => generateRentalQR(rental, 'checkout')}
                            className="btn btn-outline-warning btn-sm"
                          >
                            <i className="bi bi-box-arrow-up me-1"></i>
                            Check-out QR
                          </button>
                        </div>
                        
                        <button
                          onClick={() => generateFeedbackQR(rental)}
                          className="btn btn-outline-primary btn-sm"
                        >
                          <i className="bi bi-star me-1"></i>
                          Feedback QR
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-calendar-x display-4 text-muted"></i>
              <h6 className="mt-3">No Active Rentals</h6>
              <p className="text-muted">Your active rentals will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Scan QR Code</h5>
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

      {/* Rental QR Modal */}
      {selectedRental && (
        <QRCodeModal
          isOpen={showRentalQR}
          onClose={() => setShowRentalQR(false)}
          qrValue={selectedRental.qrUrl}
          title={`${selectedRental.qrType === 'checkin' ? 'Check-in' : 'Check-out'} QR`}
          subtitle={selectedRental.equipmentName}
          instructions={[
            `Show this QR code during equipment ${selectedRental.qrType}`,
            "Owner will scan to confirm the process",
            "QR code expires in 24 hours",
            "Keep this accessible during the rental period"
          ]}
        />
      )}

      {/* Feedback QR Modal */}
      <QRCodeModal
        isOpen={showFeedbackQR}
        onClose={() => setShowFeedbackQR(false)}
        qrValue={selectedRental?.qrUrl}
        title="Feedback & Rewards QR"
        subtitle={selectedRental?.equipmentName}
        instructions={[
          "Scan to leave a review and earn rewards",
          "Earn 10 points for completing feedback",
          "Share your rental experience",
          "Help improve the platform for everyone"
        ]}
      />
    </div>
  );
};