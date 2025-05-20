// src/components/Rental/RentalHistory.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

function RentalHistory() {
  const { currentUser } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOption, setSortOption] = useState('endDate-desc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRentalHistory = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        // In a real app, this would be a Firestore query
        // For now, using simulated data
        
        const rentalHistoryData = [
          {
            id: 'rental-001',
            equipmentName: 'Power Drill (Cordless, 18V)',
            equipmentId: 'eq-011',
            ownerName: 'Tool Rental Pro',
            status: 'completed',
            startDate: { toDate: () => new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
            endDate: { toDate: () => new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
            totalPrice: 125,
            rating: 5,
            reviewSubmitted: true
          },
          {
            id: 'rental-002',
            equipmentName: 'Pressure Washer (3000 PSI)',
            equipmentId: 'eq-038',
            ownerName: 'Clean Force',
            status: 'active',
            startDate: { toDate: () => new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
            endDate: { toDate: () => new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
            totalPrice: 150,
            rating: null,
            reviewSubmitted: false
          },
          {
            id: 'rental-003',
            equipmentName: 'Tile Cutter (Wet Saw)',
            equipmentId: 'eq-043',
            ownerName: 'Precision Cuts',
            status: 'completed',
            startDate: { toDate: () => new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
            endDate: { toDate: () => new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
            totalPrice: 170,
            rating: 4,
            reviewSubmitted: true
          },
          {
            id: 'rental-004',
            equipmentName: 'Stump Grinder',
            equipmentId: 'eq-022',
            ownerName: 'Grind Time Equipment',
            status: 'cancelled',
            startDate: { toDate: () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            endDate: { toDate: () => new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
            totalPrice: 225,
            rating: null,
            reviewSubmitted: false,
            cancellationReason: 'Weather conditions'
          },
          {
            id: 'rental-005',
            equipmentName: 'Scissor Lift (19\' Electric)',
            equipmentId: 'eq-013',
            ownerName: 'Up High Rentals',
            status: 'completed',
            startDate: { toDate: () => new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
            endDate: { toDate: () => new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
            totalPrice: 660,
            rating: 3,
            reviewSubmitted: true
          }
        ];
        
        setRentals(rentalHistoryData);
      } catch (error) {
        console.error('Error fetching rental history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRentalHistory();
  }, [currentUser]);

  // Filter rentals based on status and search term
  const filteredRentals = rentals.filter(rental => {
    const matchesStatus = filterStatus === 'all' || rental.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      rental.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Sort rentals based on selected option
  const sortedRentals = [...filteredRentals].sort((a, b) => {
    const [field, direction] = sortOption.split('-');
    
    if (field === 'endDate') {
      const aDate = a.endDate.toDate().getTime();
      const bDate = b.endDate.toDate().getTime();
      return direction === 'asc' ? aDate - bDate : bDate - aDate;
    } else if (field === 'startDate') {
      const aDate = a.startDate.toDate().getTime();
      const bDate = b.startDate.toDate().getTime();
      return direction === 'asc' ? aDate - bDate : bDate - aDate;
    } else if (field === 'price') {
      return direction === 'asc' ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice;
    } else if (field === 'name') {
      return direction === 'asc' 
        ? a.equipmentName.localeCompare(b.equipmentName) 
        : b.equipmentName.localeCompare(a.equipmentName);
    }
    
    return 0;
  });

  // Helper function to render status badge
  const renderStatusBadge = (status) => {
    let badgeClass = '';
    
    switch (status) {
      case 'active':
        badgeClass = 'bg-success';
        break;
      case 'completed':
        badgeClass = 'bg-primary';
        break;
      case 'cancelled':
        badgeClass = 'bg-danger';
        break;
      case 'pending':
        badgeClass = 'bg-warning text-dark';
        break;
      default:
        badgeClass = 'bg-secondary';
    }
    
    return <span className={`badge ${badgeClass}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  // Helper function to render star rating
  const renderStarRating = (rating) => {
    const stars = [];
    
    if (rating === null) return <span className="text-muted small">Not rated</span>;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<i key={i} className="bi bi-star-fill text-warning"></i>);
      } else {
        stars.push(<i key={i} className="bi bi-star text-warning"></i>);
      }
    }
    
    return <div>{stars}</div>;
  };

  // Format date
  const formatDate = (dateObj) => {
    const date = dateObj.toDate();
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/renter-dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">Rental History</li>
            </ol>
          </nav>
          
          <h2 className="mb-3">Your Rental History</h2>
          <p className="text-muted">View and manage all your past and current equipment rentals.</p>
        </div>
      </div>
      
      {/* Filters and sorting */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="searchRentals" className="form-label small text-muted">Search Rentals</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      id="searchRentals"
                      className="form-control"
                      placeholder="Search by name or owner..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="col-md-4">
                  <label htmlFor="filterStatus" className="form-label small text-muted">Filter by Status</label>
                  <select
                    id="filterStatus"
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Rentals</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                
                <div className="col-md-4">
                  <label htmlFor="sortOption" className="form-label small text-muted">Sort by</label>
                  <select
                    id="sortOption"
                    className="form-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="endDate-desc">End Date (Newest First)</option>
                    <option value="endDate-asc">End Date (Oldest First)</option>
                    <option value="startDate-desc">Start Date (Newest First)</option>
                    <option value="startDate-asc">Start Date (Oldest First)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="name-asc">Equipment Name (A-Z)</option>
                    <option value="name-desc">Equipment Name (Z-A)</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted small">
                      {filteredRentals.length} rental{filteredRentals.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                  
                  <div>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setFilterStatus('all');
                        setSortOption('endDate-desc');
                        setSearchTerm('');
                      }}
                    >
                      <i className="bi bi-arrow-repeat me-1"></i>
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rental History */}
      <div className="row">
        <div className="col-12">
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : sortedRentals.length > 0 ? (
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Equipment</th>
                      <th scope="col">Rental Period</th>
                      <th scope="col">Status</th>
                      <th scope="col">Price</th>
                      <th scope="col">Rating</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRentals.map((rental) => (
                      <tr key={rental.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              <img 
                                src={`https://via.placeholder.com/50`} 
                                alt={rental.equipmentName}
                                className="rounded"
                                width="50"
                                height="50"
                              />
                            </div>
                            <div>
                              <h6 className="mb-0">{rental.equipmentName}</h6>
                              <small className="text-muted">
                                From: {rental.ownerName}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{formatDate(rental.startDate)}</div>
                            <div className="text-muted small">to</div>
                            <div>{formatDate(rental.endDate)}</div>
                          </div>
                        </td>
                        <td>
                          {renderStatusBadge(rental.status)}
                          {rental.status === 'cancelled' && rental.cancellationReason && (
                            <div className="small text-muted mt-1">{rental.cancellationReason}</div>
                          )}
                        </td>
                        <td>
                          <div className="fw-bold">${rental.totalPrice}</div>
                        </td>
                        <td>
                          {renderStarRating(rental.rating)}
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <Link 
                              to={`/rental-details/${rental.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-info-circle me-1"></i>
                              Details
                            </Link>
                            
                            {rental.status === 'completed' && !rental.reviewSubmitted && (
                              <Link 
                                to={`/review/${rental.id}`}
                                className="btn btn-sm btn-outline-success"
                              >
                                <i className="bi bi-star me-1"></i>
                                Leave Review
                              </Link>
                            )}
                            
                            {rental.status === 'active' && (
                              <Link 
                                to={`/extend-rental/${rental.id}`}
                                className="btn btn-sm btn-outline-secondary"
                              >
                                <i className="bi bi-calendar-plus me-1"></i>
                                Extend
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-5 bg-light rounded">
              <div className="py-4">
                <i className="bi bi-calendar-x text-muted display-1"></i>
                <h5 className="mt-3">No Rental History Found</h5>
                <p className="text-muted">
                  {searchTerm || filterStatus !== 'all' ? 
                    'Try adjusting your filters or search terms.' :
                    'You have not rented any equipment yet.'}
                </p>
                <Link to="/renter-dashboard" className="btn btn-primary mt-2">
                  Browse Equipment
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Statistics */}
      {sortedRentals.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title">Rental Statistics</h5>
                <div className="row g-4 mt-1">
                  <div className="col-md-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                        <i className="bi bi-box-seam text-primary fs-4"></i>
                      </div>
                      <div>
                        <div className="text-muted small">Total Rentals</div>
                        <div className="fs-5 fw-bold">{rentals.length}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                        <i className="bi bi-cash-stack text-success fs-4"></i>
                      </div>
                      <div>
                        <div className="text-muted small">Total Spent</div>
                        <div className="fs-5 fw-bold">
                          ${rentals.reduce((sum, rental) => sum + rental.totalPrice, 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                        <i className="bi bi-clipboard-check text-info fs-4"></i>
                      </div>
                      <div>
                        <div className="text-muted small">Completed Rentals</div>
                        <div className="fs-5 fw-bold">
                          {rentals.filter(rental => rental.status === 'completed').length}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                        <i className="bi bi-star-half text-warning fs-4"></i>
                      </div>
                      <div>
                        <div className="text-muted small">Average Rating</div>
                        <div className="fs-5 fw-bold">
                          {(() => {
                            const ratings = rentals
                              .filter(rental => rental.rating !== null)
                              .map(rental => rental.rating);
                            
                            if (ratings.length === 0) return 'N/A';
                            
                            const avg = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
                            return avg.toFixed(1);
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RentalHistory;