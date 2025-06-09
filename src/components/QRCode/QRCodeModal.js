// src/components/QRCode/QRCodeModal.js
import React from 'react';
import { EnhancedQRGenerator } from './QRCodeGenerator';

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
              aria-label="Close"
            ></button>
          </div>
          
          <div className="modal-body text-center">
            {qrValue && (
              <EnhancedQRGenerator
                value={qrValue}
                title={subtitle}
                size={200}
                showDownload={true}
                showPrint={true}
              />
            )}
            
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

// Export as default as well for backward compatibility
export default QRCodeModal;