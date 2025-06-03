import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Mock Auth Context
const useAuth = () => ({
  currentUser: {
    uid: 'mock-user-123',
    displayName: 'John Smith',
    email: 'john@example.com',
    photoURL: 'https://via.placeholder.com/40'
  },
  logout: () => console.log('Logout')
});

// Dark Mode Context
const DarkModeContext = createContext();

const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('ownerDashboard_darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('ownerDashboard_darkMode', JSON.stringify(newMode));
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

// Enhanced Tooltip Component
const TooltipWrapper = ({ children, tooltip, placement = "top" }) => (
  <div className="position-relative d-inline-block" title={tooltip}>
    {children}
  </div>
);

// Mock Data
const mockEquipment = [
  {
    id: '1',
    name: 'Professional Power Drill 18V',
    category: 'Power Tools',
    ratePerDay: 25,
    available: true,
    location: 'Auckland Central',
    description: 'High-performance cordless drill with LED light and fast charging capabilities.',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop',
    features: ['Cordless', 'LED Light', 'Fast Charging'],
    views: 156,
    bookings: 23,
    revenue: 575,
    rating: 4.8,
    reviews: 12
  },
  {
    id: '2',
    name: 'Electric Concrete Mixer',
    category: 'Construction Equipment',
    ratePerDay: 85,
    available: false,
    location: 'Wellington CBD',
    description: 'Heavy-duty concrete mixer suitable for large construction projects.',
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop',
    features: ['Electric Motor', 'Large Capacity', 'Heavy Duty'],
    views: 89,
    bookings: 15,
    revenue: 1275,
    rating: 4.6,
    reviews: 8
  },
  {
    id: '3',
    name: 'Pressure Washer 2400 PSI',
    category: 'Cleaning Equipment',
    ratePerDay: 35,
    available: true,
    location: 'Christchurch',
    description: 'High-pressure washer for driveways, decks, and outdoor cleaning.',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    features: ['High Pressure', 'Multiple Nozzles', 'Portable'],
    views: 234,
    bookings: 31,
    revenue: 1085,
    rating: 4.9,
    reviews: 18
  }
];

const mockRentals = [
  {
    id: 'r1',
    equipmentId: '2',
    equipmentName: 'Electric Concrete Mixer',
    renterName: 'Mike Johnson',
    renterEmail: 'mike@email.com',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-07'),
    totalPrice: 510,
    status: 'active',
    days: 6
  },
  {
    id: 'r2',
    equipmentId: '3',
    equipmentName: 'Pressure Washer 2400 PSI',
    renterName: 'Sarah Wilson',
    renterEmail: 'sarah@email.com',
    startDate: new Date('2024-11-25'),
    endDate: new Date('2024-11-28'),
    totalPrice: 105,
    status: 'completed',
    days: 3
  }
];

const mockPendingRequests = [
  {
    id: 'pr1',
    equipmentId: '1',
    equipmentName: 'Professional Power Drill 18V',
    renterName: 'David Brown',
    renterEmail: 'david@email.com',
    requestedStartDate: new Date('2024-12-15'),
    requestedEndDate: new Date('2024-12-18'),
    totalPrice: 75,
    days: 3,
    status: 'pending'
  }
];

// Chart Data
const chartData = [
  { month: 'Jul', revenue: 1200, bookings: 8 },
  { month: 'Aug', revenue: 1800, bookings: 12 },
  { month: 'Sep', revenue: 2100, bookings: 15 },
  { month: 'Oct', revenue: 1950, bookings: 13 },
  { month: 'Nov', revenue: 2400, bookings: 16 },
  { month: 'Dec', revenue: 1650, bookings: 11 }
];

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { class: 'bg-success', text: 'Active', icon: '🟢' },
    completed: { class: 'bg-primary', text: 'Completed', icon: '✅' },
    pending: { class: 'bg-warning text-dark', text: 'Pending', icon: '⏳' },
    cancelled: { class: 'bg-danger', text: 'Cancelled', icon: '❌' }
  };
  
  const config = statusConfig[status] || { class: 'bg-secondary', text: 'Unknown', icon: '❓' };
  return (
    <span className={`badge ${config.class}`}>
      {config.icon} {config.text}
    </span>
  );
};

// Equipment Analytics Modal
const EquipmentAnalyticsModal = ({ equipment, isOpen, onClose }) => {
  const { isDarkMode } = useDarkMode();
  
  if (!isOpen || !equipment) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className={`modal-content ${isDarkMode ? 'bg-dark text-light border-secondary' : ''}`}>
          <div className={`modal-header ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
            <h5 className="modal-title">
              📊 Analytics: {equipment.name}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className={`modal-body ${isDarkMode ? 'bg-dark' : ''}`}>
            <div className="row mb-4">
              <div className="col-md-3">
                <div className={`card h-100 ${isDarkMode ? 'bg-secondary border-secondary' : ''}`}>
                  <div className="card-body text-center">
                    <div className="h3 text-primary">{equipment.views}</div>
                    <div className="text-muted">Total Views</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className={`card h-100 ${isDarkMode ? 'bg-secondary border-secondary' : ''}`}>
                  <div className="card-body text-center">
                    <div className="h3 text-success">{equipment.bookings}</div>
                    <div className="text-muted">Total Bookings</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className={`card h-100 ${isDarkMode ? 'bg-secondary border-secondary' : ''}`}>
                  <div className="card-body text-center">
                    <div className="h3 text-warning">${equipment.revenue}</div>
                    <div className="text-muted">Total Revenue</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className={`card h-100 ${isDarkMode ? 'bg-secondary border-secondary' : ''}`}>
                  <div className="card-body text-center">
                    <div className="h3 text-info">{equipment.rating}⭐</div>
                    <div className="text-muted">Avg Rating</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <div className={`card ${isDarkMode ? 'bg-secondary border-secondary' : ''}`}>
                  <div className="card-header">
                    <h6 className="mb-0">Performance Metrics</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Booking Rate:</span>
                      <span className="fw-bold">{((equipment.bookings / equipment.views) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Avg. Revenue/Booking:</span>
                      <span className="fw-bold">${(equipment.revenue / equipment.bookings).toFixed(0)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Utilization:</span>
                      <span className="fw-bold">75%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className={`card ${isDarkMode ? 'bg-secondary border-secondary' : ''}`}>
                  <div className="card-header">
                    <h6 className="mb-0">Optimization Tips</h6>
                  </div>
                  <div className="card-body">
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2">📈 Your equipment is performing well!</li>
                      <li className="mb-2">📸 Consider adding more photos</li>
                      <li className="mb-2">💰 Current pricing is competitive</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`modal-footer ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn btn-primary">Export Report</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Owner Dashboard Component
function OwnerDashboard() {
  const { currentUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [equipmentItems, setEquipmentItems] = useState(mockEquipment);
  const [activeRentals, setActiveRentals] = useState(mockRentals);
  const [pendingRequests, setPendingRequests] = useState(mockPendingRequests);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [stats, setStats] = useState({
    totalEquipment: equipmentItems.length,
    availableEquipment: equipmentItems.filter(item => item.available).length,
    rentedEquipment: equipmentItems.filter(item => !item.available).length,
    totalRevenue: equipmentItems.reduce((sum, item) => sum + item.revenue, 0),
    pendingRequests: pendingRequests.length,
    activeRentals: activeRentals.filter(r => r.status === 'active').length,
    completedRentals: activeRentals.filter(r => r.status === 'completed').length,
    avgRating: 4.7
  });

  const filteredEquipment = equipmentItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewAnalytics = (equipment) => {
    setSelectedEquipment(equipment);
    setShowAnalyticsModal(true);
  };

  const formatDate = (date) => {
    return date ? date.toLocaleDateString() : 'Unknown';
  };

  // Sidebar navigation items
  const navItems = [
    { label: 'Overview', icon: '🏠', badge: null },
    { label: 'Equipment', icon: '🔧', badge: stats.totalEquipment },
    { label: 'Rentals', icon: '📅', badge: stats.activeRentals },
    { label: 'Requests', icon: '📥', badge: stats.pendingRequests },
    { label: 'Analytics', icon: '📊', badge: null },
    { label: 'Settings', icon: '⚙️', badge: null }
  ];

  return (
    <>
      <EquipmentAnalyticsModal
        equipment={selectedEquipment}
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />

      <div className={`dashboard-container d-flex ${isDarkMode ? 'dark-mode' : ''}`}>
        {/* Sidebar */}
        <div className={`sidebar ${isDarkMode ? 'bg-dark' : 'bg-dark'} text-white`}>
          <div className="d-flex align-items-center p-3 mb-3">
            <div className="bg-primary p-2 rounded me-2">🏢</div>
            <div>
              <h5 className="m-0">RentMate</h5>
              <small className="opacity-75">Owner Portal</small>
            </div>
          </div>
          
          <ul className="nav flex-column">
            {navItems.map((item, index) => (
              <li key={index} className="nav-item">
                <TooltipWrapper tooltip={`Navigate to ${item.label}`}>
                  <button
                    className={`nav-link d-flex align-items-center enhanced-hover ${activeTab === item.label.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.label.toLowerCase())}
                  >
                    <span className="icon me-3">{item.icon}</span>
                    {item.label}
                    {item.badge && (
                      <span className="badge bg-warning text-dark ms-auto">{item.badge}</span>
                    )}
                  </button>
                </TooltipWrapper>
              </li>
            ))}
          </ul>

          <div className="mt-auto p-3">
            <div className="d-flex align-items-center">
              <img 
                src={currentUser?.photoURL || 'https://via.placeholder.com/32'} 
                alt="Profile" 
                className="rounded-circle me-2"
                width="32" height="32"
              />
              <div className="flex-grow-1">
                <div className="small fw-semibold">{currentUser?.displayName}</div>
                <div className="small opacity-75">{currentUser?.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content flex-grow-1">
          {/* Header */}
          <header className={`dashboard-header d-flex justify-content-between align-items-center p-3 shadow-sm ${isDarkMode ? 'bg-dark text-light border-bottom border-secondary' : 'bg-white'}`}>
            <div>
              <h3 className="mb-0">
                {activeTab === 'overview' && '📊 Dashboard Overview'}
                {activeTab === 'equipment' && '🔧 Equipment Management'}
                {activeTab === 'rentals' && '📅 Active Rentals'}
                {activeTab === 'requests' && '📥 Rental Requests'}
                {activeTab === 'analytics' && '📊 Analytics & Reports'}
                {activeTab === 'settings' && '⚙️ Settings'}
              </h3>
              <p className="text-muted mb-0 small">
                Welcome back, {currentUser?.displayName}! Here's your equipment performance.
              </p>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              {/* Search for equipment and rentals tabs */}
              {(activeTab === 'equipment' || activeTab === 'rentals') && (
                <div className="input-group" style={{ maxWidth: '250px' }}>
                  <input
                    type="text"
                    className={`form-control ${isDarkMode ? 'bg-dark text-light border-secondary' : ''}`}
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className={`input-group-text ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                    🔍
                  </span>
                </div>
              )}

              {/* Notifications */}
              <div className="position-relative">
                <TooltipWrapper tooltip="View notifications">
                  <button 
                    className={`btn ${isDarkMode ? 'btn-outline-light' : 'btn-outline-secondary'} position-relative`}
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    🔔
                    {stats.pendingRequests > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {stats.pendingRequests}
                      </span>
                    )}
                  </button>
                </TooltipWrapper>
              </div>

              {/* Dark Mode Toggle */}
              <TooltipWrapper tooltip={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
                <button 
                  className={`btn ${isDarkMode ? 'btn-outline-light' : 'btn-outline-secondary'}`}
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
              </TooltipWrapper>

              {/* Add Equipment Button */}
              <Link to="/add-equipment" className="btn btn-primary">
                ➕ Add Equipment
              </Link>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <div className={`dashboard-body p-4 ${isDarkMode ? 'bg-dark text-light' : ''}`}>
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <>
                {/* Stats Cards */}
                <div className="row mb-4">
                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className={`card border-0 shadow-sm h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <div className="p-3 bg-primary bg-opacity-10 rounded-3 me-3">
                            <div className="fs-3">🔧</div>
                          </div>
                          <div>
                            <h2 className="mb-1">{stats.totalEquipment}</h2>
                            <p className="text-muted mb-0 small">Total Equipment</p>
                            <small className="text-success">
                              {stats.availableEquipment} available
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className={`card border-0 shadow-sm h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <div className="p-3 bg-success bg-opacity-10 rounded-3 me-3">
                            <div className="fs-3">💰</div>
                          </div>
                          <div>
                            <h2 className="mb-1">${stats.totalRevenue}</h2>
                            <p className="text-muted mb-0 small">Total Revenue</p>
                            <small className="text-success">+12% this month</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className={`card border-0 shadow-sm h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <div className="p-3 bg-info bg-opacity-10 rounded-3 me-3">
                            <div className="fs-3">📅</div>
                          </div>
                          <div>
                            <h2 className="mb-1">{stats.activeRentals}</h2>
                            <p className="text-muted mb-0 small">Active Rentals</p>
                            <small className="text-info">
                              {stats.completedRentals} completed
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6 mb-3">
                    <div className={`card border-0 shadow-sm h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <div className="p-3 bg-warning bg-opacity-10 rounded-3 me-3">
                            <div className="fs-3">📥</div>
                          </div>
                          <div>
                            <h2 className="mb-1">{stats.pendingRequests}</h2>
                            <p className="text-muted mb-0 small">Pending Requests</p>
                            {stats.pendingRequests > 0 && (
                              <small className="text-warning">Needs attention</small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="row mb-4">
                  <div className="col">
                    <div className={`card border-0 shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                      <div className="card-header">
                        <h5 className="mb-0">🚀 Quick Actions</h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-3 mb-2">
                            <Link to="/add-equipment" className="btn btn-primary w-100">
                              ➕ Add Equipment
                            </Link>
                          </div>
                          <div className="col-md-3 mb-2">
                            <button 
                              className="btn btn-success w-100"
                              onClick={() => setActiveTab('requests')}
                            >
                              📥 Review Requests ({stats.pendingRequests})
                            </button>
                          </div>
                          <div className="col-md-3 mb-2">
                            <button 
                              className="btn btn-info w-100"
                              onClick={() => setActiveTab('analytics')}
                            >
                              📊 View Analytics
                            </button>
                          </div>
                          <div className="col-md-3 mb-2">
                            <button className="btn btn-outline-secondary w-100">
                              💬 Contact Support
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity & Top Equipment */}
                <div className="row">
                  <div className="col-lg-8">
                    <div className={`card border-0 shadow-sm h-100 ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                      <div className="card-header">
                        <h5 className="mb-0">🔥 Top Performing Equipment</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className={`table ${isDarkMode ? 'table-dark' : ''}`}>
                            <thead>
                              <tr>
                                <th>Equipment</th>
                                <th>Revenue</th>
                                <th>Bookings</th>
                                <th>Rating</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {equipmentItems.slice(0, 3).map(item => (
                                <tr key={item.id}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <img 
                                        src={item.imageUrl} 
                                        alt={item.name}
                                        className="rounded me-2"
                                        width="40" height="40"
                                        style={{ objectFit: 'cover' }}
                                      />
                                      <div>
                                        <div className="fw-semibold">{item.name}</div>
                                        <small className="text-muted">{item.category}</small>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="fw-bold text-success">${item.revenue}</td>
                                  <td>{item.bookings}</td>
                                  <td>{item.rating}⭐</td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => handleViewAnalytics(item)}
                                    >
                                      📊 Analytics
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-lg-4">
                    <div className={`card border-0 shadow-sm h-100 ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                      <div className="card-header">
                        <h5 className="mb-0">📈 Monthly Performance</h5>
                      </div>
                      <div className="card-body">
                        <div className="text-center mb-3">
                          <h3 className="text-success">${chartData[chartData.length - 1]?.revenue || 0}</h3>
                          <small className="text-muted">This Month's Revenue</small>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <small>Equipment Utilization</small>
                            <small>75%</small>
                          </div>
                          <div className="progress">
                            <div className="progress-bar bg-success" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <small>Customer Satisfaction</small>
                            <small>{stats.avgRating}/5</small>
                          </div>
                          <div className="progress">
                            <div className="progress-bar bg-warning" style={{ width: `${(stats.avgRating/5) * 100}%` }}></div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary w-100"
                          onClick={() => setActiveTab('analytics')}
                        >
                          📊 View Full Analytics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* EQUIPMENT TAB */}
            {activeTab === 'equipment' && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>🔧 Your Equipment ({filteredEquipment.length})</h5>
                  <div className="d-flex gap-2">
                    <span className="badge bg-success">{stats.availableEquipment} Available</span>
                    <span className="badge bg-danger">{stats.rentedEquipment} Rented</span>
                  </div>
                </div>

                <div className="row">
                  {filteredEquipment.map(item => (
                    <div key={item.id} className="col-lg-4 col-md-6 mb-4">
                      <div className={`card border-0 shadow-sm h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                        <div className="position-relative">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="card-img-top"
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          <div className="position-absolute top-0 end-0 m-2">
                            <span className={`badge ${item.available ? 'bg-success' : 'bg-danger'}`}>
                              {item.available ? '✅ Available' : '🔴 Rented'}
                            </span>
                          </div>
                          <div className="position-absolute top-0 start-0 m-2">
                            <span className="badge bg-primary">{item.category}</span>
                          </div>
                        </div>
                        
                        <div className="card-body d-flex flex-column">
                          <h6 className="card-title fw-bold">{item.name}</h6>
                          <p className="text-muted small mb-3 flex-grow-1">{item.description}</p>
                          
                          <div className="row g-2 mb-3 small">
                            <div className="col-6">
                              <div className="text-center p-2 bg-light rounded">
                                <div className="fw-bold text-primary">{item.views}</div>
                                <div className="text-muted">Views</div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center p-2 bg-light rounded">
                                <div className="fw-bold text-success">{item.bookings}</div>
                                <div className="text-muted">Bookings</div>
                              </div>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <div className="h5 text-success mb-0">${item.ratePerDay}/day</div>
                              <small className="text-muted">Revenue: ${item.revenue}</small>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold">{item.rating}⭐</div>
                              <small className="text-muted">{item.reviews} reviews</small>
                            </div>
                          </div>
                          
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-outline-primary btn-sm flex-grow-1"
                              onClick={() => handleViewAnalytics(item)}
                            >
                              📊 Analytics
                            </button>
                            <Link to={`/edit-equipment/${item.id}`} className="btn btn-outline-secondary btn-sm">
                              ✏️ Edit
                            </Link>
                            <button className="btn btn-outline-info btn-sm">
                              👁️ View
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredEquipment.length === 0 && (
                  <div className="text-center py-5">
                    <div className={`card border-0 shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                      <div className="card-body py-5">
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
                    </div>
                  </div>
                )}
              </>
            )}

            {/* RENTALS TAB */}
            {activeTab === 'rentals' && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>📅 Active Rentals ({activeRentals.length})</h5>
                  <div className="d-flex gap-2">
                    <span className="badge bg-success">{stats.activeRentals} Active</span>
                    <span className="badge bg-primary">{stats.completedRentals} Completed</span>
                  </div>
                </div>

                {activeRentals.length > 0 ? (
                  <div className="row">
                    {activeRentals.map(rental => (
                      <div key={rental.id} className="col-lg-6 mb-4">
                        <div className={`card border-0 shadow-sm h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div>
                                <h6 className="fw-bold mb-1">{rental.equipmentName}</h6>
                                <small className="text-muted">
                                  👤 {rental.renterName} • 📧 {rental.renterEmail}
                                </small>
                              </div>
                              <StatusBadge status={rental.status} />
                            </div>
                            
                            <div className="row g-2 mb-3">
                              <div className="col-6">
                                <div className="small">
                                  <div className="text-muted">Start Date</div>
                                  <div className="fw-semibold">📅 {formatDate(rental.startDate)}</div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="small">
                                  <div className="text-muted">End Date</div>
                                  <div className="fw-semibold">📅 {formatDate(rental.endDate)}</div>
                                </div>
                              </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div>
                                <div className="h5 text-success mb-0">${rental.totalPrice}</div>
                                <small className="text-muted">{rental.days} days</small>
                              </div>
                              <small className="text-muted">ID: #{rental.id.slice(-6)}</small>
                            </div>
                            
                            <div className="d-flex gap-1">
                              <button className="btn btn-outline-primary btn-sm flex-grow-1">
                                💬 Contact Renter
                              </button>
                              <button className="btn btn-outline-info btn-sm">
                                📍 Track
                              </button>
                              {rental.status === 'completed' && (
                                <button className="btn btn-outline-success btn-sm">
                                  ⭐ Rate
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
                    <div className={`card border-0 shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                      <div className="card-body py-5">
                        <div className="display-1 mb-3">📅</div>
                        <h4>No Active Rentals</h4>
                        <p className="text-muted mb-4">Your equipment rentals will appear here when someone books them.</p>
                        <Link to="/add-equipment" className="btn btn-primary">
                          ➕ Add More Equipment
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* REQUESTS TAB */}
            {activeTab === 'requests' && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>📥 Rental Requests ({pendingRequests.length})</h5>
                  {pendingRequests.length > 0 && (
                    <span className="badge bg-warning text-dark">Needs Attention</span>
                  )}
                </div>

                {pendingRequests.length > 0 ? (
                  <div className="row">
                    {pendingRequests.map(request => (
                      <div key={request.id} className="col-lg-6 mb-4">
                        <div className={`card border-0 shadow-sm border-warning ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div>
                                <h6 className="fw-bold mb-1">{request.equipmentName}</h6>
                                <small className="text-muted">
                                  👤 {request.renterName} • 📧 {request.renterEmail}
                                </small>
                              </div>
                              <StatusBadge status={request.status} />
                            </div>
                            
                            <div className="row g-2 mb-3">
                              <div className="col-6">
                                <div className="small">
                                  <div className="text-muted">Requested Start</div>
                                  <div className="fw-semibold">📅 {formatDate(request.requestedStartDate)}</div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="small">
                                  <div className="text-muted">Requested End</div>
                                  <div className="fw-semibold">📅 {formatDate(request.requestedEndDate)}</div>
                                </div>
                              </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div>
                                <div className="h5 text-success mb-0">${request.totalPrice}</div>
                                <small className="text-muted">{request.days} days</small>
                              </div>
                              <small className="text-muted">ID: #{request.id.slice(-6)}</small>
                            </div>
                            
                            <div className="d-flex gap-1">
                              <button className="btn btn-success btn-sm flex-grow-1">
                                ✅ Approve
                              </button>
                              <button className="btn btn-danger btn-sm">
                                ❌ Reject
                              </button>
                              <button className="btn btn-outline-info btn-sm">
                                💬 Message
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className={`card border-0 shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                      <div className="card-body py-5">
                        <div className="display-1 mb-3">📥</div>
                        <h4>No Pending Requests</h4>
                        <p className="text-muted mb-4">Rental requests will appear here when customers want to book your equipment.</p>
                        <div className="alert alert-info">
                          <h6 className="alert-heading">💡 Get More Bookings</h6>
                          <ul className="mb-0">
                            <li>Add high-quality photos to your equipment</li>
                            <li>Write detailed descriptions</li>
                            <li>Keep your pricing competitive</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <>
                <div className="row mb-4">
                  <div className="col-lg-8">
                    <div className={`card border-0 shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                      <div className="card-header">
                        <h5 className="mb-0">📈 Revenue & Booking Trends</h5>
                      </div>
                      <div className="card-body">
                        <div className="text-center py-4">
                          <div className="display-6 mb-3">📊</div>
                          <h5>Interactive Chart Coming Soon</h5>
                          <p className="text-muted">Revenue and booking analytics will be displayed here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-lg-4">
                    <div className={`card border-0 shadow-sm h-100 ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                      <div className="card-header">
                        <h5 className="mb-0">🎯 Performance Summary</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <small>Average Rating</small>
                            <small>{stats.avgRating}/5</small>
                          </div>
                          <div className="progress">
                            <div className="progress-bar bg-warning" style={{ width: `${(stats.avgRating/5) * 100}%` }}></div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <small>Equipment Utilization</small>
                            <small>75%</small>
                          </div>
                          <div className="progress">
                            <div className="progress-bar bg-success" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <small>Response Rate</small>
                            <small>95%</small>
                          </div>
                          <div className="progress">
                            <div className="progress-bar bg-info" style={{ width: '95%' }}></div>
                          </div>
                        </div>

                        <hr />
                        
                        <div className="text-center">
                          <h6 className="text-success">${stats.totalRevenue}</h6>
                          <small className="text-muted">Total Lifetime Revenue</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Equipment Performance */}
                <div className="row">
                  <div className="col">
                    <div className={`card border-0 shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                      <div className="card-header">
                        <h5 className="mb-0">🏆 Equipment Performance Ranking</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className={`table ${isDarkMode ? 'table-dark' : ''}`}>
                            <thead>
                              <tr>
                                <th>Rank</th>
                                <th>Equipment</th>
                                <th>Revenue</th>
                                <th>Bookings</th>
                                <th>Views</th>
                                <th>Rating</th>
                                <th>Conversion</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {equipmentItems.map((item, index) => (
                                <tr key={item.id}>
                                  <td>
                                    <span className="fw-bold">#{index + 1}</span>
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <img 
                                        src={item.imageUrl} 
                                        alt={item.name}
                                        className="rounded me-2"
                                        width="40" height="40"
                                        style={{ objectFit: 'cover' }}
                                      />
                                      <div>
                                        <div className="fw-semibold">{item.name}</div>
                                        <small className="text-muted">{item.category}</small>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="fw-bold text-success">${item.revenue}</td>
                                  <td>{item.bookings}</td>
                                  <td>{item.views}</td>
                                  <td>{item.rating}⭐</td>
                                  <td>
                                    <span className="badge bg-primary">
                                      {((item.bookings / item.views) * 100).toFixed(1)}%
                                    </span>
                                  </td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => handleViewAnalytics(item)}
                                    >
                                      📊 Details
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="row">
                <div className="col-lg-8">
                  <div className={`card border-0 shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                    <div className="card-header">
                      <h5 className="mb-0">⚙️ Account Settings</h5>
                    </div>
                    <div className="card-body">
                      <form>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Display Name</label>
                            <input 
                              type="text" 
                              className={`form-control ${isDarkMode ? 'bg-dark text-light border-secondary' : ''}`}
                              defaultValue={currentUser?.displayName}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input 
                              type="email" 
                              className={`form-control ${isDarkMode ? 'bg-dark text-light border-secondary' : ''}`}
                              defaultValue={currentUser?.email}
                            />
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">Business Description</label>
                          <textarea 
                            className={`form-control ${isDarkMode ? 'bg-dark text-light border-secondary' : ''}`}
                            rows="3"
                            placeholder="Tell customers about your equipment rental business..."
                          ></textarea>
                        </div>
                        
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Phone Number</label>
                            <input 
                              type="tel" 
                              className={`form-control ${isDarkMode ? 'bg-dark text-light border-secondary' : ''}`}
                              placeholder="+64 21 123 4567"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Location</label>
                            <input 
                              type="text" 
                              className={`form-control ${isDarkMode ? 'bg-dark text-light border-secondary' : ''}`}
                              placeholder="Auckland, New Zealand"
                            />
                          </div>
                        </div>
                        
                        <hr />
                        
                        <h6>📧 Notification Preferences</h6>
                        <div className="mb-3">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" defaultChecked />
                            <label className="form-check-label">
                              Email notifications for new rental requests
                            </label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" defaultChecked />
                            <label className="form-check-label">
                              SMS notifications for urgent matters
                            </label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" />
                            <label className="form-check-label">
                              Weekly performance reports
                            </label>
                          </div>
                        </div>
                        
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-primary">💾 Save Changes</button>
                          <button type="button" className="btn btn-outline-secondary">🔄 Reset</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4">
                  <div className={`card border-0 shadow-sm mb-3 ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                    <div className="card-header">
                      <h6 className="mb-0">🎨 Appearance</h6>
                    </div>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Dark Mode</span>
                        <button 
                          className={`btn ${isDarkMode ? 'btn-outline-light' : 'btn-outline-dark'} btn-sm`}
                          onClick={toggleDarkMode}
                        >
                          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                        </button>
                      </div>
                      <small className="text-muted">
                        Switch between light and dark themes for better viewing experience.
                      </small>
                    </div>
                  </div>
                  
                  <div className={`card border-0 shadow-sm ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
                    <div className="card-header">
                      <h6 className="mb-0">🆘 Support</h6>
                    </div>
                    <div className="card-body">
                      <div className="d-grid gap-2">
                        <button className="btn btn-outline-primary btn-sm">
                          💬 Contact Support
                        </button>
                        <button className="btn btn-outline-info btn-sm">
                          📖 Help Center
                        </button>
                        <button className="btn btn-outline-success btn-sm">
                          💡 Feature Request
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Dark Mode Styles */
        .dark-mode {
          background-color: #1a202c !important;
          color: #e2e8f0 !important;
        }
        
        .dark-mode .card {
          background-color: #2d3748 !important;
          border-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        .dark-mode .form-control {
          background-color: #2d3748 !important;
          border-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        .dark-mode .form-control:focus {
          background-color: #2d3748 !important;
          border-color: #63b3ed !important;
          color: #e2e8f0 !important;
          box-shadow: 0 0 0 0.2rem rgba(99, 179, 237, 0.25) !important;
        }
        
        /* Enhanced Hover Effects */
        .enhanced-hover {
          transition: all 0.3s ease !important;
        }
        
        .enhanced-hover:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
        }
        
        .dark-mode .enhanced-hover:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Sidebar Styles */
        .sidebar { 
          width: 250px; 
          min-height: 100vh; 
        }
        
        .sidebar .nav-link { 
          color: rgba(255, 255, 255, 0.8); 
          padding: 0.75rem 1rem; 
          border: none; 
          background: none; 
          width: 100%; 
          text-align: left; 
          border-radius: 0; 
          transition: all 0.3s ease !important;
        }
        
        .sidebar .nav-link:hover { 
          color: white; 
          background-color: rgba(255, 255, 255, 0.1); 
          transform: translateX(5px) !important;
        }
        
        .sidebar .nav-link.active { 
          color: white; 
          background-color: #3b82f6; 
        }
        
        /* Card Hover Effects */
        .card.enhanced-hover:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        
        .dark-mode .card.enhanced-hover:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Progress Bar Animations */
        .progress-bar {
          transition: width 0.6s ease;
        }
        
        /* Badge Animations */
        .badge {
          transition: all 0.2s ease;
        }
        
        .badge:hover {
          transform: scale(1.05);
        }
        
        /* Button Hover Effects */
        .btn {
          transition: all 0.2s ease;
        }
        
        .btn:hover {
          transform: translateY(-1px);
        }
        
        /* Table Row Hover */
        .table-hover tbody tr:hover {
          background-color: rgba(59, 130, 246, 0.05) !important;
        }
        
        .dark-mode .table-hover tbody tr:hover {
          background-color: rgba(99, 179, 237, 0.1) !important;
        }
        
        /* Custom Scrollbar */
        .sidebar {
          scrollbar-width: thin;
          scrollbar-color: #4a5568 #2d3748;
        }
        
        .sidebar::-webkit-scrollbar {
          width: 6px;
        }
        
        .sidebar::-webkit-scrollbar-track {
          background: #2d3748;
        }
        
        .sidebar::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 3px;
        }
        
        /* Animation for stats cards */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card {
          animation: slideInUp 0.3s ease-out;
        }
        
        /* Notification badge pulse */
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .badge.bg-danger {
          animation: pulse 2s infinite;
        }
      `}</style>
    </>
  );
}

export default function OwnerDashboardWithProvider() {
  return (
    <DarkModeProvider>
      <OwnerDashboard />
    </DarkModeProvider>
  );
}