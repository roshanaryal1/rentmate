// src/components/FeedbackModal.js
import React, { useState, useEffect } from 'react';
import './FeedbackModal.css';

const FeedbackModal = ({ isOpen, onClose, title = "Success!", message = "Your equipment has been added successfully!" }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  if (!isOpen) return null;

  return (
    <div className={`feedback-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`feedback-modal ${isVisible ? 'visible' : ''}`}>
        <div className="feedback-header">
          <div className="success-icon">
            <svg className="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <button className="close-button" onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="feedback-content">
          <h2>{title}</h2>
          <p>{message}</p>
          
          <div className="feedback-actions">
            <button className="primary-button" onClick={handleClose}>
              Continue
            </button>
            <button className="secondary-button" onClick={() => window.location.href = '/add-equipment'}>
              Add Another Equipment
            </button>
          </div>
        </div>
        
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;