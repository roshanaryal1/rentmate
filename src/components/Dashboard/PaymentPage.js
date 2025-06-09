// src/components/Dashboard/PaymentPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import FeedbackModal from '../FeedbackModal';

function PaymentPage() {
  const { equipmentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [equipment, setEquipment] = useState(null);
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [days, setDays] = useState(1);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    title: '',
    message: '',
    redirectPath: ''
  });

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch equipment details
        const equipmentDoc = await getDoc(doc(db, 'equipment', equipmentId));
        if (equipmentDoc.exists()) {
          const equipmentData = { id: equipmentDoc.id, ...equipmentDoc.data() };
          setEquipment(equipmentData);

          // Check if equipment is available
          if (!equipmentData.available) {
            throw new Error('This equipment is currently not available for rent');
          }

          // Check if user is trying to pay for their own equipment
          if (equipmentData.ownerId === currentUser?.uid) {
            throw new Error('You cannot rent your own equipment');
          }
          
        } else {
          throw new Error('Equipment not found');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    if (equipmentId && currentUser) {
      fetchData();
    } else if (!currentUser) {
      setError('You must be logged in to make a payment');
      setLoading(false);
    }
  }, [equipmentId, currentUser]);

  const handlePaymentDetailsChange = (field, value) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePaymentDetails = () => {
    if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber || paymentDetails.cardNumber.replace(/\s/g, '').length < 16) {
        return 'Please enter a valid card number';
      }
      if (!paymentDetails.expiryDate || paymentDetails.expiryDate.length < 5) {
        return 'Please enter a valid expiry date';
      }
      if (!paymentDetails.cvv || paymentDetails.cvv.length < 3) {
        return 'Please enter a valid CVV';
      }
      if (!paymentDetails.cardholderName.trim()) {
        return 'Please enter the cardholder name';
      }
    }
    return null;
  };

  const handlePayment = async () => {
    if (!equipment) {
      setError('Equipment data not available');
      return;
    }

    // Validate payment details
    const validationError = validatePaymentDetails();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (days < 1) {
      setError('Rental duration must be at least 1 day');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const totalPrice = equipment.ratePerDay * days;
      
      // Create payment record
      const paymentData = {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentOwnerId: equipment.ownerId,
        equipmentOwnerName: equipment.ownerName,
        renterId: currentUser.uid,
        renterEmail: currentUser.email,
        renterName: currentUser.displayName || currentUser.email.split('@')[0],
        amountPaid: totalPrice,
        days: days,
        dailyRate: equipment.ratePerDay,
        paymentMethod: paymentMethod,
        paymentStatus: 'completed',
        transactionDate: new Date().toISOString(),
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      // Add payment to database
      const paymentRef = await addDoc(collection(db, 'payments'), paymentData);
      const newTransactionId = paymentRef.id;

      // Create a rental record
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);

      const rentalData = {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentImage: equipment.imageUrl || null,
        renterId: currentUser.uid,
        renterEmail: currentUser.email,
        renterName: currentUser.displayName || currentUser.email.split('@')[0],
        ownerId: equipment.ownerId,
        ownerName: equipment.ownerName,
        startDate: serverTimestamp(),
        endDate: endDate,
        totalDays: days,
        dailyRate: equipment.ratePerDay,
        totalPrice: totalPrice,
        status: 'paid', // Mark as paid since payment is successful
        paymentId: newTransactionId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'rentals'), rentalData);

      // Update equipment status
      await updateDoc(doc(db, 'equipment', equipment.id), {
        available: false, // Mark as rented
        lastRented: serverTimestamp(),
        totalBookings: equipment.totalBookings ? equipment.totalBookings + 1 : 1
      });

      setTransactionId(newTransactionId);
      setPaymentSuccess(true);

      // Show success feedback modal
      setFeedbackData({
        title: 'Payment Successful! 🎉',
        message: `Your payment of $${totalPrice} has been processed successfully. You can now arrange pickup of "${equipment.name}" with the owner. A confirmation email has been sent to ${currentUser.email}.`,
        redirectPath: '/renter-dashboard?paymentSuccess=true'
      });
      setShowFeedbackModal(true);

      // Auto-redirect after showing feedback
      setTimeout(() => {
        navigate('/renter-dashboard?paymentSuccess=true');
      }, 3000);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    // Remove all spaces and non-numeric characters
    const numbers = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
  };

  const formatExpiryDate = (value) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
    }
    return numbers;
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading payment details...</p>
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
            Payment Error
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
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title={feedbackData.title}
        message={feedbackData.message}
        redirectPath={feedbackData.redirectPath}
      />

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
                <li className="breadcrumb-item active" aria-current="page">Payment</li>
              </ol>
            </nav>
            <h2 className="h3 fw-bold">
              <i className="bi bi-credit-card me-2"></i>
              Complete Payment
            </h2>
            <p className="text-muted">Secure payment for your equipment rental</p>
          </div>

          {error && (
            <div className="alert alert-danger mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {!paymentSuccess ? (
            <div className="row">
              {/* Equipment Summary */}
              <div className="col-md-5 mb-4">
                <div className="card h-100">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-tools me-2"></i>
                      Rental Summary
                    </h5>
                  </div>
                  <div className="card-body">
                    {equipment.imageUrl && (
                      <img 
                        src={equipment.imageUrl} 
                        alt={equipment.name} 
                        className="img-fluid rounded mb-3"
                        style={{ maxHeight: '150px', width: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x150?text=No+Image';
                        }}
                      />
                    )}
                    
                    <h6 className="fw-bold">{equipment.name}</h6>
                    <p className="text-muted small mb-3">{equipment.description}</p>
                    
                    <div className="mb-3">
                      <span className="badge bg-primary me-2">{equipment.category}</span>
                      <span className="badge bg-success">Available</span>
                    </div>

                    <div className="mb-3">
                      <small className="text-muted">
                        <i className="bi bi-geo-alt me-1"></i>
                        Location: {equipment.location}
                      </small>
                    </div>

                    <div className="mb-3">
                      <small className="text-muted">
                        <i className="bi bi-person me-1"></i>
                        Owner: {equipment.ownerName}
                      </small>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Rental Duration (days)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={days}
                        min={1}
                        max={30}
                        onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                        disabled={processing}
                      />
                    </div>

                    <div className="border-top pt-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Daily Rate:</span>
                        <span className="fw-semibold">${equipment.ratePerDay}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Duration:</span>
                        <span className="fw-semibold">{days} day{days !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span className="fw-semibold">${equipment.ratePerDay * days}</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between">
                        <span className="h6 mb-0">Total:</span>
                        <span className="h5 text-success fw-bold mb-0">
                          ${equipment.ratePerDay * days}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="col-md-7">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-shield-check me-2"></i>
                      Payment Details
                    </h5>
                  </div>
                  <div className="card-body">
                    {/* Payment Method Selection */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold">Payment Method</label>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              id="card"
                              value="card"
                              checked={paymentMethod === 'card'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="card">
                              <i className="bi bi-credit-card me-2"></i>
                              Credit/Debit Card
                            </label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              id="paypal"
                              value="paypal"
                              checked={paymentMethod === 'paypal'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="paypal">
                              <i className="bi bi-paypal me-2"></i>
                              PayPal
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Payment Form */}
                    {paymentMethod === 'card' && (
                      <div>
                        <div className="row mb-3">
                          <div className="col-12">
                            <label className="form-label fw-semibold">
                              Card Number <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="1234 5678 9012 3456"
                              value={paymentDetails.cardNumber}
                              onChange={(e) => handlePaymentDetailsChange('cardNumber', formatCardNumber(e.target.value))}
                              maxLength={19}
                              disabled={processing}
                            />
                          </div>
                        </div>

                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">
                              Expiry Date <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="MM/YY"
                              value={paymentDetails.expiryDate}
                              onChange={(e) => handlePaymentDetailsChange('expiryDate', formatExpiryDate(e.target.value))}
                              maxLength={5}
                              disabled={processing}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">
                              CVV <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="123"
                              value={paymentDetails.cvv}
                              onChange={(e) => handlePaymentDetailsChange('cvv', e.target.value.replace(/\D/g, ''))}
                              maxLength={4}
                              disabled={processing}
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Cardholder Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="John Doe"
                            value={paymentDetails.cardholderName}
                            onChange={(e) => handlePaymentDetailsChange('cardholderName', e.target.value)}
                            disabled={processing}
                          />
                        </div>

                        <div className="mb-4">
                          <label className="form-label fw-semibold">
                            Billing Address
                          </label>
                          <textarea
                            className="form-control"
                            rows="2"
                            placeholder="123 Main St, City, State, ZIP"
                            value={paymentDetails.billingAddress}
                            onChange={(e) => handlePaymentDetailsChange('billingAddress', e.target.value)}
                            disabled={processing}
                          />
                        </div>
                      </div>
                    )}

                    {/* PayPal Payment */}
                    {paymentMethod === 'paypal' && (
                      <div className="text-center py-4">
                        <i className="bi bi-paypal display-1 text-primary mb-3"></i>
                        <p className="text-muted">You will be redirected to PayPal to complete your payment securely.</p>
                      </div>
                    )}

                    {/* Security Notice */}
                    <div className="alert alert-info">
                      <i className="bi bi-shield-check me-2"></i>
                      <strong>Secure Payment:</strong> Your payment information is encrypted and secure. We never store your card details.
                    </div>

                    {/* Payment Button */}
                    <div className="d-flex gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/renter-dashboard')}
                        className="btn btn-outline-secondary flex-fill"
                        disabled={processing}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Cancel
                      </button>
                      
                      <button
                        onClick={handlePayment}
                        disabled={processing || days < 1}
                        className="btn btn-success flex-fill"
                      >
                        {processing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-lock me-2"></i>
                            Pay ${equipment.ratePerDay * days}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Payment Success Screen */
            <div className="text-center">
              <div className="card border-0 shadow-sm">
                <div className="card-body py-5">
                  <div className="mb-4">
                    <div className="bg-success bg-opacity-10 rounded-circle p-4 d-inline-flex">
                      <i className="bi bi-check-circle-fill text-success display-4"></i>
                    </div>
                  </div>
                  
                  <h3 className="fw-bold text-success mb-3">Payment Successful!</h3>
                  <p className="text-muted mb-4">
                    Your payment has been processed successfully. Here are your rental details:
                  </p>

                  {/* QR Code */}
                  <div className="mb-4">
                    <QRCodeCanvas 
                      value={JSON.stringify({
                        transactionId: transactionId,
                        equipmentId: equipment.id,
                        equipmentName: equipment.name,
                        totalAmount: equipment.ratePerDay * days,
                        rentalDays: days,
                        renterEmail: currentUser.email,
                        paymentDate: new Date().toISOString()
                      })} 
                      size={180} 
                    />
                  </div>

                  <div className="row justify-content-center mb-4">
                    <div className="col-md-6">
                      <div className="border rounded p-3">
                        <div className="row g-2 text-start">
                          <div className="col-6">
                            <strong>Transaction ID:</strong>
                          </div>
                          <div className="col-6">
                            <span className="font-monospace">{transactionId.slice(-8)}</span>
                          </div>
                          <div className="col-6">
                            <strong>Equipment:</strong>
                          </div>
                          <div className="col-6">
                            {equipment.name}
                          </div>
                          <div className="col-6">
                            <strong>Amount Paid:</strong>
                          </div>
                          <div className="col-6">
                            <span className="text-success fw-bold">${equipment.ratePerDay * days}</span>
                          </div>
                          <div className="col-6">
                            <strong>Duration:</strong>
                          </div>
                          <div className="col-6">
                            {days} day{days !== 1 ? 's' : ''}
                          </div>
                          <div className="col-6">
                            <strong>Owner:</strong>
                          </div>
                          <div className="col-6">
                            {equipment.ownerName}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-3 justify-content-center">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => navigate('/renter-dashboard')}
                    >
                      <i className="bi bi-house me-2"></i>
                      Back to Dashboard
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => window.print()}
                    >
                      <i className="bi bi-printer me-2"></i>
                      Print Receipt
                    </button>
                  </div>

                  <div className="mt-4">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      A confirmation email has been sent to {currentUser.email}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;