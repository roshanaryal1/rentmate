import React, { useState, useEffect } from 'react';
import './FeedbackModal.css';

const FeedbackModal = ({
  isOpen,
  onClose,
  title = "Success!",
  message = "Operation completed successfully!",
  redirectPath = "/",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer;
    if (isOpen) {
      setIsVisible(true);
      timer = setTimeout(() => {
        handleClose();
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className={`feedback-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`feedback-modal ${isVisible ? 'visible' : ''}`}>
        <header className="feedback-header">
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
        </header>

        <section className="feedback-content">
          <h2>{title}</h2>
          <p>{message}</p>
          <div className="feedback-actions">
            <button className="primary-button" onClick={handleClose}>
              Continue
            </button>
          </div>
        </section>

        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;