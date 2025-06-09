// src/components/QRCode/RenterQRFeatures.js
import React, { useState } from 'react';
import { EnhancedQRScanner } from './QRCodeScanner';
import { QRCodeModal } from './QRCodeModal';
import { useAuth } from '../../contexts/AuthContext';

export const RenterQRFeatures = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showRentalQR, setShowRentalQR] = useState(false);
  const [showFeedbackQR, setShowFeedbackQR] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const { currentUser } = useAuth();

  // Mock rental data - replace with actual Firebase data later
  const mockActiveRentals = [
    {
      id: 'rental1',
      equipmentName: 'Power Drill',
      equipmentImage: null,
      status: 'active'
    },
    {
      id: 'rental2',
      equipmentName: 'Camping Tent',
      equipmentImage: null,
      status: 'approved'
    }
  ];

  const handleScanSuccess = (decodedText) => {
    try {
      console.log('QR Code scanned:', decodedText);
      
      // Try to determine QR type from the scanned text
      if (decodedText.includes('/equipment/')) {
        const equipmentId = decodedText.split('/equipment/')[1];
        window.location.href = `/equipment/${equipmentId}`;
      } else if (decodedText.includes('rental')) {
        alert('Rental QR code detected');
      } else if (decodedText.includes('feedback')) {
        alert('Feedback QR code detected');
      } else {
        alert(`QR Code scanned: ${decodedText}`);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      alert('Invalid QR code format');
    }
  };

  const generateRentalQR = (rental, type = 'checkin') => {
    const qrUrl = `${window.location.origin}/rental/${rental.id}/${type}`;
    setSelectedRental({
      ...rental,
      qrUrl: qrUrl,
      qrType: type
    });
    setShowRentalQR(true);
  };

  const generateFeedbackQR = (rental) => {
    const qrUrl = `${window.location.origin}/feedback/${rental.id}`;
    setSelectedRental({
      ...rental,
      qrUrl: qrUrl
    });
    setShowFeedbackQR(true);
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
          {mockActiveRentals.length > 0 ? (
            <div className="row g-3">
              {mockActiveRentals.map(rental => (
                <div key={rental.id} className="col-md-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <img
                          src={rental.equipmentImage || 'https://via.placeholder.com/50x50?text=No+Image'}
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