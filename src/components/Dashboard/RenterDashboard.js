import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import EquipmentDetailModal from '../Equipment/EquipmentDetailModal';

function RenterDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [equipmentList, setEquipmentList] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    totalRentals: 0,
    activeRentals: 0,
    totalSpent: 0,
    availableEquipment: 0
  });

  // Check if user has access to personal tabs
  const hasPersonalAccess = currentUser !== null;

  // Redirect to browse tab if user is not authenticated and tries to access personal tabs
  useEffect(() => {
    if (!hasPersonalAccess && activeTab === 'rentals') {
      setActiveTab('browse');
    }
  }, [hasPersonalAccess, activeTab]);

  // Fetch all data from Firebase
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch ALL equipment from Firebase (always accessible)
        console.log('🔍 Starting to fetch equipment from Firebase...');
        
        const equipmentSnapshot = await getDocs(collection(db, 'equipment'));
        console.log(`📊 Raw Firebase response: ${equipmentSnapshot.docs.length} total documents`);
        
        const allEquipment = equipmentSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`📋 Equipment ${doc.id}:`, {
            name: data.name,
            status: data.status,
            approvalStatus: data.approvalStatus,
            available: data.available,
            ownerId: data.ownerId
          });
          return {
            id: doc.id,
            ...data
          };
        });

        console.log(`📦 Total equipment fetched: ${allEquipment.length}`);
        setEquipmentList(allEquipment);
        
        // Update available equipment count for stats
        const availableCount = allEquipment.filter(item => item.available).length;
        
        // 2. Fetch rental history only if user is authenticated
        let userRentals = [];
        let calculatedStats = {
          totalRentals: 0,
          activeRentals: 0,
          totalSpent: 0,
          availableEquipment: availableCount
        };

        if (currentUser) {
          try {
            const rentalsQuery = query(
              collection(db, 'rentals'),
              where('renterId', '==', currentUser.uid)
            );
            
            const rentalsSnapshot = await getDocs(rentalsQuery);
            userRentals = rentalsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Calculate real stats for authenticated users
            calculatedStats = {
              totalRentals: userRentals.length,
              activeRentals: userRentals.filter(r => r.status === 'active' || r.status === 'approved').length,
              totalSpent: userRentals.reduce((sum, r) => sum + (r.totalPrice || r.totalCost || 0), 0),
              availableEquipment: availableCount
            };

            console.log(`✅ Loaded ${userRentals.length} user rentals`);
          } catch (error) {
            console.log('ℹ️ Error fetching rentals or no rentals found:', error);
          }
        }

        setRentalHistory(userRentals);
        setStats(calculatedStats);

      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        setEquipmentList([]);
        setStats({
          totalRentals: 0,
          activeRentals: 0,
          totalSpent: 0,
          availableEquipment: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [currentUser]);

  // Get unique categories from equipment
  const categories = [...new Set(equipmentList.map(item => item.category))].filter(Boolean);

  // Filter equipment based on search and filters
  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    const matchesPrice = priceRange === 'all' || 
      (priceRange === 'low' && item.ratePerDay <= 50) ||
      (priceRange === 'medium' && item.ratePerDay > 50 && item.ratePerDay <= 150) ||
      (priceRange === 'high' && item.ratePerDay > 150);
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  console.log(`📊 Filtering results: ${filteredEquipment.length} of ${equipmentList.length} items shown`);

  const formatDate = (dateObj) => {
    if (!dateObj) return 'Unknown';
    if (dateObj.toDate) return dateObj.toDate().toLocaleDateString();
    if (dateObj.seconds) return new Date(dateObj.seconds * 1000).toLocaleDateString();
    return new Date(dateObj).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { class: 'bg-success', text: 'Active' },
      'approved': { class: 'bg-success', text: 'Active' },
      'completed': { class: 'bg-primary', text: 'Completed' },
      'pending': { class: 'bg-warning text-dark', text: 'Pending' },
      'cancelled': { class: 'bg-danger', text: 'Cancelled' },
      'rejected': { class: 'bg-secondary', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', text: 'Unknown' };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const handleViewDetails = (equipment) => {
    setSelectedEquipment(equipment);
    setShowDetailModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setPriceRange('all');
  };

  // Handle actions that require authentication
  const handleAuthRequiredAction = (action, equipmentId = null) => {
    if (!currentUser) {
      // Store intended action for after login
      localStorage.setItem('pendingAction', JSON.stringify({ action, equipmentId }));
      navigate('/login');
      return;
    }
    
    // User is authenticated, proceed with action
    switch (action) {
      case 'rent':
        navigate(`/rent/${equipmentId}`);
        break;
      case 'favorites':
        navigate('/favorites');
        break;
      case 'rental-history':
        navigate('/rental-history');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
      <div className="container-fluid py-4">
        {/* Equipment Detail Modal */}
        <EquipmentDetailModal
          equipment={selectedEquipment}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          currentUserId={currentUser?.uid}
        />

        {/* Header */}
        <div className="row mb-4">
          <div className="col">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 fw-bold text-dark mb-1">
                  {currentUser ? (
                    <>Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0]}! 👋</>
                  ) : (
                    <>Discover Amazing Equipment 🔧</>
                  )}
                </h1>
                <p className="text-muted mb-0">
                  {currentUser ? (
                    'Discover and rent equipment from trusted owners in your area'
                  ) : (
                    'Browse thousands of tools and equipment available for rent near you'
                  )}
                </p>
              </div>
              <div className="d-flex gap-2">
                {currentUser ? (
                  <>
                    <button 
                      onClick={() => handleAuthRequiredAction('rental-history')}
                      className="btn btn-outline-primary"
                    >
                      <i className="bi bi-clock-history me-2"></i>
                      Rental History
                    </button>
                    <button 
                      onClick={() => handleAuthRequiredAction('favorites')}
                      className="btn btn-outline-success"
                    >
                      <i className="bi bi-heart me-2"></i>
                      Favorites
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-outline-primary">
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Log In
                    </Link>
                    <Link to="/signup" className="btn btn-primary">
                      <i className="bi bi-person-plus me-2"></i>
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="row mb-5">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h3 className="fw-bold mb-1">{stats.availableEquipment}</h3>
                    <p className="mb-0 opacity-75">Available Equipment</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-3">
                    <i className="bi bi-tools fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {currentUser ? (
            <>
              <div className="col-lg-3 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <div className="card-body text-white">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h3 className="fw-bold mb-1">{stats.activeRentals}</h3>
                        <p className="mb-0 opacity-75">Active Rentals</p>
                      </div>
                      <div className="bg-white bg-opacity-20 p-3 rounded-3">
                        <i className="bi bi-check-circle fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <div className="card-body text-white">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h3 className="fw-bold mb-1">{stats.totalRentals}</h3>
                        <p className="mb-0 opacity-75">Total Rentals</p>
                      </div>
                      <div className="bg-white bg-opacity-20 p-3 rounded-3">
                        <i className="bi bi-archive fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                  <div className="card-body text-white">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h3 className="fw-bold mb-1">${stats.totalSpent}</h3>
                        <p className="mb-0 opacity-75">Total Spent</p>
                      </div>
                      <div className="bg-white bg-opacity-20 p-3 rounded-3">
                        <i className="bi bi-currency-dollar fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="col-lg-3 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <div className="card-body text-white">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h3 className="fw-bold mb-1">Easy</h3>
                        <p className="mb-0 opacity-75">Browse & Rent</p>
                      </div>
                      <div className="bg-white bg-opacity-20 p-3 rounded-3">
                        <i className="bi bi-search fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <div className="card-body text-white">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h3 className="fw-bold mb-1">Trusted</h3>
                        <p className="mb-0 opacity-75">Verified Owners</p>
                      </div>
                      <div className="bg-white bg-opacity-20 p-3 rounded-3">
                        <i className="bi bi-shield-check fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                  <div className="card-body text-white">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h3 className="fw-bold mb-1">Affordable</h3>
                        <p className="mb-0 opacity-75">Great Prices</p>
                      </div>
                      <div className="bg-white bg-opacity-20 p-3 rounded-3">
                        <i className="bi bi-currency-dollar fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="row mb-4">
          <div className="col">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                <nav className="nav nav-pills nav-fill">
                  <button 
                    className={`nav-link py-3 border-0 fw-semibold ${activeTab === 'browse' ? 'active' : ''}`}
                    onClick={() => setActiveTab('browse')}
                  >
                    <i className="bi bi-search me-2"></i>
                    Browse Equipment ({filteredEquipment.length})
                  </button>
                  {hasPersonalAccess && (
                    <button 
                      className={`nav-link py-3 border-0 fw-semibold ${activeTab === 'rentals' ? 'active' : ''}`}
                      onClick={() => setActiveTab('rentals')}
                    >
                      <i className="bi bi-calendar me-2"></i>
                      My Rentals ({stats.totalRentals})
                      {stats.activeRentals > 0 && (
                        <span className="badge bg-success ms-2">{stats.activeRentals}</span>
                      )}
                    </button>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Browse Equipment Tab */}
        {activeTab === 'browse' && (
          <div>
            {/* Search and Filters */}
            <div className="row mb-4">
              <div className="col">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="input-group input-group-lg">
                          <span className="input-group-text border-0 bg-light">
                            <i className="bi bi-search text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-0 bg-light"
                            placeholder="Search for tools, equipment, machinery..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <select
                          className="form-select form-select-lg border-0 bg-light"
                          value={selectedCategory}
                          onChange={e => setSelectedCategory(e.target.value)}
                        >
                          <option value="all">All Categories</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <select
                          className="form-select form-select-lg border-0 bg-light"
                          value={priceRange}
                          onChange={e => setPriceRange(e.target.value)}
                        >
                          <option value="all">All Prices</option>
                          <option value="low">$0 - $50</option>
                          <option value="medium">$51 - $150</option>
                          <option value="high">$151+</option>
                        </select>
                      </div>
                      <div className="col-md-1">
                        <button 
                          className="btn btn-outline-secondary btn-lg w-100"
                          onClick={clearFilters}
                          title="Clear all filters"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment Results */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="mt-3">Loading equipment...</h5>
                <p className="text-muted">Fetching the latest available equipment for you</p>
              </div>
            ) : filteredEquipment.length > 0 ? (
              <>
                {/* Results Summary */}
                <div className="row mb-3">
                  <div className="col">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">
                        Showing {filteredEquipment.length} of {equipmentList.length} available equipment
                      </span>
                      <div className="dropdown">
                        <button className="btn btn-outline-secondary dropdown-toggle btn-sm" type="button" data-bs-toggle="dropdown">
                          Sort by: Price Low to High
                        </button>
                        <ul className="dropdown-menu">
                          <li><a className="dropdown-item" href="#">Price: Low to High</a></li>
                          <li><a className="dropdown-item" href="#">Price: High to Low</a></li>
                          <li><a className="dropdown-item" href="#">Newest First</a></li>
                          <li><a className="dropdown-item" href="#">Most Popular</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Equipment Grid */}
                <div className="row">
                  {filteredEquipment.map(item => (
                    <div key={item.id} className="col-xl-3 col-lg-4 col-md-6 mb-4">
                      <EquipmentCard 
                        item={item} 
                        currentUserId={currentUser?.uid} 
                        onViewDetails={handleViewDetails}
                        onAuthRequiredAction={handleAuthRequiredAction}
                        isAuthenticated={!!currentUser}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : equipmentList.length === 0 ? (
              <div className="text-center py-5">
                <div className="card border-0 shadow-sm">
                  <div className="card-body py-5">
                    <i className="bi bi-tools display-1 text-muted mb-3"></i>
                    <h4>No Equipment Available Yet</h4>
                    <p className="text-muted mb-4">
                      Be the first to discover amazing equipment when owners start listing!
                    </p>
                    <div className="alert alert-info mx-auto" style={{ maxWidth: '400px' }}>
                      <h6 className="alert-heading">
                        <i className="bi bi-lightbulb me-2"></i>
                        Have Equipment to Share?
                      </h6>
                      <p className="mb-2">Start earning by listing your equipment:</p>
                      {currentUser ? (
                        <Link to="/add-equipment" className="btn btn-primary btn-sm">
                          <i className="bi bi-plus-circle me-1"></i>
                          List Equipment
                        </Link>
                      ) : (
                        <Link to="/signup" className="btn btn-primary btn-sm">
                          <i className="bi bi-person-plus me-1"></i>
                          Sign Up to List Equipment
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="card border-0 shadow-sm">
                  <div className="card-body py-5">
                    <i className="bi bi-search display-1 text-muted"></i>
                    <h5 className="mt-3">No matches found</h5>
                    <p className="text-muted mb-3">Try different keywords or filters</p>
                    <button className="btn btn-primary" onClick={clearFilters}>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Rentals Tab - Only for authenticated users */}
        {activeTab === 'rentals' && hasPersonalAccess && (
          <div>
            {rentalHistory.length > 0 ? (
              <div className="row">
                {rentalHistory.map(rental => (
                  <div key={rental.id} className="col-lg-6 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="mb-1 fw-bold">{rental.equipmentName}</h6>
                            <small className="text-muted">
                              <i className="bi bi-person me-1"></i>
                              {rental.ownerName}
                            </small>
                          </div>
                          {getStatusBadge(rental.status)}
                        </div>
                        
                        <div className="row g-2 mb-3 text-sm">
                          <div className="col-6">
                            <div className="d-flex align-items-center text-muted">
                              <i className="bi bi-calendar-event me-2"></i>
                              <span>{formatDate(rental.startDate)}</span>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="d-flex align-items-center text-muted">
                              <i className="bi bi-calendar-check me-2"></i>
                              <span>{formatDate(rental.endDate)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="h5 text-success fw-bold mb-0">
                            ${rental.totalPrice || rental.totalCost || 0}
                          </span>
                          <small className="text-muted">
                            ID: #{rental.id.slice(-6)}
                          </small>
                        </div>
                        
                        <div className="d-flex gap-2">
                          <Link
                            to={`/rental-details/${rental.id}`}
                            className="btn btn-outline-primary btn-sm flex-grow-1"
                          >
                            <i className="bi bi-eye me-1"></i>
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
                          {rental.status === 'active' && (
                            <button className="btn btn-info btn-sm">
                              <i className="bi bi-chat-dots me-1"></i>
                              Contact
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="card border-0 shadow-sm">
                  <div className="card-body py-5">
                    <i className="bi bi-calendar-x display-1 text-muted"></i>
                    <h4 className="mt-3">No rentals yet</h4>
                    <p className="text-muted mb-4">Start browsing equipment to make your first rental!</p>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => setActiveTab('browse')}
                    >
                      <i className="bi bi-search me-2"></i>
                      Browse Equipment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call to Action for non-authenticated users */}
        {!currentUser && (
          <div className="row mt-5">
            <div className="col">
              <div className="card border-0 shadow-sm bg-primary text-white">
                <div className="card-body text-center py-5">
                  <h3 className="fw-bold mb-3">Ready to Start Renting?</h3>
                  <p className="mb-4 opacity-75">
                    Join thousands of users who are already saving money by renting instead of buying!
                  </p>
                  <div className="d-flex gap-3 justify-content-center">
                    <Link to="/signup" className="btn btn-light btn-lg">
                      <i className="bi bi-person-plus me-2"></i>
                      Sign Up Free
                    </Link>
                    <Link to="/login" className="btn btn-outline-light btn-lg">
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Log In
                    </Link>
                  </div>
                  <p className="mt-3 mb-0 small opacity-75">
                    Already have equipment? <Link to="/signup" className="text-white fw-bold">List it for rent</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Equipment Card Component with authentication handling
function EquipmentCard({ item, currentUserId, onViewDetails, onAuthRequiredAction, isAuthenticated }) {
  const isOwnEquipment = item.ownerId === currentUserId;
  
  const handleRentClick = () => {
    if (!isAuthenticated) {
      onAuthRequiredAction('rent', item.id);
    } else {
      onAuthRequiredAction('rent', item.id);
    }
  };
  
  return (
    <div className="card border-0 shadow-sm h-100 equipment-card">
      <div className="position-relative">
        <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.name}
              className="card-img-top"
              style={{ height: '100%', width: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="d-flex align-items-center justify-content-center h-100" 
               style={{ display: item.imageUrl ? 'none' : 'flex' }}>
            <i className="bi bi-tools display-4 text-muted"></i>
          </div>
        </div>
        
        {/* Status badges */}
        <div className="position-absolute top-0 end-0 m-2">
          <span className={`badge ${item.available ? 'bg-success' : 'bg-danger'}`}>
            {item.available ? 'Available' : 'Rented'}
          </span>
          {isOwnEquipment && (
            <span className="badge bg-info ms-1">Your Equipment</span>
          )}
        </div>

        {/* Quick actions overlay */}
        <div className="position-absolute top-0 start-0 m-2">
          <button 
            className="btn btn-light btn-sm rounded-circle me-1"
            onClick={() => onViewDetails(item)}
            title="Quick view"
          >
            <i className="bi bi-eye"></i>
          </button>
          <button 
            className="btn btn-light btn-sm rounded-circle" 
            title={isAuthenticated ? "Add to favorites" : "Login to add to favorites"}
            onClick={() => !isAuthenticated ? onAuthRequiredAction('favorites') : console.log('Add to favorites')}
          >
            <i className="bi bi-heart"></i>
          </button>
        </div>
      </div>
      
      <div className="card-body d-flex flex-column">
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="card-title mb-0 fw-bold">{item.name}</h6>
            <span className="badge bg-primary bg-opacity-10 text-primary small">{item.category}</span>
          </div>
          
          <p className="text-muted small mb-3 line-clamp-2" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4em',
            maxHeight: '2.8em'
          }}>
            {item.description}
          </p>
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="h5 text-success fw-bold">${item.ratePerDay}</span>
              <small className="text-muted">/day</small>
            </div>
            <div className="text-end">
              <div className="d-flex align-items-center text-muted small mb-1">
                <i className="bi bi-star-fill text-warning me-1"></i>
                <span>{item.rating || '4.8'}</span>
              </div>
              <div className="d-flex align-items-center text-muted small">
                <i className="bi bi-eye me-1"></i>
                <span>{item.views || 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Location */}
        <div className="d-flex align-items-center text-muted small mb-3">
          <i className="bi bi-geo-alt me-1"></i>
          <span>{item.location}</span>
        </div>
        
        {/* Action Button */}
        <div className="d-grid">
          {item.available && !isOwnEquipment ? (
            <button
              onClick={handleRentClick}
              className="btn btn-primary"
            >
              <i className="bi bi-calendar-plus me-2"></i>
              {isAuthenticated ? 'Rent Now' : 'Login to Rent'}
            </button>
          ) : isOwnEquipment ? (
            <Link
              to={`/edit-equipment/${item.id}`}
              className="btn btn-outline-secondary"
            >
              <i className="bi bi-pencil me-2"></i>
              Edit Equipment
            </Link>
          ) : (
            <button className="btn btn-secondary" disabled>
              <i className="bi bi-x-circle me-2"></i>
              Unavailable
            </button>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .equipment-card {
          transition: all 0.3s ease;
        }
        .equipment-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default RenterDashboard;