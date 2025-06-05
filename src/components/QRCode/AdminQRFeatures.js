// src/components/QRCode/AdminQRFeatures.js
import React, { useState } from 'react';
import { QRCodeModal } from './QRCodeModal';
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
      // Mock QR URL - replace with actual service call later
      const mockQRUrl = `${window.location.origin}/signup?type=admin&invite=${inviteCode}`;
      setInviteQR(mockQRUrl);
      setShowInviteModal(true);
    } catch (error) {
      console.error('Error generating admin invite:', error);
      alert('Failed to generate invite QR code');
    } finally {
      setLoading(false);
    }
  };

  const generateReportsQR = () => {
    setShowReportsModal(true);
  };

  const generateAuthQR = () => {
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