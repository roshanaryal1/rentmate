// src/components/QRCode/QRCodeGenerator.js
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

// Export as default as well for backward compatibility
export default EnhancedQRGenerator;