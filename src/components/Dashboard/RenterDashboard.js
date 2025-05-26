import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { sampleEquipment } from '../../data/sampleEquipment';

function RenterDashboard() {
  const { currentUser } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllEquipment, setShowAllEquipment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [stats, setStats] = useState({
    totalRentals: 0,
    activeRentals: 0,
    totalSpent: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch equipment list
        const equipmentSnapshot = await getDocs(collection(db, 'equipment'));
        const equipment = equipmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipmentList(equipment.length ? equipment : sampleEquipment);

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
          } catch (error) {
            console.log('Error fetching rentals, using sample data:', error);
            // Use sample rental data
            const sampleRentals = [
              {
                id: 'rental-001',
                equipmentName: 'Power Drill (Cordless, 18V)',
                equipmentId: 'eq-011',
                status: 'completed',
                startDate: { toDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                endDate: { toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
                totalPrice: 125,
                ownerName: 'Tool Rental Pro'
              },
              {
                id: 'rental-002',
                equipmentName: 'Pressure Washer (3000 PSI)',
                equipmentId: 'eq-038',
                status: 'active',
                startDate: { toDate: () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
                endDate: { toDate: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
                totalPrice: 150,
                ownerName: 'Clean Force'
              }
            ];
            setRentalHistory(sampleRentals);
            setStats({
              totalRentals: sampleRentals.length,
              activeRentals: sampleRentals.filter(r => r.status === 'active').length,
              totalSpent: sampleRentals.reduce((sum, r) => sum + r.totalPrice, 0)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setEquipmentList(sampleEquipment);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return item.available && matchesSearch && matchesCategory;
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

  return (
    <div className="container-fluid py-4">
      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h3 fw-bold text-dark mb-1">
                Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0]}!
              </h2>
              <p className="text-muted mb-0">Find and rent the equipment you need for your projects.</p>
            </div>
            <div className="d-none d-md-block">
              <Link to="/rental-history" className="btn btn-outline-primary">
                <i className="bi bi-calendar me-2"></i>
                View History
              </Link>
            </div>
          </div>
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
                  <h6 className="text-muted mb-1 small">Total Rentals</h6>
                  <h3 className="mb-0 fw-bold">{stats.totalRentals}</h3>
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
                  <h6 className="text-muted mb-1 small">Active Rentals</h6>
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
                Browse Equipment
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link fw-semibold ${activeTab === 'rentals' ? 'active' : ''}`}
                onClick={() => setActiveTab('rentals')}
              >
                <i className="bi bi-calendar me-2"></i>
                My Rentals
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
            <div className="col-md-8 mb-3">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4 mb-3">
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
          </div>

          {/* Equipment Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">Loading equipment...</p>
            </div>
          ) : (
            <>
              <div className="row">
                {(showAllEquipment ? filteredEquipment : filteredEquipment.slice(0, 6)).map(item => (
                  <div key={item.id} className="col-md-6 col-lg-4 mb-4">
                    <EquipmentCard item={item} />
                  </div>
                ))}
              </div>

              {filteredEquipment.length > 6 && (
                <div className="row">
                  <div className="col text-center">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setShowAllEquipment(!showAllEquipment)}
                    >
                      {showAllEquipment ? 'Show Less' : `View All ${filteredEquipment.length} Items`}
                    </button>
                  </div>
                </div>
              )}

              {filteredEquipment.length === 0 && (
                <div className="alert alert-info text-center">
                  <h5>No equipment found</h5>
                  <p className="mb-0">Try adjusting your search terms or category filter.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* My Rentals Tab */}
      {activeTab === 'rentals' && (
        <div>
          <div className="row mb-4">
            <div className="col">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">My Rentals</h5>
                <small className="text-muted">
                  {rentalHistory.length} rental{rentalHistory.length !== 1 ? 's' : ''} found
                </small>
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
              {rentalHistory.slice(0, 5).map(rental => (
                <div key={rental.id} className="col-lg-6 mb-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold">{rental.equipmentName}</h6>
                          <small className="text-muted">From: {rental.ownerName}</small>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(rental.status)}
                        </div>
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
                <div className="mb-4">
                  <i className="bi bi-box display-1 text-muted"></i>
                </div>
                <h5>No rentals yet</h5>
                <p className="text-muted mb-4">Get started by browsing available equipment.</p>
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

function EquipmentCard({ item }) {
  return (
    <div className="card h-100 border-0 shadow-sm equipment-card">
      <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="card-img-top"
            style={{ height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="d-flex align-items-center justify-content-center bg-light h-100" 
          style={{display: item.imageUrl ? 'none' : 'flex'}}
        >
          <i className="bi bi-box display-4 text-muted"></i>
        </div>
        <div className="position-absolute top-0 end-0 m-2">
          <span className="badge bg-success px-2 py-1">
            Available
          </span>
        </div>
      </div>
      
      <div className="card-body d-flex flex-column">
        <div className="flex-grow-1">
          <h6 className="card-title mb-1">{item.name}</h6>
          <span className="badge bg-primary mb-2 small">{item.category}</span>
          <p className="card-text small text-muted mb-3" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {item.description}
          </p>
          
          {item.features && item.features.length > 0 && (
            <div className="mb-3">
              {item.features.slice(0, 2).map((feature, index) => (
                <span key={index} className="badge bg-light text-dark me-1 mb-1 small">
                  {feature}
                </span>
              ))}
              {item.features.length > 2 && (
                <small className="text-muted">+{item.features.length - 2} more</small>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="h5 text-success fw-bold mb-0">${item.ratePerDay}</span>
              <small className="text-muted">/day</small>
            </div>
            <Link
              to={`/rent/${item.id}`}
              className="btn btn-primary btn-sm"
            >
              Rent Now
            </Link>
          </div>
          
          <div className="d-flex align-items-center text-muted small">
            <i className="bi bi-geo-alt me-1"></i>
            <span className="me-2">{item.location}</span>
            <span>• Owner: {item.ownerName}</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .equipment-card:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          transition: box-shadow 0.15s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default RenterDashboard;