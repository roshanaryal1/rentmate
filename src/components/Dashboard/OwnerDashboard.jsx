// Debug and Fixed OwnerDashboard.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';

// Dark Mode Context (keeping it simple for now)
const DarkModeContext = createContext();
const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};
const useDarkMode = () => useContext(DarkModeContext);

// Enhanced Debug Component
const DebugInfo = ({ currentUser, equipmentItems, allEquipment }) => {
  const [showDebug, setShowDebug] = useState(false);
  
  if (!showDebug) {
    return (
      <div className="alert alert-info mb-3">
        <button 
          className="btn btn-sm btn-outline-primary"
          onClick={() => setShowDebug(true)}
        >
          🐛 Show Debug Info
        </button>
      </div>
    );
  }

  return (
    <div className="alert alert-warning mb-3">
      <button 
        className="btn btn-sm btn-outline-secondary float-end"
        onClick={() => setShowDebug(false)}
      >
        ✕ Hide Debug
      </button>
      <h6>🐛 Debug Information:</h6>
      <div className="small">
        <strong>Current User ID:</strong> {currentUser?.uid || 'Not logged in'}<br/>
        <strong>User Email:</strong> {currentUser?.email || 'No email'}<br/>
        <strong>Your Equipment Count:</strong> {equipmentItems.length}<br/>
        <strong>All Equipment Count:</strong> {allEquipment.length}<br/>
        
        {allEquipment.length > 0 && (
          <>
            <hr className="my-2"/>
            <strong>All Equipment Owner IDs:</strong>
            <ul className="mb-0 mt-1">
              {allEquipment.map(item => (
                <li key={item.id} className="small">
                  {item.name}: <code>{item.ownerId}</code> 
                  {item.ownerId === currentUser?.uid && <span className="text-success"> ✓ YOURS</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

// Main Owner Dashboard Component
function OwnerDashboard() {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]); // For debugging
  const [activeRentals, setActiveRentals] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Calculated stats
  const [stats, setStats] = useState({
    totalEquipment: 0,
    availableEquipment: 0,
    rentedEquipment: 0,
    totalRevenue: 0,
    pendingRequests: 0,
    activeRentals: 0,
    completedRentals: 0,
    avgRating: 0,
    pendingApproval: 0
  });

  // Check for success message
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('equipmentAdded') === 'true') {
      // Refresh data when coming back from add equipment
      window.location.reload();
    }
  }, [location]);

  // Fetch all data from Firebase
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchOwnerData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('🔍 Fetching data for owner:', currentUser.uid);
        console.log('👤 Current user object:', currentUser);

        // 1. First, fetch ALL equipment for debugging
        console.log('📦 Fetching ALL equipment for debugging...');
        const allEquipmentSnapshot = await getDocs(collection(db, 'equipment'));
        const allEquipmentData = allEquipmentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`📊 Total equipment in database: ${allEquipmentData.length}`);
        setAllEquipment(allEquipmentData);

        // Log all owner IDs for debugging
        allEquipmentData.forEach(item => {
          console.log(`📋 Equipment "${item.name}": ownerId = "${item.ownerId}", currentUserId = "${currentUser.uid}"`);
          console.log(`🔍 Match: ${item.ownerId === currentUser.uid ? 'YES ✓' : 'NO ✗'}`);
        });

        // 2. Now fetch owner's equipment with multiple strategies
        let ownerEquipment = [];

        // Strategy 1: Try with exact ownerId match
        try {
          console.log('🎯 Strategy 1: Fetching with ownerId filter...');
          const equipmentQuery = query(
            collection(db, 'equipment'),
            where('ownerId', '==', currentUser.uid)
          );

          const equipmentSnapshot = await getDocs(equipmentQuery);
          ownerEquipment = equipmentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            views: doc.data().views || 0,
            bookings: doc.data().bookings || 0,
            totalRevenue: doc.data().totalRevenue || 0,
            rating: doc.data().rating || 0
          }));

          console.log(`📦 Strategy 1 result: Found ${ownerEquipment.length} equipment items`);

        } catch (queryError) {
          console.error('❌ Strategy 1 failed:', queryError);
          
          // Strategy 2: Filter client-side if query fails
          console.log('🎯 Strategy 2: Filtering all equipment client-side...');
          ownerEquipment = allEquipmentData.filter(item => item.ownerId === currentUser.uid);
          console.log(`📦 Strategy 2 result: Found ${ownerEquipment.length} equipment items`);
        }

        setEquipmentItems(ownerEquipment);

        // Initialize arrays for rentals and requests
        let ownerRentals = [];
        let requests = [];

        // 3. Fetch rentals where user is the owner
        try {
          const rentalsSnapshot = await getDocs(collection(db, 'rentals'));
          ownerRentals = rentalsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(rental => rental.ownerId === currentUser.uid);
          
          console.log(`📅 Found ${ownerRentals.length} rentals`);
          setActiveRentals(ownerRentals);

        } catch (rentalsError) {
          console.log('ℹ️ No rentals found or error fetching rentals:', rentalsError);
          setActiveRentals([]);
        }

        // 4. Fetch pending rental requests
        try {
          const requestsSnapshot = await getDocs(collection(db, 'rentalRequests'));
          requests = requestsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(request => request.ownerId === currentUser.uid && request.status === 'pending');

          console.log(`📥 Found ${requests.length} pending requests`);
          setPendingRequests(requests);

        } catch (requestsError) {
          console.log('ℹ️ No pending requests found:', requestsError);
          setPendingRequests([]);
        }

        // 5. Calculate statistics
        const totalEquipment = ownerEquipment.length;
        const availableEquipment = ownerEquipment.filter(item => item.available !== false).length;
        const rentedEquipment = ownerEquipment.filter(item => item.available === false).length;
        const pendingApproval = ownerEquipment.filter(item => item.approvalStatus === 'pending').length;

        // Calculate revenue from rentals and equipment data
        const rentalRevenue = ownerRentals.reduce((sum, rental) => {
          return sum + (rental.totalPrice || rental.totalCost || 0);
        }, 0);

        const equipmentRevenue = ownerEquipment.reduce((sum, eq) => {
          return sum + (eq.totalRevenue || 0);
        }, 0);

        const totalRevenue = Math.max(rentalRevenue, equipmentRevenue);

        const activeRentalsCount = ownerRentals.filter(r => 
          r.status === 'active' || r.status === 'approved'
        ).length;

        const completedRentalsCount = ownerRentals.filter(r => 
          r.status === 'completed'
        ).length;

        // Calculate average rating
        const ratingsSum = ownerEquipment.reduce((sum, eq) => sum + (eq.rating || 0), 0);
        const avgRating = totalEquipment > 0 ? (ratingsSum / totalEquipment) : 0;

        const calculatedStats = {
          totalEquipment,
          availableEquipment,
          rentedEquipment,
          totalRevenue,
          pendingRequests: requests.length,
          activeRentals: activeRentalsCount,
          completedRentals: completedRentalsCount,
          avgRating: avgRating.toFixed(1),
          pendingApproval
        };

        setStats(calculatedStats);
        console.log('📊 Calculated stats:', calculatedStats);

        // Final debug log
        if (ownerEquipment.length === 0 && allEquipmentData.length > 0) {
          console.warn('⚠️ WARNING: Found equipment in database but none belongs to current user!');
          console.log('🔍 Double-check that ownerId is being set correctly when adding equipment');
        }

      } catch (error) {
        console.error('❌ Error fetching owner dashboard data:', error);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerData();
  }, [currentUser, navigate]);

  // Filter equipment based on search
  const filteredEquipment = equipmentItems.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteEquipment = async (equipmentId) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;

    try {
      await deleteDoc(doc(db, 'equipment', equipmentId));
      setEquipmentItems(prev => prev.filter(item => item.id !== equipmentId));
      console.log('✅ Equipment deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting equipment:', error);
      setError('Failed to delete equipment');
    }
  };

  const handleToggleAvailability = async (equipmentId, currentAvailability) => {
    try {
      const newAvailability = !currentAvailability;
      await updateDoc(doc(db, 'equipment', equipmentId), {
        available: newAvailability,
        updatedAt: serverTimestamp()
      });

      setEquipmentItems(prev => 
        prev.map(item => 
          item.id === equipmentId 
            ? { ...item, available: newAvailability }
            : item
        )
      );

      console.log(`✅ Equipment ${newAvailability ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('❌ Error updating equipment availability:', error);
      setError('Failed to update equipment availability');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="mt-3">Loading your dashboard...</h5>
          <p className="text-muted">Fetching your equipment and rental data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 fw-bold text-dark mb-1">
                Owner Dashboard 🏢
              </h1>
              <p className="text-muted mb-0">
                Welcome back, {currentUser?.displayName || currentUser?.email}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/add-equipment" className="btn btn-primary">
                ➕ Add Equipment
              </Link>
              <button className="btn btn-outline-secondary" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <DebugInfo 
        currentUser={currentUser} 
        equipmentItems={equipmentItems}
        allEquipment={allEquipment}
      />

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-primary bg-opacity-10 rounded-3 me-3">
                  <div className="fs-3">🔧</div>
                </div>
                <div>
                  <h2 className="mb-1">{stats.totalEquipment}</h2>
                  <p className="text-muted mb-0 small">Your Equipment</p>
                  <small className="text-success">
                    {stats.availableEquipment} available
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-success bg-opacity-10 rounded-3 me-3">
                  <div className="fs-3">💰</div>
                </div>
                <div>
                  <h2 className="mb-1">${stats.totalRevenue}</h2>
                  <p className="text-muted mb-0 small">Total Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-info bg-opacity-10 rounded-3 me-3">
                  <div className="fs-3">📅</div>
                </div>
                <div>
                  <h2 className="mb-1">{stats.activeRentals}</h2>
                  <p className="text-muted mb-0 small">Active Rentals</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="p-3 bg-warning bg-opacity-10 rounded-3 me-3">
                  <div className="fs-3">📥</div>
                </div>
                <div>
                  <h2 className="mb-1">{stats.pendingRequests}</h2>
                  <p className="text-muted mb-0 small">Pending Requests</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Section */}
      <div className="row mb-4">
        <div className="col">
          <div className="card border-0 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">🔧 Your Equipment ({filteredEquipment.length})</h5>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ maxWidth: '250px' }}
                />
                <Link to="/add-equipment" className="btn btn-primary">
                  ➕ Add New
                </Link>
              </div>
            </div>
            <div className="card-body">
              {filteredEquipment.length > 0 ? (
                <div className="row">
                  {filteredEquipment.map(item => (
                    <div key={item.id} className="col-lg-4 col-md-6 mb-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="position-relative">
                          <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="card-img-top"
                                style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center h-100">
                                <i className="bi bi-tools display-4 text-muted"></i>
                              </div>
                            )}
                          </div>
                          
                          <div className="position-absolute top-0 end-0 m-2">
                            <span className={`badge ${item.available !== false ? 'bg-success' : 'bg-danger'}`}>
                              {item.available !== false ? '✅ Available' : '🔴 Rented'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="card-body d-flex flex-column">
                          <h6 className="card-title fw-bold">{item.name}</h6>
                          <p className="text-muted small mb-3 flex-grow-1">{item.description}</p>
                          
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="h5 text-success mb-0">${item.ratePerDay}/day</div>
                            <small className="text-muted">{item.category}</small>
                          </div>
                          
                          <div className="d-flex gap-1">
                            <Link 
                              to={`/edit-equipment/${item.id}`} 
                              className="btn btn-outline-primary btn-sm flex-grow-1"
                            >
                              ✏️ Edit
                            </Link>
                            <button 
                              className={`btn btn-sm ${item.available !== false ? 'btn-warning' : 'btn-success'}`}
                              onClick={() => handleToggleAvailability(item.id, item.available !== false)}
                            >
                              {item.available !== false ? '⏸️' : '▶️'}
                            </button>
                            <button 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteEquipment(item.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="display-1 mb-3">🔧</div>
                  <h4>No Equipment Found</h4>
                  <p className="text-muted mb-4">
                    {searchQuery ? 'Try adjusting your search terms.' : 'Start by adding your first piece of equipment.'}
                  </p>
                  {!searchQuery && (
                    <Link to="/add-equipment" className="btn btn-primary">
                      ➕ Add Your First Equipment
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboardWithProvider() {
  return (
    <DarkModeProvider>
      <OwnerDashboard />
    </DarkModeProvider>
  );
}