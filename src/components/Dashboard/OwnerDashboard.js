// src/components/Dashboard/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Modal, Button, Tab, Tabs } from 'react-bootstrap';
import './OwnerDashboard.css';

function OwnerDashboard() {
  const { currentUser } = useAuth();
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [activeTab, setActiveTab] = useState('equipment');

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          // Fetch equipment items
          const equipmentQuery = query(
            collection(db, "equipment"),
            where("ownerId", "==", currentUser.uid)
          );
          
          const equipmentSnapshot = await getDocs(equipmentQuery);
          const equipment = [];
          
          equipmentSnapshot.forEach((doc) => {
            equipment.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setEquipmentItems(equipment);
          
          // Fetch active rentals for owner's equipment
          const equipmentIds = equipment.map(item => item.id);
          
          if (equipmentIds.length > 0) {
            const rentalsQuery = query(
              collection(db, "rentals"),
              where("equipmentId", "in", equipmentIds),
              where("status", "==", "active")
            );
            
            const rentalsSnapshot = await getDocs(rentalsQuery);
            const rentals = [];
            
            rentalsSnapshot.forEach((doc) => {
              rentals.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            setActiveRentals(rentals);
          }
        } catch (error) {
          console.error("Error fetching owner data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [currentUser]);

  const handleShowDetails = (equipment) => {
    setSelectedEquipment(equipment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const renderEquipmentSection = () => (
    <div className="equipment-section">
      <div className="section-header">
        <h3 className="text-xl font-semibold mb-4">Your Equipment</h3>
        <Link
          to="/add-equipment"
          className="add-equipment-btn"
        >
          <i className="fas fa-plus-circle me-2"></i>
          Add Equipment
        </Link>
      </div>
      
      {loading ? (
        <div className="loader-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading your equipment...</p>
        </div>
      ) : equipmentItems.length > 0 ? (
        <div className="equipment-grid">
          {equipmentItems.map((item) => (
            <div key={item.id} className="equipment-card">
              <div className="equipment-image">
                <img 
                  src={item.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"} 
                  alt={item.name}
                  className="img-fluid"
                />
                <span className={`status-badge ${item.available ? 'available' : 'unavailable'}`}>
                  {item.available ? 'Available' : 'Rented Out'}
                </span>
              </div>
              <div className="equipment-details">
                <h4 className="equipment-name">{item.name}</h4>
                <p className="equipment-category">{item.category}</p>
                <p className="equipment-rate">${item.ratePerDay}/day</p>
                <div className="equipment-actions">
                  <button 
                    className="details-btn"
                    onClick={() => handleShowDetails(item)}
                  >
                    View Details
                  </button>
                  <Link
                    to={`/equipment/${item.id}`}
                    className="edit-btn"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-equipment">
          <div className="empty-state">
            <img 
              src="/images/empty-equipment.svg" 
              alt="No equipment" 
              className="empty-icon"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/150?text=Empty";
              }}
            />
            <h4>You haven't listed any equipment yet</h4>
            <p>Start earning by listing your equipment for rent</p>
            <Link
              to="/add-equipment"
              className="empty-action-btn"
            >
              Add Your First Equipment
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  const renderRentalsSection = () => (
    <div className="rentals-section">
      <h3 className="text-xl font-semibold mb-4">Active Rentals</h3>
      
      {loading ? (
        <div className="loader-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading active rentals...</p>
        </div>
      ) : activeRentals.length > 0 ? (
        <div className="rentals-list">
          {activeRentals.map((rental) => (
            <div key={rental.id} className="rental-card">
              <div className="rental-info">
                <div className="rental-primary">
                  <h4>{rental.equipmentName}</h4>
                  <span className="rental-dates">
                    Until {new Date(rental.endDate.toDate()).toLocaleDateString()}
                  </span>
                </div>
                <div className="rental-secondary">
                  <p>Rented by: {rental.renterName}</p>
                  <p className="rental-price">${rental.totalPrice}</p>
                </div>
              </div>
              <div className="rental-actions">
                <button className="contact-btn">Contact Renter</button>
                <button className="track-btn">Track Equipment</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-rentals">
          <div className="empty-state">
            <img 
              src="/images/no-rentals.svg" 
              alt="No rentals" 
              className="empty-icon"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/150?text=No+Rentals";
              }}
            />
            <h4>No active rentals at the moment</h4>
            <p>Your equipment is available for rent</p>
          </div>
        </div>
      )}
    </div>
  );

  // Equipment detail modal
  const renderEquipmentModal = () => {
    if (!selectedEquipment) return null;
    
    return (
      <Modal 
        show={showModal} 
        onHide={handleCloseModal} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedEquipment.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="equipment-modal-content">
            <div className="equipment-modal-image">
              <img 
                src={selectedEquipment.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"} 
                alt={selectedEquipment.name}
                className="img-fluid rounded"
              />
            </div>
            <div className="equipment-modal-details">
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{selectedEquipment.category}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Daily Rate:</span>
                <span className="detail-value">${selectedEquipment.ratePerDay}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status-text ${selectedEquipment.available ? 'text-success' : 'text-danger'}`}>
                  {selectedEquipment.available ? 'Available' : 'Rented Out'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <p className="detail-value description">
                  {selectedEquipment.description || "No description provided."}
                </p>
              </div>
              
              {selectedEquipment.features && selectedEquipment.features.length > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Features:</span>
                  <ul className="features-list">
                    {selectedEquipment.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Link 
            to={`/equipment/${selectedEquipment.id}/edit`} 
            className="btn btn-primary"
          >
            Edit Equipment
          </Link>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Owner Dashboard</h2>
          <p className="dashboard-subtitle">
            Manage your equipment and track rentals from one place
          </p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-number">{equipmentItems.length}</span>
            <span className="stat-label">Equipment Items</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{activeRentals.length}</span>
            <span className="stat-label">Active Rentals</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              ${activeRentals.reduce((sum, rental) => sum + rental.totalPrice, 0)}
            </span>
            <span className="stat-label">Current Earnings</span>
          </div>
        </div>
      </div>
      
      <div className="dashboard-navigation">
        <Tabs
          activeKey={activeTab}
          onSelect={(key) => setActiveTab(key)}
          className="dashboard-tabs"
        >
          <Tab eventKey="equipment" title="Equipment">
            {renderEquipmentSection()}
          </Tab>
          <Tab eventKey="rentals" title="Active Rentals">
            {renderRentalsSection()}
          </Tab>
          <Tab eventKey="history" title="Rental History">
            <div className="rental-history-section">
              <h3 className="text-xl font-semibold mb-4">Rental History</h3>
              <p>View your past equipment rentals and earnings.</p>
              <Link
                to="/rental-history"
                className="view-history-btn"
              >
                View Full History
              </Link>
            </div>
          </Tab>
        </Tabs>
      </div>
      
      <div className="dashboard-quick-links">
        <div className="quick-link-card">
          <h3 className="card-title">Account Settings</h3>
          <p className="card-description">Update your profile information and preferences.</p>
          <Link
            to="/account-settings"
            className="card-link"
          >
            Edit Settings
          </Link>
        </div>
        
        <div className="quick-link-card">
          <h3 className="card-title">Earnings Report</h3>
          <p className="card-description">View detailed financial reports and analytics.</p>
          <Link
            to="/earnings-report"
            className="card-link"
          >
            View Report
          </Link>
        </div>
      </div>
      
      {renderEquipmentModal()}
    </div>
  );
}

export default OwnerDashboard;