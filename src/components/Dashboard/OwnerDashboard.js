// src/components/Dashboard/OwnerDashboard.js - Updated with Rental Approval Integration
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { equipmentService } from '../../services/equipmentService';
import FeedbackModal from '../FeedbackModal';
import RentalApprovalSystem from '../Rental/RentalApprovalSystem';
import './OwnerDashboard.css';

function OwnerDashboard() {
  const { currentUser } = useAuth();
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalEquipment: 0,
    availableEquipment: 0,
    rentedEquipment: 0,
    totalEarnings: 0,
    pendingRequests: 0
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('equipmentAdded') === 'true') {
      setShowFeedback(true);
      navigate('/owner-dashboard', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        
        // Fetch equipment
        const equipment = await equipmentService.getEquipmentForOwner(currentUser.uid);
        setEquipmentItems(equipment);
        
        const totalEquipment = equipment.length;
        const availableEquipment = equipment.filter(item => item.available).length;
        const rentedEquipment = equipment.filter(item => !item.available).length;
        const equipmentIds = equipment.map(item => item.id);
        
        let rentals = [];
        let totalEarnings = 0;
        let pendingRequestsCount = 0;

        if (equipmentIds.length > 0) {
          // Fetch rentals in chunks due to Firebase 'in' query limitation
          const chunks = [];
          for (let i = 0; i < equipmentIds.length; i += 10) {
            chunks.push(equipmentIds.slice(i, i + 10));
          }

          for (const chunk of chunks) {
            // Active rentals
            const activeRentalsQuery = query(
              collection(db, "rentals"),
              where("equipmentId", "in", chunk),
              where("status", "==", "approved")
            );
            const activeRentalsSnapshot = await getDocs(activeRentalsQuery);
            activeRentalsSnapshot.forEach(doc => rentals.push({ id: doc.id, ...doc.data() }));

            // Pending requests
            const pendingQuery = query(
              collection(db, "rentals"),
              where("equipmentId", "in", chunk),
              where("status", "==", "pending")
            );
            const pendingSnapshot = await getDocs(pendingQuery);
            pendingRequestsCount += pendingSnapshot.size;

            // All rentals for earnings calculation
            const allRentalsQuery = query(
              collection(db, "rentals"),
              where("equipmentId", "in", chunk)
            );
            const allRentalsSnapshot = await getDocs(allRentalsQuery);
            allRentalsSnapshot.forEach(doc => {
              const rental = doc.data();
              if (rental.status === 'completed') {
                totalEarnings += rental.totalPrice || 0;
              }
            });
          }
        }

        setActiveRentals(rentals);
        setStats({ 
          totalEquipment, 
          availableEquipment, 
          rentedEquipment, 
          totalEarnings,
          pendingRequests: pendingRequestsCount
        });
        
      } catch (error) {
        console.error("Error fetching owner data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleCloseFeedback = () => setShowFeedback(false);
  const handleViewDetails = (equipment) => {
    setSelectedEquipment(equipment);
    setShowEquipmentModal(true);
  };
  const handleCloseModal = () => {
    setShowEquipmentModal(false);
    setSelectedEquipment(null);
  };
  const formatDate = (dateObj) => dateObj?.toDate?.().toLocaleDateString() || 'Unknown';

  return (
    <div className="owner-dashboard">
      <FeedbackModal 
        isOpen={showFeedback}
        onClose={handleCloseFeedback}
        title="Equipment Added Successfully! 🎉"
        message="Your equipment has been listed and is now available for rent. You can track its performance and manage bookings from this dashboard."
      />

      {showEquipmentModal && selectedEquipment && (
        <EquipmentModal equipment={selectedEquipment} onClose={handleCloseModal} />
      )}

      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Equipment Owner Dashboard</h2>
          <p className="dashboard-subtitle">Manage your equipment listings and rental requests.</p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.totalEquipment}</span>
            <span className="stat-label">Total Equipment</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.availableEquipment}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.rentedEquipment}</span>
            <span className="stat-label">Rented Out</span>
          </div>
          <div className="stat-card">
            <span className="stat-number" style={{color: stats.pendingRequests > 0 ? '#f59e0b' : '#3b82f6'}}>
              {stats.pendingRequests}
            </span>
            <span className="stat-label">Pending Requests</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">${stats.totalEarnings}</span>
            <span className="stat-label">Total Earnings</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <nav className="nav nav-tabs">
          <button 
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-house-door me-2"></i>
            Overview
          </button>
          <button 
            className={`nav-link ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            <i className="bi bi-check-circle me-2"></i>
            Rental Requests
            {stats.pendingRequests > 0 && (
              <span className="badge bg-warning text-dark ms-2">{stats.pendingRequests}</span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Quick Actions */}
          <div className="section-header">
            <h3>Quick Actions</h3>
            <Link to="/add-equipment" className="btn-blue">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Equipment
            </Link>
          </div>

          {/* Equipment Section */}
          <div className="mt-6">
            <div className="section-header mb-4">
              <h4>Your Equipment ({equipmentItems.length})</h4>
              <Link to="/equipment-analytics" className="btn-blue btn-sm">
                <i className="bi bi-graph-up me-1"></i>
                Analytics
              </Link>
            </div>

            {loading ? (
              <div className="loader-container">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading your equipment...</p>
              </div>
            ) : equipmentItems.length > 0 ? (
              <div className="equipment-grid">
                {equipmentItems.map(item => (
                  <div key={item.id} className="equipment-card">
                    <div className="equipment-image">
                      <img src={item.imageUrl || 'https://via.placeholder.com/300x180?text=No+Image'} alt={item.name} />
                      <div className={`status-badge ${item.available ? 'available' : 'unavailable'}`}>
                        {item.available ? 'Available' : 'Rented Out'}
                      </div>
                    </div>
                    <div className="equipment-details">
                      <h5 className="equipment-name">{item.name}</h5>
                      <p className="equipment-category">{item.category}</p>
                      <p className="equipment-rate">${item.ratePerDay}/day</p>
                      <div className="equipment-actions">
                        <button className="btn-blue" onClick={() => handleViewDetails(item)}>View Details</button>
                        <Link to={`/edit-equipment/${item.id}`} className="btn-blue">Edit</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-tools empty-icon text-muted"></i>
                <h4>No Equipment Listed Yet</h4>
                <p>Start earning rental income by listing your first piece of equipment.</p>
                <Link to="/add-equipment" className="btn-blue mt-3">
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Your First Equipment
                </Link>
              </div>
            )}
          </div>

          {/* Active Rentals Section */}
          <div className="mt-8">
            <h4 className="mb-4">Active Rentals ({activeRentals.length})</h4>
            {loading ? (
              <div className="loader-container">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading active rentals...</p>
              </div>
            ) : activeRentals.length > 0 ? (
              <div className="rentals-list">
                {activeRentals.map(rental => (
                  <div key={rental.id} className="rental-card">
                    <div className="rental-info">
                      <div className="rental-primary">
                        <h4>{rental.equipmentName}</h4>
                        <div className="rental-dates">{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</div>
                      </div>
                      <div className="rental-secondary">
                        <span>Rented by: {rental.renterName || rental.renterEmail}</span>
                        <span className="rental-price">${rental.totalPrice}</span>
                      </div>
                    </div>
                    <div className="rental-actions">
                      <button className="btn-blue">
                        <i className="bi bi-chat-dots me-1"></i>
                        Contact Renter
                      </button>
                      <button className="btn-blue">
                        <i className="bi bi-geo-alt me-1"></i>
                        Track Equipment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-calendar-x text-muted fs-1"></i>
                <h5 className="mt-3">No Active Rentals</h5>
                <p className="text-muted">Your equipment rentals will appear here when someone books them.</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="dashboard-quick-links">
            <div className="quick-link-card">
              <h5 className="card-title">Rental History</h5>
              <p className="card-description">View past rentals and income from your equipment.</p>
              <Link to="/rental-history" className="btn-blue">View History →</Link>
            </div>
            <div className="quick-link-card">
              <h5 className="card-title">Equipment Analytics</h5>
              <p className="card-description">Track performance metrics and optimize your listings.</p>
              <Link to="/equipment-analytics" className="btn-blue">View Analytics →</Link>
            </div>
            <div className="quick-link-card">
              <h5 className="card-title">Account Settings</h5>
              <p className="card-description">Update your profile information and preferences.</p>
              <Link to="/account-settings" className="btn-blue">Edit Settings →</Link>
            </div>
          </div>
        </div>
      )}

      {/* Rental Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="mt-4">
          <RentalApprovalSystem />
        </div>
      )}
    </div>
  );
}

function EquipmentModal({ equipment, onClose }) {
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{equipment.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="equipment-modal-content">
              {equipment.imageUrl && (
                <div className="equipment-modal-image">
                  <img src={equipment.imageUrl} alt={equipment.name} className="img-fluid rounded" />
                </div>
              )}
              <div className="equipment-modal-details">
                <div className="detail-row"><span className="detail-label">Category:</span><span className="detail-value">{equipment.category}</span></div>
                <div className="detail-row"><span className="detail-label">Rate:</span><span className="detail-value">${equipment.ratePerDay}/day</span></div>
                <div className="detail-row"><span className="detail-label">Status:</span><span className={`detail-value status-text ${equipment.available ? 'text-success' : 'text-danger'}`}>{equipment.available ? 'Available' : 'Rented Out'}</span></div>
                <div className="detail-row"><span className="detail-label">Location:</span><span className="detail-value">{equipment.location}</span></div>
                {equipment.description && <div className="detail-row"><span className="detail-label">Description:</span><div className="detail-value description">{equipment.description}</div></div>}
                {equipment.features && equipment.features.length > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Features:</span>
                    <ul className="detail-value features-list">
                      {equipment.features.map((feature, index) => (<li key={index}>{feature}</li>))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-blue" onClick={onClose}>Close</button>
            <Link to={`/edit-equipment/${equipment.id}`} className="btn-blue" onClick={onClose}>
              <i className="bi bi-pencil me-1"></i> Edit Equipment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;