// src/pages/QRCodePage.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EnhancedQRGenerator } from '../components/QRCode/QRCodeGenerator';
import { EnhancedQRScanner } from '../components/QRCode/QRCodeScanner';
import { AdminQRFeatures } from '../components/QRCode/AdminQRFeatures';
import { OwnerQRFeatures } from '../components/QRCode/OwnerQRFeatures';
import { RenterQRFeatures } from '../components/QRCode/RenterQRFeatures';

const QRCodePage = () => {
  const { currentUser, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('scanner');

  if (!currentUser) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <i className="bi bi-lock display-1 text-muted"></i>
            <h3 className="mt-3">Authentication Required</h3>
            <p className="text-muted">Please log in to access QR code tools.</p>
            <a href="/login" className="btn btn-primary">
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  const renderRoleSpecificFeatures = () => {
    switch (userRole) {
      case 'admin':
        return <AdminQRFeatures />;
      case 'owner':
        return <OwnerQRFeatures />;
      case 'renter':
        return <RenterQRFeatures />;
      default:
        return (
          <div className="text-center py-4">
            <i className="bi bi-person-x display-4 text-muted"></i>
            <h5 className="mt-3">Role Not Assigned</h5>
            <p className="text-muted">
              Please contact support to set up your account role.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col">
          <div className="d-flex align-items-center mb-4">
            <i className="bi bi-qr-code display-6 text-primary me-3"></i>
            <div>
              <h2 className="mb-1">QR Code Tools</h2>
              <p className="text-muted mb-0">
                Generate and scan QR codes for equipment management
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <ul className="nav nav-tabs mb-4" id="qrTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'scanner' ? 'active' : ''}`}
                onClick={() => setActiveTab('scanner')}
                type="button"
                role="tab"
              >
                <i className="bi bi-qr-code-scan me-2"></i>
                Scanner
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'generator' ? 'active' : ''}`}
                onClick={() => setActiveTab('generator')}
                type="button"
                role="tab"
              >
                <i className="bi bi-qr-code me-2"></i>
                Generator
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'features' ? 'active' : ''}`}
                onClick={() => setActiveTab('features')}
                type="button"
                role="tab"
              >
                <i className="bi bi-tools me-2"></i>
                {userRole === 'admin' ? 'Admin Tools' : 
                 userRole === 'owner' ? 'Owner Tools' : 'Renter Tools'}
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'scanner' && (
              <div className="tab-pane fade show active">
                <div className="row justify-content-center">
                  <div className="col-md-8 col-lg-6">
                    <EnhancedQRScanner
                      onScanSuccess={(decodedText) => {
                        console.log('Scanned:', decodedText);
                        // Handle the scanned result based on your app logic
                        // For now, just show an alert
                        alert(`QR Code Scanned: ${decodedText}`);
                      }}
                      onScanError={(error) => {
                        console.error('Scan error:', error);
                      }}
                      title="Scan Equipment QR Code"
                      instructions="Point your camera at any RentMate QR code"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'generator' && (
              <div className="tab-pane fade show active">
                <div className="row justify-content-center">
                  <div className="col-md-8 col-lg-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="bi bi-qr-code me-2"></i>
                          QR Code Generator
                        </h5>
                      </div>
                      <div className="card-body">
                        <QRGeneratorForm />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="tab-pane fade show active">
                {renderRoleSpecificFeatures()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple QR Generator Form Component
const QRGeneratorForm = () => {
  const [qrValue, setQrValue] = useState('');
  const [qrTitle, setQrTitle] = useState('');
  const [showQR, setShowQR] = useState(false);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (qrValue.trim()) {
      setShowQR(true);
    }
  };

  return (
    <div>
      <form onSubmit={handleGenerate}>
        <div className="mb-3">
          <label htmlFor="qrTitle" className="form-label">
            Title (Optional)
          </label>
          <input
            type="text"
            className="form-control"
            id="qrTitle"
            value={qrTitle}
            onChange={(e) => setQrTitle(e.target.value)}
            placeholder="Enter a title for your QR code"
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="qrValue" className="form-label">
            Content <span className="text-danger">*</span>
          </label>
          <textarea
            className="form-control"
            id="qrValue"
            rows="3"
            value={qrValue}
            onChange={(e) => setQrValue(e.target.value)}
            placeholder="Enter URL, text, or data to encode"
            required
          />
          <div className="form-text">
            Enter any text, URL, or data you want to encode in the QR code
          </div>
        </div>
        
        <div className="d-grid">
          <button type="submit" className="btn btn-primary">
            <i className="bi bi-qr-code me-2"></i>
            Generate QR Code
          </button>
        </div>
      </form>

      {showQR && qrValue && (
        <div className="mt-4 text-center">
          <hr />
          <EnhancedQRGenerator
            value={qrValue}
            title={qrTitle || undefined}
            size={256}
            showDownload={true}
            showPrint={true}
          />
        </div>
      )}
    </div>
  );
};

export default QRCodePage;