import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import EquipmentDetailModal from '../Equipment/EquipmentDetailModal';

function RenterDashboard() {
  const { currentUser } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    
    totalRentals: 0,
    activeRentals: 0,
    totalSpent: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch ALL equipment from Firebase (added by owners through Add Equipment page)
        console.log('🔍 Fetching ALL equipment for renter dashboard...');
        try {
          const equipmentSnapshot = await getDocs(collection(db, 'equipment'));
          const equipment = equipmentSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Ensure all required fields exist with defaults
              name: data.name || 'Unnamed Equipment',
              description: data.description || 'No description available',
              category: data.category || 'Other',
              ratePerDay: data.ratePerDay || 0,
              available: data.available !== undefined ? data.available : true,
              ownerName: data.ownerName || 'Unknown Owner',
              location: data.location || 'Location not specified',
              features: data.features || [],
              imageUrl: data.imageUrl || null,
              status: data.status || 'approved',
              createdAt: data.createdAt || null,
              views: data.views || 0,
              rentals: data.rentals || 0,
              rating: data.rating || null
            };
          });
          
          console.log('✅ Fetched equipment from Firebase:', equipment.length, 'items');
          
          // Filter to show only approved equipment
          const approvedEquipment = equipment.filter(item => item.status === 'approved');
          
          setEquipmentList(approvedEquipment);
          
          // If no equipment found, show a message
          if (approvedEquipment.length === 0) {
            console.log('ℹ️ No approved equipment found in Firebase');
          } else {
            console.log(`✅ Showing ${approvedEquipment.length} approved equipment items`);
          }
        } catch (error) {
          console.error('❌ Error fetching equipment from Firebase:', error);
          // On error, set empty array - this will show "no equipment" message
          setEquipmentList([]);
        }

        // Fetch rental history for current user
        if (currentUser) {
          try {
            const rentalsQuery = query(
              collection(db, 'rentals'),
              where('renterId', '==', currentUser.uid),
              orderBy('createdAt', 'desc')
            );
            
            const rentalsSnapshot = await getDocs(rentalsQuery);
            const rentals = rentalsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setRentalHistory(rentals);
            
            // Calculate stats
            const totalRentals = rentals.length;
            const activeRentals = rentals.filter(r => r.status === 'active').length;
            const totalSpent = rentals.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
            
            setStats({ totalRentals, activeRentals, totalSpent });
            console.log(`✅ Loaded ${totalRentals} rental records`);
          } catch (error) {
            console.log('ℹ️ No rentals found or error fetching rentals:', error);
            // Use sample rental data if Firebase fails
            const sampleRentals = [
              {
                id: 'rental-1',
                equipmentName: 'Power Drill (Cordless, 18V)',
                status: 'completed',
                startDate: { toDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                endDate: { toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
                totalPrice: 125,
                ownerName: 'Tool Rental Pro'
              }
            ];
            setRentalHistory(sampleRentals);
            setStats({ totalRentals: 1, activeRentals: 0, totalSpent: 125 });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching renter dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Filter and sort equipment
  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesAvailability = !showAvailableOnly || item.available;
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const categories = [...new Set(equipmentList.map(item => item.category))];

  const formatDate = (dateObj) => {
    if (!dateObj || !dateObj.toDate) return 'Unknown';
    return dateObj.toDate().toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const badgeClass = {
      'active': 'badge bg-success',
      'completed': 'badge bg-primary', 
      'pending': 'badge bg-warning',
      'cancelled': 'badge bg-danger'
    };
    
    return (
      <span className={badgeClass[status] || 'badge bg-secondary'}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const handleViewDetails = (equipment) => {
    setSelectedEquipment(equipment);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedEquipment(null);
  };

  return (
    <div className="container-fluid py-4">
      {/* Equipment Detail Modal */}
      <EquipmentDetailModal
        equipment={selectedEquipment}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        currentUserId={currentUser?.uid}
      />

      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col">
          <h2 className="h3 fw-bold text-dark mb-1">
            Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0]}!
          </h2>
          <p className="text-muted mb-0">Browse all available equipment and manage your rentals.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-primary bg-opacity-10 rounded-3 me-3">
                  <i className="bi bi-box text-primary fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small">Available Equipment</h6>
                  <h3 className="mb-0 fw-bold">{equipmentList.filter(item => item.available).length}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-success bg-opacity-10 rounded-3 me-3">
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small">My Active Rentals</h6>
                  <h3 className="mb-0 fw-bold">{stats.activeRentals}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-warning bg-opacity-10 rounded-3 me-3">
                  <i className="bi bi-currency-dollar text-warning fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 small">Total Spent</h6>
                  <h3 className="mb-0 fw-bold">${stats.totalSpent}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="row mb-4">
        <div className="col">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link fw-semibold ${activeTab === 'browse' ? 'active' : ''}`}
                onClick={() => setActiveTab('browse')}
              >
                <i className="bi bi-search me-2"></i>
                Browse All Equipment ({equipmentList.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link fw-semibold ${activeTab === 'rentals' ? 'active' : ''}`}
                onClick={() => setActiveTab('rentals')}
              >
                <i className="bi bi-calendar me-2"></i>
                My Rentals ({stats.totalRentals})
                {stats.activeRentals > 0 && (
                  <span className="badge bg-primary ms-2">{stats.activeRentals}</span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Browse Equipment Tab */}
      {activeTab === 'browse' && (
        <div>
          {/* Search and Filter */}
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <div className="form-check mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="availableOnly"
                  checked={showAvailableOnly}
                  onChange={e => setShowAvailableOnly(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="availableOnly">
                  Available only
                </label>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="row mb-3">
            <div className="col">
              <small className="text-muted">
                Showing {filteredEquipment.length} of {equipmentList.length} equipment items
                {searchTerm && <span> for "{searchTerm}"</span>}
              </small>
            </div>
          </div>

          {/* Equipment Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">Loading available equipment...</p>
            </div>
          ) : filteredEquipment.length > 0 ? (
            <div className="row">
              {filteredEquipment.map(item => (
                <div key={item.id} className="col-md-6 col-lg-4 mb-4">
                  <EquipmentCard 
                    item={item} 
                    currentUserId={currentUser?.uid} 
                    onViewDetails={handleViewDetails}
                  />
                </div>
              ))}
            </div>
          ) : equipmentList.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-tools display-1 text-muted mb-3"></i>
              <h5>No Equipment Available</h5>
              <p className="text-muted mb-4">
                No equipment has been added yet. Equipment owners can list their equipment to make it available for rent.
              </p>
              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <i className="bi bi-info-circle me-2"></i>
                  Want to List Equipment?
                </h6>
                <p className="mb-2">Have equipment to rent out? You can:</p>
                <ul className="mb-3 text-start">
                  <li>Switch to Owner role in your account</li>
                  <li>Add your equipment through the "Add Equipment" page</li>
                  <li>Start earning rental income today!</li>
                </ul>
                <Link to="/add-equipment" className="btn btn-primary btn-sm">
                  <i className="bi bi-plus-circle me-1"></i>
                  Add Equipment
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-search display-1 text-muted"></i>
              <h5 className="mt-3">No equipment found</h5>
              <p className="text-muted">Try adjusting your search or filters.</p>
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setShowAvailableOnly(true);
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* My Rentals Tab */}
      {activeTab === 'rentals' && (
        <div>
          <div className="row mb-4">
            <div className="col">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">My Rentals ({rentalHistory.length})</h5>
                <Link to="/rental-history" className="btn btn-outline-primary btn-sm">
                  <i className="bi bi-clock-history me-1"></i>
                  View Full History
                </Link>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">Loading rentals...</p>
            </div>
          ) : rentalHistory.length > 0 ? (
            <div className="row">
              {rentalHistory.map(rental => (
                <div key={rental.id} className="col-lg-6 mb-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="mb-1 fw-semibold">{rental.equipmentName}</h6>
                          <small className="text-muted">From: {rental.ownerName}</small>
                        </div>
                        {getStatusBadge(rental.status)}
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex align-items-center text-muted small mb-1">
                          <i className="bi bi-calendar me-2"></i>
                          {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-currency-dollar me-2 text-success"></i>
                          <span className="fw-bold text-success">${rental.totalPrice}</span>
                        </div>
                      </div>
                      
                      <div className="d-flex gap-2">
                        <Link
                          to={`/rental-details/${rental.id}`}
                          className="btn btn-outline-primary btn-sm flex-grow-1"
                        >
                          View Details
                        </Link>
                        {rental.status === 'completed' && (
                          <Link
                            to={`/review/${rental.id}`}
                            className="btn btn-warning btn-sm"
                          >
                            <i className="bi bi-star me-1"></i>
                            Review
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-box display-1 text-muted"></i>
                <h5 className="mt-3">No rentals yet</h5>
                <p className="text-muted mb-4">Start browsing equipment to make your first rental.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('browse')}
                >
                  Browse Equipment
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EquipmentCard({ item, currentUserId, onViewDetails }) {
  // Show if this equipment belongs to the current user
  const isOwnEquipment = item.ownerId === currentUserId;
  
  return (
    <div className="card h-100 border-0 shadow-sm">
      <div style={{ height: '200px', position: 'relative', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="card-img-top"
            style={{ height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100">
            <i className="bi bi-tools display-4 text-muted"></i>
          </div>
        )}
        <div className="position-absolute top-0 end-0 m-2">
          <span className={`badge ${item.available ? 'bg-success' : 'bg-danger'}`}>
            {item.available ? 'Available' : 'Unavailable'}
          </span>
          {isOwnEquipment && (
            <span className="badge bg-info ms-1">Your Equipment</span>
          )}
        </div>
      </div>
      
      <div className="card-body d-flex flex-column">
        <div className="flex-grow-1">
          <h6 className="card-title mb-2">{item.name}</h6>
          <span className="badge bg-primary mb-2 small">{item.category}</span>
          <p className="card-text text-muted small mb-3" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {item.description}
          </p>
        </div>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="h5 text-success fw-bold">${item.ratePerDay}</span>
              <small className="text-muted">/day</small>
            </div>
            <div className="d-flex align-items-center text-muted small">
              <i className="bi bi-eye me-1"></i>
              <span>{item.views || 0}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="h5 text-success fw-bold">${item.ratePerDay}</span>
              <small className="text-muted">/day</small>
            </div>
            <div className="d-flex align-items-center text-muted small">
              <i className="bi bi-eye me-1"></i>
              <span>{item.views || 0}</span>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-info btn-sm"
              onClick={() => onViewDetails(item)}
              title="View Equipment Details"
            >
              <i className="bi bi-info-circle"></i>
            </button>
            
            {item.available && !isOwnEquipment ? (
              <Link
                to={`/rent/${item.id}`}
                className="btn btn-primary btn-sm flex-fill"
              >
                Rent Now
              </Link>
            ) : isOwnEquipment ? (
              <Link
                to={`/edit-equipment/${item.id}`}
                className="btn btn-outline-secondary btn-sm flex-fill"
              >
                Edit
              </Link>
            ) : (
              <button className="btn btn-secondary btn-sm flex-fill" disabled>
                Unavailable
              </button>
            )}
          </div>
          
          <div className="text-muted small mt-2">
            <div className="d-flex align-items-center">
              <i className="bi bi-geo-alt me-1"></i>
              <span>{item.location}</span>
            </div>
            <div className="d-flex align-items-center mt-1">
              <i className="bi bi-person me-1"></i>
              <span>{isOwnEquipment ? 'Your Equipment' : item.ownerName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RenterDashboard;