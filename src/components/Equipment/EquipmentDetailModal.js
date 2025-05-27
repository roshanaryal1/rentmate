// Create this file: src/components/Equipment/EquipmentDetailModal.js

import React from 'react';
import { Link } from 'react-router-dom';

function EquipmentDetailModal({ equipment, isOpen, onClose, currentUserId }) 
{
  if (!isOpen || !equipment) return null;

  const isOwnEquipment = equipment.ownerId === currentUserId;

  const formatDate = (dateObj) => {
    if (!dateObj) return 'Unknown';
    if (dateObj.toDate) return dateObj.toDate().toLocaleDateString();
    if (dateObj instanceof Date) return dateObj.toLocaleDateString();
    return new Date(dateObj).toLocaleDateString();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
      onClick={handleBackdropClick}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title d-flex align-items-center">
              <i className="bi bi-tools me-2"></i>
              Equipment Details
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-0">
            {/* Equipment Image */}
            <div style={{ height: '250px', position: 'relative', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
              {equipment.imageUrl ? (
                <img 
                  src={equipment.imageUrl} 
                  alt={equipment.name}
                  className="w-100 h-100"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/600x250?text=No+Image+Available';
                  }}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <i className="bi bi-tools display-1 text-muted"></i>
                </div>
              )}
              
              {/* Status Badges */}
              <div className="position-absolute top-0 end-0 m-3">
                <span className={`badge ${equipment.available ? 'bg-success' : 'bg-danger'} me-2`}>
                  {equipment.available ? 'Available' : 'Unavailable'}
                </span>
                {isOwnEquipment && (
                  <span className="badge bg-info">Your Equipment</span>
                )}
              </div>
            </div>

            {/* Equipment Information */}
            <div className="p-4">
              {/* Title and Category */}
              <div className="mb-3">
                <h4 className="mb-2 fw-bold text-dark">{equipment.name}</h4>
                <span className="badge bg-primary fs-6 mb-2">{equipment.category}</span>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="d-flex align-items-center">
                  <span className="h3 text-success fw-bold me-2">${equipment.ratePerDay}</span>
                  <span className="text-muted">per day</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h6 className="fw-semibold text-dark mb-2">
                  <i className="bi bi-card-text me-2"></i>Description
                </h6>
                <p className="text-muted mb-0" style={{ lineHeight: '1.6' }}>
                  {equipment.description || 'No description available.'}
                </p>
              </div>

              {/* Equipment Details Grid */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="mb-3">
                    <h6 className="fw-semibold text-dark mb-2">
                      <i className="bi bi-person me-2"></i>Owner
                    </h6>
                    <p className="text-muted mb-0">
                      {isOwnEquipment ? 'You' : equipment.ownerName || 'Unknown Owner'}
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <h6 className="fw-semibold text-dark mb-2">
                      <i className="bi bi-geo-alt me-2"></i>Location
                    </h6>
                    <p className="text-muted mb-0">
                      {equipment.location || 'Location not specified'}
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <h6 className="fw-semibold text-dark mb-2">
                      <i className="bi bi-calendar me-2"></i>Listed Date
                    </h6>
                    <p className="text-muted mb-0">
                      {formatDate(equipment.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <h6 className="fw-semibold text-dark mb-2">
                      <i className="bi bi-check-circle me-2"></i>Status
                    </h6>
                    <span className={`badge ${equipment.status === 'approved' ? 'bg-success' : 'bg-warning'}`}>
                      {equipment.status === 'approved' ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              {equipment.features && equipment.features.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold text-dark mb-3">
                    <i className="bi bi-star me-2"></i>Key Features
                  </h6>
                  <div className="row">
                    {equipment.features.map((feature, index) => (
                      <div key={index} className="col-md-6 mb-2">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          <span className="text-muted">{feature}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Stats */}
              <div className="mb-4">
                <div className="row text-center">
                  <div className="col-4">
                    <div className="border rounded p-3">
                      <h6 className="mb-1 fw-bold text-primary">{equipment.views || 0}</h6>
                      <small className="text-muted">Views</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border rounded p-3">
                      <h6 className="mb-1 fw-bold text-success">{equipment.rentals || 0}</h6>
                      <small className="text-muted">Rentals</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border rounded p-3">
                      <h6 className="mb-1 fw-bold text-warning">
                        {equipment.rating ? `${equipment.rating}/5` : 'No Rating'}
                      </h6>
                      <small className="text-muted">Rating</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {!isOwnEquipment && (
                <div className="alert alert-info">
                  <h6 className="alert-heading">
                    <i className="bi bi-info-circle me-2"></i>
                    Interested in this equipment?
                  </h6>
                  <p className="mb-2">Contact the owner to discuss rental terms and availability.</p>
                  <small className="text-muted">
                    Owner: {equipment.ownerName} • Location: {equipment.location}
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              <i className="bi bi-x-circle me-1"></i>
              Close
            </button>
            
            {equipment.available && !isOwnEquipment ? (
              <Link
                to={`/rent/${equipment.id}`}
                className="btn btn-success"
                onClick={onClose}
              >
                <i className="bi bi-calendar-check me-1"></i>
                Rent This Equipment
              </Link>
            ) : isOwnEquipment ? (
              <Link
                to={`/edit-equipment/${equipment.id}`}
                className="btn btn-primary"
                onClick={onClose}
              >
                <i className="bi bi-pencil me-1"></i>
                Edit Equipment
              </Link>
            ) : (
              <button className="btn btn-secondary" disabled>
                <i className="bi bi-x-circle me-1"></i>
                Currently Unavailable
              </button>
            )}
            
            {!isOwnEquipment && (
              <button 
                className="btn btn-outline-primary"
                onClick={() => {
                  // Add to favorites functionality could go here
                  console.log('Add to favorites:', equipment.id);
                }}
              >
                <i className="bi bi-heart me-1"></i>
                Add to Favorites
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentDetailModal;