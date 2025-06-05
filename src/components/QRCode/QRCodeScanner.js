// src/components/QRCode/EnhancedQRScanner.js
import React, { useState, useRef, useEffect } from 'react';

export const EnhancedQRScanner = ({ 
  onScanSuccess, 
  onScanError,
  title = "Scan QR Code",
  instructions = "Point your camera at the QR code"
}) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setScanning(true);
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setHasPermission(true);
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Failed to start camera. Please check permissions.');
      setScanning(false);
      setHasPermission(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        // For now, just call the success callback with a mock result
        // In a real implementation, you'd use a QR code library to decode the image
        if (onScanSuccess) {
          onScanSuccess(`Mock QR data from file: ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="enhanced-qr-scanner">
      <div className="card">
        <div className="card-header text-center">
          <h5 className="mb-0">
            <i className="bi bi-qr-code-scan me-2"></i>
            {title}
          </h5>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <p className="text-center text-muted mb-3">{instructions}</p>

          {!scanning ? (
            <div className="d-grid gap-2">
              <button
                onClick={startScanning}
                className="btn btn-primary"
              >
                <i className="bi bi-camera me-2"></i>
                Start Camera Scanning
              </button>
              
              <div className="text-center">
                <small className="text-muted">or</small>
              </div>
              
              <div>
                <label className="btn btn-outline-secondary w-100">
                  <i className="bi bi-upload me-2"></i>
                  Upload QR Code Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="d-none"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-100 rounded"
                style={{ maxHeight: '300px', objectFit: 'cover' }}
              />
              
              <div className="text-center mt-3">
                <button
                  onClick={stopScanning}
                  className="btn btn-outline-secondary"
                >
                  <i className="bi bi-stop-circle me-2"></i>
                  Stop Scanning
                </button>
              </div>
              
              <div className="alert alert-info mt-3">
                <small>
                  <strong>Note:</strong> This is a simplified scanner. 
                  For full QR code detection, you would need to integrate a library like html5-qrcode.
                </small>
              </div>
            </div>
          )}

          {hasPermission === false && (
            <div className="alert alert-info mt-3">
              <h6>Camera Permission Required</h6>
              <p className="mb-2">To scan QR codes, please:</p>
              <ol className="mb-0">
                <li>Click the camera icon in your browser's address bar</li>
                <li>Select "Allow" for camera access</li>
                <li>Refresh this page and try again</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export as default as well for backward compatibility
export default EnhancedQRScanner;