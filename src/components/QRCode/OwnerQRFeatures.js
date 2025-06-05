// src/components/QRCode/OwnerQRFeatures.js
import React, { useState } from 'react';
import { EnhancedQRGenerator } from './QRCodeGenerator';
import { QRCodeModal } from './QRCodeModal';
import { useAuth } from '../../contexts/AuthContext';

export const OwnerQRFeatures = () => {
  const [showEquipmentQR, setShowEquipmentQR] = useState(false);
  const [showOwnerAuthQR, setShowOwnerAuthQR] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const { currentUser } = useAuth();

  // Mock equipment data - replace with actual Firebase data later
  const mockEquipment = [
    {
      id: 'eq1',
      name: 'Power Drill',
      category: 'Tools',
      available: true,
      imageUrl: null
    },
    {
      id: 'eq2', 
      name: 'Camping Tent',
      category: 'Outdoor',
      available: false,
      imageUrl: null
    }
  ];

  const generateEquipmentQR = (equipmentItem) => {
    const qrUrl = `${window.location.origin}/equipment/${equipmentItem.id}`;
    setSelectedEquipment({
      ...equipmentItem,
      qrUrl: qrUrl
    });
    setShowEquipmentQR(true);
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
          {mockEquipment.length > 0 ? (
            <div className="row g-3">
              {mockEquipment.map(item => (
                <div key={item.id} className="col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <img
                          src={item.imageUrl || 'https://via.placeholder.com/50x50?text=No+Image'}
                          alt={item.name}
                          className="rounded me-3"
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
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
                        
                        <button
                          onClick={() => generateEquipmentQR(item)}
                          className="btn btn-primary btn-sm"
                        >
                          <i className="bi bi-qr-code me-1"></i>
                          Generate QR
                        </button>
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