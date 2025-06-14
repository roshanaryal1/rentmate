import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService'; 

import { format } from 'date-fns';


function RentEquipment() {
  const { equipmentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching equipment with ID:', equipmentId);
        
        const docRef = doc(db, 'equipment', equipmentId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Equipment not found');
        }
        
        const equipmentData = { id: docSnap.id, ...docSnap.data() };
        console.log('📋 Equipment data:', equipmentData);
        
        // Check if equipment is available for rent
        if (!equipmentData.available) {
          throw new Error('This equipment is currently not available for rent');
        }
        
        if (equipmentData.status !== 'approved') {
          throw new Error('This equipment is pending approval and cannot be rented yet');
        }
        
        // Check if user is trying to rent their own equipment
        if (equipmentData.ownerId === currentUser?.uid) {
          throw new Error('You cannot rent your own equipment');
        }
        
        setEquipment(equipmentData);
      } catch (err) {
        setError(err.message || 'Failed to fetch equipment details');
        console.error('Fetch equipment error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (equipmentId) {
      fetchEquipment();
    }
  }, [equipmentId, currentUser]);

  useEffect(() => {
    if (startDate && endDate && equipment) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate dates
      if (start >= end) {
        setError('End date must be after start date');
        setTotalDays(0);
        setTotalPrice(0);
        return;
      }
      
      const days = Math.ceil((end - start) / (1000 * 3600 * 24));
      const price = days * equipment.ratePerDay;
      
      setTotalDays(days);
      setTotalPrice(price);
      setError('');
    } else {
      setTotalDays(0);
      setTotalPrice(0);
    }
  }, [startDate, endDate, equipment]);

  const handleContactInfoChange = (field, value) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      return setError('Please select both start and end dates');
    }

    if (new Date(startDate) < new Date()) {
      return setError('Start date cannot be in the past');
    }

    if (!contactInfo.phone.trim()) {
      return setError('Please provide your phone number');
    }

    if (!contactInfo.address.trim()) {
      return setError('Please provide your address');
    }

    setIsSubmitting(true);
    setError('');

    try {
      const rentalRef = collection(db, 'rentals');
      
      const rentalData = {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentImage: equipment.imageUrl || null,
        renterId: currentUser.uid,
        renterEmail: currentUser.email,
        renterName: currentUser.displayName || currentUser.email.split('@')[0],
        renterPhone: contactInfo.phone,
        renterAddress: contactInfo.address,
        notes: contactInfo.notes,
        ownerId: equipment.ownerId,
        ownerName: equipment.ownerName,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        totalDays: totalDays,
        dailyRate: equipment.ratePerDay,
        totalPrice: totalPrice,
        status: 'pending', // Start as pending for owner approval
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('💾 Creating rental request:', rentalData);
      const rentalDoc = await addDoc(rentalRef, rentalData);
      
      // Add the rental ID to the rental data for notification
      const rentalWithId = {
        id: rentalDoc.id,
        ...rentalData
      };

      // Send notification to equipment owner
      try {
        await notificationService.sendNewRentalRequestNotification(
          rentalWithId, 
          equipment.ownerId
        );
        console.log('✅ Notification sent to equipment owner');
      } catch (notificationError) {
        console.error('❌ Failed to send notification to owner:', notificationError);
        // Don't fail the rental request if notification fails
      }

      // Show success message with improved UI
      setError('');
      
      // Create a success modal or redirect with success state
      const successMessage = `
        🎉 Rental request submitted successfully!
        
        Your request for "${equipment.name}" has been sent to ${equipment.ownerName}.
        
        📧 You'll receive a notification once the owner reviews your request.
        
        📋 Request Details:
        • Dates: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}
        • Duration: ${totalDays} day${totalDays !== 1 ? 's' : ''}
        • Total Cost: $${totalPrice}
        
        ⏰ Most owners respond within 24 hours.
      `;
      
      alert(successMessage);
      
      // Redirect to dashboard
      navigate('/renter-dashboard');
      
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading equipment details...</p>
        </div>
      </div>
    );
  }

  if (error && !equipment) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>
            <i className="bi bi-exclamation-triangle me-2"></i>
            Equipment Not Available
          </h4>
          <p className="mb-3">{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/renter-dashboard')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!equipment) return null;

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header */}
          <div className="mb-4">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <button 
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={() => navigate('/renter-dashboard')}
                  >
                    Dashboard
                  </button>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Rent Equipment</li>
              </ol>
            </nav>
            <h2 className="h3 fw-bold">Rent Equipment</h2>
            <p className="text-muted">Complete the form below to submit your rental request</p>
          </div>

          {error && (
            <div className="alert alert-danger mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <div className="row">
            {/* Equipment Info Card */}
            <div className="col-md-5 mb-4">
              <div className="card h-100">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-tools me-2"></i>
                    Equipment Details
                  </h5>
                </div>
                <div className="card-body">
                  {equipment.imageUrl && (
                    <img 
                      src={equipment.imageUrl} 
                      alt={equipment.name} 
                      className="img-fluid rounded mb-3"
                      style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  )}
                  
                  <h6 className="fw-bold">{equipment.name}</h6>
                  <p className="text-muted mb-2">{equipment.description}</p>
                  
                  <div className="mb-3">
                    <span className="badge bg-primary me-2">{equipment.category}</span>
                    <span className="badge bg-success">Available</span>
                  </div>
                  
                  <div className="border-top pt-3">
                    <div className="row text-center">
                      <div className="col-6">
                        <div className="fw-bold text-success">${equipment.ratePerDay}</div>
                        <small className="text-muted">per day</small>
                      </div>
                      <div className="col-6">
                        <div className="fw-bold text-info">{equipment.views || 0}</div>
                        <small className="text-muted">views</small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <small className="text-muted">
                      <i className="bi bi-geo-alt me-1"></i>
                      Location: {equipment.location}
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Form */}
            <div className="col-md-7">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-check me-2"></i>
                    Rental Request Form
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleBooking}>
                    {/* Rental Dates */}
                    <div className="row mb-3">
                      <div className="col-sm-6 mb-3">
                        <label className="form-label fw-semibold">
                          Start Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="form-control"
                          required
                        />
                      </div>
                      
                      <div className="col-sm-6 mb-3">
                        <label className="form-label fw-semibold">
                          End Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          min={startDate || format(new Date(), 'yyyy-MM-dd')}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="form-control"
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Phone Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        value={contactInfo.phone}
                        onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                        className="form-control"
                        placeholder="e.g., +64 21 123 4567"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Address <span className="text-danger">*</span>
                      </label>
                      <textarea
                        value={contactInfo.address}
                        onChange={(e) => handleContactInfoChange('address', e.target.value)}
                        className="form-control"
                        rows="2"
                        placeholder="Your full address for equipment delivery/pickup"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={contactInfo.notes}
                        onChange={(e) => handleContactInfoChange('notes', e.target.value)}
                        className="form-control"
                        rows="3"
                        placeholder="Any special requirements or questions for the owner..."
                      />
                    </div>

                    {/* Price Summary */}
                    {totalDays > 0 && (
                      <div className="alert alert-info">
                        <h6 className="alert-heading">
                          <i className="bi bi-calculator me-2"></i>
                          Rental Summary
                        </h6>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Rental Period:</span>
                          <span className="fw-semibold">{totalDays} day{totalDays !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>Daily Rate:</span>
                          <span>${equipment.ratePerDay}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold">Total Price:</span>
                          <span className="fw-bold text-success">${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="d-flex gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/renter-dashboard')}
                        className="btn btn-outline-secondary flex-fill"
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting || !startDate || !endDate || totalDays <= 0}
                        className="btn btn-success flex-fill"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send me-2"></i>
                            Submit Rental Request
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-3 text-center">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Your request will be sent to the equipment owner for approval
                      </small>
                    </div>
                  </form>
                </div>
              </div>
              
              {/* Additional Information Card */}
              <div className="card mt-4">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    What happens next?
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                          <i className="bi bi-1-circle text-primary"></i>
                        </div>
                        <div>
                          <h6 className="mb-1">Request Sent</h6>
                          <small className="text-muted">Your rental request is sent to the equipment owner</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                          <i className="bi bi-2-circle text-warning"></i>
                        </div>
                        <div>
                          <h6 className="mb-1">Owner Review</h6>
                          <small className="text-muted">The owner reviews your request (usually within 24 hours)</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                          <i className="bi bi-3-circle text-success"></i>
                        </div>
                        <div>
                          <h6 className="mb-1">Get Notified</h6>
                          <small className="text-muted">You'll receive a notification with the owner's decision</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0">
                          <i className="bi bi-4-circle text-info"></i>
                        </div>
                        <div>
                          <h6 className="mb-1">Arrange Pickup</h6>
                          <small className="text-muted">If approved, coordinate pickup/delivery with the owner</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RentEquipment;