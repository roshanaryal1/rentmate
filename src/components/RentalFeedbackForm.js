// src/components/RentalFeedbackForm.js
import React, { useState } from 'react';
import './RentalFeedbackForm.css';

const RentalFeedbackForm = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  equipmentData = {} 
}) => {
  const [formData, setFormData] = useState({
    rating: 0,
    feedback: '',
    wouldRecommend: null,
    equipmentCondition: 0,
    serviceRating: 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleRatingClick = (field, rating) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));
    // Clear error when user selects a rating
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleTextChange = (e) => {
    setFormData(prev => ({
      ...prev,
      feedback: e.target.value
    }));
    // Clear error when user starts typing
    if (errors.feedback) {
      setErrors(prev => ({
        ...prev,
        feedback: null
      }));
    }
  };

  const handleRecommendClick = (value) => {
    setFormData(prev => ({
      ...prev,
      wouldRecommend: value
    }));
    if (errors.wouldRecommend) {
      setErrors(prev => ({
        ...prev,
        wouldRecommend: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.rating === 0) {
      newErrors.rating = 'Please provide an overall rating';
    }
    
    if (formData.feedback.trim().length < 10) {
      newErrors.feedback = 'Please provide at least 10 characters of feedback';
    }
    
    if (formData.wouldRecommend === null) {
      newErrors.wouldRecommend = 'Please let us know if you would recommend this equipment';
    }

    if (formData.equipmentCondition === 0) {
      newErrors.equipmentCondition = 'Please rate the equipment condition';
    }

    if (formData.serviceRating === 0) {
      newErrors.serviceRating = 'Please rate our service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const feedbackData = {
        ...formData,
        equipmentId: equipmentData.id,
        equipmentName: equipmentData.name,
        rentalDate: equipmentData.rentalDate,
        timestamp: new Date().toISOString()
      };
      
      await onSubmit(feedbackData);
      
      // Reset form
      setFormData({
        rating: 0,
        feedback: '',
        wouldRecommend: null,
        equipmentCondition: 0,
        serviceRating: 0
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (field, currentRating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= currentRating ? 'filled' : ''}`}
            onClick={() => handleRatingClick(field, star)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-overlay">
      <div className="feedback-form-modal">
        <header className="feedback-form-header">
          <div className="equipment-info">
            <h2>How was your rental experience?</h2>
            {equipmentData.name && (
              <p className="equipment-name">{equipmentData.name}</p>
            )}
            {equipmentData.rentalDate && (
              <p className="rental-date">Rented on: {new Date(equipmentData.rentalDate).toLocaleDateString()}</p>
            )}
          </div>
          <button className="close-button" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="feedback-form">
          {/* Overall Rating */}
          <div className="form-group">
            <label>Overall Experience *</label>
            {renderStars('rating', formData.rating)}
            {errors.rating && <span className="error-message">{errors.rating}</span>}
          </div>

          {/* Equipment Condition */}
          <div className="form-group">
            <label>Equipment Condition *</label>
            {renderStars('equipmentCondition', formData.equipmentCondition)}
            {errors.equipmentCondition && <span className="error-message">{errors.equipmentCondition}</span>}
          </div>

          {/* Service Rating */}
          <div className="form-group">
            <label>Service Quality *</label>
            {renderStars('serviceRating', formData.serviceRating)}
            {errors.serviceRating && <span className="error-message">{errors.serviceRating}</span>}
          </div>

          {/* Recommendation */}
          <div className="form-group">
            <label>Would you recommend this equipment to others? *</label>
            <div className="recommendation-buttons">
              <button
                type="button"
                className={`recommend-btn ${formData.wouldRecommend === true ? 'selected yes' : ''}`}
                onClick={() => handleRecommendClick(true)}
              >
                👍 Yes
              </button>
              <button
                type="button"
                className={`recommend-btn ${formData.wouldRecommend === false ? 'selected no' : ''}`}
                onClick={() => handleRecommendClick(false)}
              >
                👎 No
              </button>
            </div>
            {errors.wouldRecommend && <span className="error-message">{errors.wouldRecommend}</span>}
          </div>

          {/* Written Feedback */}
          <div className="form-group">
            <label htmlFor="feedback">Tell us about your experience *</label>
            <textarea
              id="feedback"
              placeholder="Share details about the equipment quality, pickup/return process, or any suggestions..."
              value={formData.feedback}
              onChange={handleTextChange}
              rows={4}
              className={errors.feedback ? 'error' : ''}
            />
            <div className="char-count">
              {formData.feedback.length}/500
            </div>
            {errors.feedback && <span className="error-message">{errors.feedback}</span>}
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalFeedbackForm;