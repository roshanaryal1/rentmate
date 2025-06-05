// src/components/QRCode/EnhancedQRGenerator.js
import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { toPng } from 'html-to-image';

export const EnhancedQRGenerator = ({ 
  value, 
  size = 256, 
  title, 
  subtitle, 
  showDownload = true, 
  showPrint = true,
  logoUrl = null,
  backgroundColor = "#ffffff",
  foregroundColor = "#000000"
}) => {
  const [downloading, setDownloading] = useState(false);
  const qrRef = useRef();

  const downloadQR = async () => {
    if (!qrRef.current) return;
    
    setDownloading(true);
    try {
      const dataUrl = await toPng(qrRef.current, {
        quality: 1.0,
        pixelRatio: 2
      });
      
      const link = document.createElement('a');
      link.download = `qr-code-${title || 'rentmate'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code');
    } finally {
      setDownloading(false);
    }
  };

  const printQR = () => {
    if (!qrRef.current) return;
    
    const printWindow = window.open('', '_blank');
    const canvas = qrRef.current.querySelector('canvas');
    const dataUrl = canvas.toDataURL();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${title}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              padding: 20px; 
              font-family: Arial, sans-serif; 
            }
            .qr-container { 
              text-align: center; 
              border: 2px solid #ddd; 
              padding: 20px; 
              border-radius: 8px; 
            }
            h1 { margin: 0 0 10px 0; font-size: 24px; }
            p { margin: 0 0 20px 0; color: #666; }
            img { display: block; margin: 0 auto; }
            .instructions { 
              margin-top: 20px; 
              text-align: left; 
              max-width: 400px; 
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${title ? `<h1>${title}</h1>` : ''}
            ${subtitle ? `<p>${subtitle}</p>` : ''}
            <img src="${dataUrl}" alt="QR Code" />
            <div class="instructions">
              <h3>How to use:</h3>
              <ol>
                <li>Open your phone's camera app</li>
                <li>Point it at this QR code</li>
                <li>Tap the notification that appears</li>
                <li>Follow the on-screen instructions</li>
              </ol>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="enhanced-qr-generator">
      <div 
        ref={qrRef} 
        className="qr-display text-center p-4 bg-white rounded border"
        style={{ display: 'inline-block' }}
      >
        {title && (
          <h5 className="mb-2 fw-bold text-dark">{title}</h5>
        )}
        {subtitle && (
          <p className="text-muted mb-3 small">{subtitle}</p>
        )}
        
        <div className="position-relative d-inline-block">
          <QRCodeCanvas
            value={value}
            size={size}
            bgColor={backgroundColor}
            fgColor={foregroundColor}
            level="H"
            includeMargin={true}
          />
          
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              className="position-absolute top-50 start-50 translate-middle rounded"
              style={{
                width: size * 0.15,
                height: size * 0.15,
                backgroundColor: 'white',
                padding: '2px'
              }}
            />
          )}
        </div>
        
        <div className="mt-3">
          <small className="text-muted d-block">
            Scan with your phone camera
          </small>
        </div>
      </div>
      
      {(showDownload || showPrint) && (
        <div className="mt-3 d-flex gap-2 justify-content-center">
          {showDownload && (
            <button
              onClick={downloadQR}
              disabled={downloading}
              className="btn btn-outline-primary btn-sm"
            >
              {downloading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Downloading...
                </>
              ) : (
                <>
                  <i className="bi bi-download me-1"></i>
                  Download
                </>
              )}
            </button>
          )}
          
          {showPrint && (
            <button
              onClick={printQR}
              className="btn btn-outline-secondary btn-sm"
            >
              <i className="bi bi-printer me-1"></i>
              Print
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// src/components/QRCode/EnhancedQRScanner.js
import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const EnhancedQRScanner = ({ 
  onScanSuccess, 
  onScanError,
  title = "Scan QR Code",
  instructions = "Point your camera at the QR code"
}) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const qrCodeRegionId = "qr-reader-region";
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        // Prefer back camera
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        );
        setSelectedCamera(backCamera?.id || devices[0].id);
      } else {
        setError('No cameras found');
      }
    }).catch(err => {
      setError('Camera access not available');
    });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('Please select a camera');
      return;
    }

    try {
      setScanning(true);
      setError('');
      
      html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId);
      
      await html5QrCodeRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText, decodedResult) => {
          console.log('QR Code scanned:', decodedText);
          if (onScanSuccess) {
            onScanSuccess(decodedText, decodedResult);
          }
          stopScanning();
        },
        (errorMessage) => {
          // Handle scan errors silently
          if (onScanError && errorMessage !== 'QR code parse error, error = NotFoundException: No MultiFormat Readers were able to detect the code.') {
            onScanError(errorMessage);
          }
        }
      );
      
      setHasPermission(true);
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      setError('Failed to start camera. Please check permissions.');
      setScanning(false);
      setHasPermission(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
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

          {!scanning && (
            <div className="mb-3">
              <p className="text-center text-muted mb-3">{instructions}</p>
              
              {cameras.length > 1 && (
                <div className="mb-3">
                  <label className="form-label">Select Camera:</label>
                  <select
                    className="form-select"
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                  >
                    {cameras.map(camera => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label || `Camera ${camera.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="d-grid">
                <button
                  onClick={startScanning}
                  className="btn btn-primary"
                  disabled={!selectedCamera}
                >
                  <i className="bi bi-camera me-2"></i>
                  Start Scanning
                </button>
              </div>
            </div>
          )}

          <div 
            id={qrCodeRegionId}
            className={`qr-scanner-region ${scanning ? 'd-block' : 'd-none'}`}
            style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
          />

          {scanning && (
            <div className="text-center mt-3">
              <button
                onClick={stopScanning}
                className="btn btn-outline-secondary"
              >
                <i className="bi bi-stop-circle me-2"></i>
                Stop Scanning
              </button>
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

// src/components/QRCode/QRCodeModal.js
import React from 'react';
import { EnhancedQRGenerator } from './EnhancedQRGenerator';

export const QRCodeModal = ({ 
  isOpen, 
  onClose, 
  qrValue, 
  title, 
  subtitle,
  instructions = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-qr-code me-2"></i>
              {title || 'QR Code'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body text-center">
            <EnhancedQRGenerator
              value={qrValue}
              title={title}
              subtitle={subtitle}
              size={200}
              showDownload={true}
              showPrint={true}
            />
            
            {instructions.length > 0 && (
              <div className="mt-4 text-start">
                <h6>How to use:</h6>
                <ol>
                  {instructions.map((instruction, index) => (
                    <li key={index} className="small text-muted">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};