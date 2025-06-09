// src/components/Equipment/EquipmentDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';

function EquipmentDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const equipmentDoc = await getDoc(doc(db, 'equipment', id));
        if (equipmentDoc.exists()) {
          const equipmentData = { id: equipmentDoc.id, ...equipmentDoc.data() };
          setEquipment(equipmentData);
          
          // Increment view count
          await updateDoc(doc(db, 'equipment', id), {
            views: increment(1)
          });
        } else {
          setError('Equipment not found');
        }
      } catch (error) {
        console.error('Error fetching equipment:', error);
        setError('Failed to load equipment details');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [id]);

  const handleQuickRent = () => {
    if (!currentUser) {
      // Store the equipment ID they wanted to rent and redirect to login
      localStorage.setItem('pendingRental', id);
      navigate('/login');
    } else {
      navigate(`/rent/${id}`);
    }
  };

  const handlePayAndRent = () => {
    if (!currentUser) {
      // Store the equipment ID they wanted to rent and redirect to login
      localStorage.setItem('pendingRental', id);
      navigate('/login');
    } else {
      navigate(`/payment/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading equipment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="alert alert-danger">
              <h4 className="alert-heading">Equipment Not Found</h4>
              <p className="mb-0">{error || 'The equipment you\'re looking for doesn\'t exist.'}</p>
            </div>
            <Link to="/" className="btn btn-primary">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none">
              <i className="bi bi-house me-1"></i>
              Home
            </Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none">Browse Equipment</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">{equipment.name}</li>
        </ol>
      </nav>

      <div className="row">
        {/* Equipment Image */}
        <div className="col-lg-6 mb-4">
          <div className="equipment-image-container">
            {equipment.imageUrl ? (
              <img
                src={equipment.imageUrl}
                alt={equipment.name}
                className="img-fluid rounded shadow"
                style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center bg-light rounded shadow"
                   style={{ width: '100%', height: '400px' }}>
                <div className="text-center text-muted">
                  <i className="bi bi-image" style={{ fontSize: '4rem' }}></i>
                  <p className="mt-2">No image available</p>
                </div>
              </div>
            )}
            
            {/* Image fallback */}
            <div className="d-none align-items-center justify-content-center bg-light rounded shadow"
                 style={{ width: '100%', height: '400px' }}>
              <div className="text-center text-muted">
                <i className="bi bi-image" style={{ fontSize: '4rem' }}></i>
                <p className="mt-2">Image not available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Details */}
        <div className="col-lg-6">
          <div className="equipment-details">
            {/* Header */}
            <div className="mb-4">
              <h1 className="display-5 fw-bold mb-2">{equipment.name}</h1>
              
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="badge bg-primary fs-6">{equipment.category}</span>
                <span className={`badge fs-6 ${equipment.available ? 'bg-success' : 'bg-danger'}`}>
                  {equipment.available ? 'Available' : 'Currently Rented'}
                </span>
                {equipment.approvalStatus && (
                  <span className={`badge fs-6 ${equipment.approvalStatus === 'approved' ? 'bg-success' : 'bg-warning'}`}>
                    {equipment.approvalStatus === 'approved' ? 'Verified' : 'Pending Approval'}
                  </span>
                )}
              </div>

              <div className="d-flex align-items-center text-muted small mb-3">
                <i className="bi bi-eye me-1"></i>
                <span className="me-3">{equipment.views || 0} views</span>
                <i className="bi bi-calendar-check me-1"></i>
                <span>{equipment.bookings || 0} bookings</span>
              </div>

              <div className="price-section">
                <h2 className="text-success fw-bold mb-0">
                  ${equipment.ratePerDay}
                  <span className="fs-5 text-muted fw-normal">/day</span>
                </h2>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h5 className="fw-semibold mb-2">Description</h5>
              <p className="text-muted">{equipment.description}</p>
            </div>

            {/* Features */}
            {equipment.features && equipment.features.length > 0 && (
              <div className="mb-4">
                <h5 className="fw-semibold mb-3">Features</h5>
                <div className="row">
                  {equipment.features.map((feature, index) => (
                    <div key={index} className="col-sm-6 mb-2">
                      <div className="d-flex align-items-start">
                        <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                        <span className="small">{feature}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rental Information */}
            <div className="mb-4">
              <h5 className="fw-semibold mb-3">Rental Information</h5>
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-person-circle text-primary me-2"></i>
                    <div>
                      <small className="text-muted d-block">Owner</small>
                      <span className="fw-medium">{equipment.ownerName || 'Equipment Owner'}</span>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-geo-alt text-primary me-2"></i>
                    <div>
                      <small className="text-muted d-block">Location</small>
                      <span className="fw-medium">{equipment.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="rental-actions">
              {equipment.available && (equipment.approvalStatus === 'approved' || !equipment.approvalStatus) ? (
                <div className="d-grid gap-2">
                  <button
                    onClick={handlePayAndRent}
                    className="btn btn-primary btn-lg"
                    disabled={!equipment.available}
                  >
                    <i className="bi bi-credit-card me-2"></i>
                    {currentUser ? 'Pay & Rent Now' : 'Login to Pay & Rent'}
                  </button>
                  
                  <button
                    onClick={handleQuickRent}
                    className="btn btn-outline-primary"
                    disabled={!equipment.available}
                  >
                    <i className="bi bi-calendar-check me-2"></i>
                    {currentUser ? 'Schedule Rental' : 'Login to Schedule'}
                  </button>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {!equipment.available ? 'This equipment is currently not available for rent.' : 'This equipment is pending approval.'}
                </div>
              )}

              {!currentUser && (
                <div className="text-center mt-3">
                  <small className="text-muted">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary text-decoration-none">
                      Sign up here
                    </Link>
                  </small>
                </div>
              )}
            </div>

            {/* Trust Signals */}
            <div className="mt-4 p-3 bg-light rounded">
              <h6 className="fw-semibold mb-2">
                <i className="bi bi-shield-check text-success me-2"></i>
                Rental Protection
              </h6>
              <ul className="list-unstyled mb-0 small">
                <li><i className="bi bi-check text-success me-1"></i> Secure payment processing</li>
                <li><i className="bi bi-check text-success me-1"></i> Equipment condition guarantee</li>
                <li><i className="bi bi-check text-success me-1"></i> 24/7 customer support</li>
                <li><i className="bi bi-check text-success me-1"></i> Flexible rental periods</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Equipment Info */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card border-0 bg-light">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-info-circle me-2"></i>
                Important Information
              </h5>
              <div className="row">
                <div className="col-md-6">
                  <h6>Before You Rent:</h6>
                  <ul className="small mb-0">
                    <li>Check equipment availability dates</li>
                    <li>Review pickup and return instructions</li>
                    <li>Understand the rental terms and conditions</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>During Your Rental:</h6>
                  <ul className="small mb-0">
                    <li>Use equipment as intended and safely</li>
                    <li>Contact owner for any issues or questions</li>
                    <li>Return equipment in the same condition</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="row mt-4">
        <div className="col-12">
          <Link to="/" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Browse Equipment
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EquipmentDetail;