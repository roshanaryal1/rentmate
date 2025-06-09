// src/pages/QRHandler.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const QRHandler = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrData, setQrData] = useState(null);

  const handleQRCode = useCallback(async (id) => {
    try {
      setLoading(true);
      setError('');
      
      // Mock QR processing - replace with actual service call
      // For now, just parse the ID to determine the type
      let result;
      
      if (id.startsWith('eq-')) {
        result = {
          type: 'equipment',
          equipmentId: id.replace('eq-', '')
        };
      } else if (id.startsWith('rental-')) {
        result = {
          type: 'rental',
          rentalId: id.replace('rental-', ''),
          action: 'view'
        };
      } else if (id.startsWith('invite-')) {
        result = {
          type: 'admin_invite',
          inviteCode: id.replace('invite-', '')
        };
      } else {
        result = {
          type: 'unknown',
          data: id
        };
      }
      
      setQrData(result);
      
      // Route based on QR code type
      switch (result.type) {
        case 'equipment':
          navigate(`/equipment/${result.equipmentId}`);
          break;
        case 'rental':
          if (result.action === 'checkin' || result.action === 'checkout') {
            // Handle rental check-in/out
            await handleRentalAction(result);
          } else {
            navigate(`/rental-details/${result.rentalId}`);
          }
          break;
        case 'admin_invite':
          if (currentUser) {
            navigate('/signup?type=admin&invite=' + result.inviteCode);
          } else {
            navigate('/signup?type=admin&invite=' + result.inviteCode);
          }
          break;
        case 'feedback':
          navigate(`/feedback/${result.rentalId}`);
          break;
        case 'owner_auth':
        case 'admin_auth':
          // Handle authentication verification
          handleAuthVerification(result);
          break;
        default:
          setError('Unknown QR code type');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setError('Failed to process QR code: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, currentUser]);

  useEffect(() => {
    if (qrId) {
      handleQRCode(qrId);
    } else {
      setError('No QR code ID provided');
      setLoading(false);
    }
  }, [qrId, handleQRCode]);

  const handleRentalAction = async (qrData) => {
    try {
      // Mock rental action processing
      console.log('Processing rental action:', qrData);
      alert(`${qrData.action} successful!`);
      navigate('/rental-history');
    } catch (error) {
      console.error('Error processing rental action:', error);
      setError('Failed to process rental action');
    }
  };

  const handleAuthVerification = (qrData) => {
    // Display authentication information
    setQrData({
      ...qrData,
      verified: true,
      timestamp: new Date().toISOString()
    });
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h4 className="mt-3">Processing QR Code...</h4>
            <p className="text-muted">
              Please wait while we process your request.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger">
              <h4 className="alert-heading">
                <i className="bi bi-exclamation-triangle me-2"></i>
                QR Code Error
              </h4>
              <p className="mb-0">{error}</p>
            </div>
            <div className="text-center">
              <button 
                onClick={() => navigate('/')} 
                className="btn btn-primary me-2"
              >
                Go Home
              </button>
              <button 
                onClick={() => navigate('/qr-tools')} 
                className="btn btn-outline-secondary"
              >
                QR Tools
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have auth verification data, show it
  if (qrData && (qrData.type === 'owner_auth' || qrData.type === 'admin_auth')) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-success text-white text-center">
                <h5 className="mb-0">
                  <i className="bi bi-shield-check me-2"></i>
                  Authentication Verified
                </h5>
              </div>
              <div className="card-body">
                <div className="text-center mb-3">
                  <i className="bi bi-person-check display-1 text-success"></i>
                </div>
                
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td><strong>Type:</strong></td>
                      <td className="text-capitalize">
                        {qrData.type.replace('_', ' ')}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Name:</strong></td>
                      <td>{qrData.name || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td><strong>Email:</strong></td>
                      <td>{qrData.email || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td><strong>Verified:</strong></td>
                      <td>
                        <span className="badge bg-success">
                          {new Date(qrData.timestamp).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="text-center">
                  <button 
                    onClick={() => navigate('/')} 
                    className="btn btn-primary"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback - shouldn't normally reach here
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <i className="bi bi-check-circle display-1 text-success"></i>
          <h3 className="mt-3">QR Code Processed</h3>
          <p className="text-muted">
            Your QR code has been processed successfully.
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRHandler;