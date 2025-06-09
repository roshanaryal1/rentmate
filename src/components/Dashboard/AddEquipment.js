// src/components/Dashboard/AddEquipment.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import FeedbackModal from '../FeedbackModal'; // Added FeedbackModal import

function AddEquipment() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false); // Added state for FeedbackModal
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    ratePerDay: '',
    location: '',
    features: '',
    imageUrl: ''
  });

  // Comprehensive categories list
  const categories = [
    'Power Tools',
    'Construction Equipment', 
    'Material Handling',
    'Aerial Equipment',
    'Concrete Equipment',
    'Landscaping',
    'Transportation',
    'Pumps',
    'Excavation',
    'Compaction',
    'Cutting Tools',
    'Air Tools',
    'Power Generation',
    'Cranes',
    'Demolition Tools',
    'Safety Equipment',
    'Welding Equipment',
    'Cleaning Equipment',
    'Surface Preparation',
    'Painting Equipment',
    'Plumbing Tools',
    'Survey Equipment',
    'Hand Tools',
    'Electrical Tools',
    'Automotive Tools',
    'Measuring Tools',
    'Fastening Tools',
    'Garden Tools',
    'Kitchen Equipment',
    'Party & Event',
    'Sports Equipment',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Equipment name is required');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }

    if (!formData.category) {
      setError('Please select a category');
      return false;
    }

    if (!formData.ratePerDay || parseFloat(formData.ratePerDay) <= 0) {
      setError('Please enter a valid rate per day');
      return false;
    }

    if (!formData.location.trim()) {
      setError('Location is required');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      ratePerDay: '',
      location: '',
      features: '',
      imageUrl: ''
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!currentUser) {
      setError('You must be logged in to add equipment');
      return;
    }

    setError('');
    setSuccess('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Adding equipment for user:', currentUser.uid);
      console.log('📝 Form data:', formData);

      // Process features string into array
      const featuresArray = formData.features 
        ? formData.features.split(',').map(f => f.trim()).filter(f => f)
        : [];

      // Create equipment data object
      const equipmentData = {
        // Basic equipment info
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        ratePerDay: parseFloat(formData.ratePerDay),
        location: formData.location.trim(),
        features: featuresArray,
        imageUrl: formData.imageUrl.trim() || null,
        
        // Owner information - THIS IS CRUCIAL!
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || currentUser.email,
        
        // Equipment status
        available: true,
        approvalStatus: 'approved', // or 'pending' if you want admin approval
        
        // Analytics fields
        views: 0,
        bookings: 0,
        totalRevenue: 0,
        rating: 0,
        reviews: 0,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Final equipment data to save:', equipmentData);

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'equipment'), equipmentData);
      
      console.log('✅ Equipment added successfully with ID:', docRef.id);
      
      setSuccess('Equipment added successfully!');
      
      // Reset form
      resetForm();
      
      // Show FeedbackModal instead of immediate redirect
      setShowFeedbackModal(true);
      
    } catch (error) {
      console.error('❌ Error adding equipment:', error);
      setError('Failed to add equipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle FeedbackModal close
  const handleFeedbackModalClose = () => {
    setShowFeedbackModal(false);
    // Optional: redirect to dashboard after modal closes
    // navigate('/owner-dashboard?equipmentAdded=true');
  };

  // Redirect if not logged in
  if (!currentUser) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning text-center">
          <h4>Authentication Required</h4>
          <p>You must be logged in to add equipment.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
                    onClick={() => navigate('/owner-dashboard')}
                  >
                    Owner Dashboard
                  </button>
                </li>
                <li className="breadcrumb-item active">Add Equipment</li>
              </ol>
            </nav>
            
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h1 className="h3 fw-bold mb-1">Add New Equipment 🔧</h1>
                <p className="text-muted mb-0">List your equipment to start earning rental income</p>
              </div>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate('/owner-dashboard')}
                disabled={loading}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

          {/* Form Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              
              {/* Success Alert */}
              {success && (
                <div className="alert alert-success d-flex align-items-center" role="alert">
                  <div className="me-2">✅</div>
                  <div>{success}</div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <div className="me-2">❌</div>
                  <div>{error}</div>
                </div>
              )}

              {/* Debug Info - You can remove this in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="alert alert-info small mb-4">
                  <strong>🐛 Debug Info:</strong><br/>
                  User ID: <code>{currentUser.uid}</code><br/>
                  User Email: <code>{currentUser.email}</code><br/>
                  User Name: <code>{currentUser.displayName || 'Not set'}</code>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Equipment Name */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control form-control-lg"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., DeWalt 18V Cordless Drill"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Description */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      className="form-control"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your equipment, its condition, and what it's best used for..."
                      required
                      disabled={loading}
                    />
                    <div className="form-text">
                      Detailed descriptions help renters understand what they're getting
                    </div>
                  </div>

                  {/* Category and Rate */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Category *
                    </label>
                    <select
                      name="category"
                      className="form-select"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Rate Per Day ($) *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        name="ratePerDay"
                        className="form-control"
                        value={formData.ratePerDay}
                        onChange={handleChange}
                        placeholder="25.00"
                        min="1"
                        step="0.01"
                        required
                        disabled={loading}
                      />
                      <span className="input-group-text">/day</span>
                    </div>
                    <div className="form-text">
                      Set a competitive daily rental rate
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Auckland Central, Wellington CBD, Christchurch"
                      required
                      disabled={loading}
                    />
                    <div className="form-text">
                      Where can renters pick up this equipment?
                    </div>
                  </div>

                  {/* Features */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Features (optional)
                    </label>
                    <input
                      type="text"
                      name="features"
                      className="form-control"
                      value={formData.features}
                      onChange={handleChange}
                      placeholder="e.g., Cordless, LED light, Fast charging, Variable speed"
                      disabled={loading}
                    />
                    <div className="form-text">
                      Separate features with commas. These help your equipment stand out.
                    </div>
                  </div>

                  {/* Image URL */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Image URL (optional)
                    </label>
                    <input
                      type="url"
                      name="imageUrl"
                      className="form-control"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      disabled={loading}
                    />
                    <div className="form-text">
                      Add a photo URL to make your listing more attractive
                    </div>
                    
                    {/* Image Preview */}
                    {formData.imageUrl && (
                      <div className="mt-2">
                        <img 
                          src={formData.imageUrl} 
                          alt="Preview" 
                          className="img-thumbnail"
                          style={{ maxHeight: '100px' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="d-flex gap-3 justify-content-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary px-4"
                        onClick={() => navigate('/owner-dashboard')}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary px-4"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </span>
                            Adding Equipment...
                          </>
                        ) : (
                          <>
                            ✅ Add Equipment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Help Card */}
          <div className="card border-0 bg-light mt-4">
            <div className="card-body">
              <h6 className="card-title">💡 Tips for Better Listings</h6>
              <ul className="list-unstyled mb-0 small">
                <li>• Add clear, high-quality photos</li>
                <li>• Write detailed descriptions including condition</li>
                <li>• Set competitive pricing based on market rates</li>
                <li>• Include all important features and specifications</li>
                <li>• Be specific about pickup location and availability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* FeedbackModal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={handleFeedbackModalClose}
        title="Equipment Added Successfully! 🎉"
        message={`Your equipment "${formData.name || 'equipment'}" has been added to the marketplace and is now available for rent.`}
        redirectPath="/add-equipment"
      />
    </div>
  );
}

export default AddEquipment;