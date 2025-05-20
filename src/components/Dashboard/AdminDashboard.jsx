import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import PropTypes from 'prop-types';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  House,
  Gear,
  Cart4,
  People,
  Check2All,
  BarChart,
  Building,
  PersonCircle,
  List,
  X
} from 'react-bootstrap-icons';
import {
  Container,
  Row,
  Col,
  Navbar,
  Nav,
  Offcanvas,
  Card,
  Table,
  Badge,
  Form,
  InputGroup,
  Button,
  Image,
  Spinner,
  Alert
} from 'react-bootstrap';
import { format } from 'date-fns';

// Constants moved to separate object
const DASHBOARD_CONSTANTS = {
  ICON_SIZE: 24,
  TAB_ICONS: {
    Overview: House,
    Equipment: Cart4,
    Users: People,
    Rentals: Check2All,
    Analytics: BarChart,
    Settings: Gear
  },
  STATUS_VARIANTS: {
    Returned: 'success',
    Pending: 'warning',
    Overdue: 'danger',
    Default: 'secondary'
  }
};

// Extracted StatCard component with PropTypes
const StatCard = ({ Icon, value, label, loading }) => (
  <Card className="h-100 shadow-sm">
    <Card.Body className="d-flex align-items-center">
      <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
        <Icon size={DASHBOARD_CONSTANTS.ICON_SIZE} className="text-primary" />
      </div>
      <div>
        <h3 className="mb-0">
          {loading ? <Spinner animation="border" size="sm" /> : value}
        </h3>
        <small className="text-muted">{label}</small>
      </div>
    </Card.Body>
  </Card>
);

StatCard.propTypes = {
  Icon: PropTypes.elementType.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string.isRequired,
  loading: PropTypes.bool
};

// Extracted Sidebar component
const Sidebar = ({ activeTab, setActiveTab, show, handleClose }) => (
  <Offcanvas show={show} onHide={handleClose} backdrop={false} scroll={true} className="bg-white border-end">
    <Offcanvas.Header>
      <Offcanvas.Title className="d-flex align-items-center">
        <Building size={DASHBOARD_CONSTANTS.ICON_SIZE} className="text-primary me-2" />
        <span>RentMate</span>
      </Offcanvas.Title>
      <Button 
        variant="link" 
        onClick={handleClose} 
        className="p-0 ms-auto"
        aria-label="Close sidebar"
      >
        <X size={20} />
      </Button>
    </Offcanvas.Header>
    <Offcanvas.Body className="pt-0">
      <Nav variant="pills" className="flex-column">
        {Object.keys(DASHBOARD_CONSTANTS.TAB_ICONS).map(tab => {
          const Icon = DASHBOARD_CONSTANTS.TAB_ICONS[tab];
          return (
            <Nav.Item key={tab}>
              <Nav.Link
                active={activeTab === tab}
                onClick={() => {
                  setActiveTab(tab);
                  handleClose();
                }}
                className="d-flex align-items-center"
                eventKey={tab}
              >
                <Icon size={DASHBOARD_CONSTANTS.ICON_SIZE} className="me-2" />
                {tab}
              </Nav.Link>
            </Nav.Item>
          );
        })}
      </Nav>
    </Offcanvas.Body>
  </Offcanvas>
);

Sidebar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
};

// Extracted RecentRentalsTable component
const RecentRentalsTable = ({ rentals, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!rentals.length) {
    return <Alert variant="info">No recent rentals found</Alert>;
  }

  return (
    <Table hover responsive className="mb-0">
      <thead className="table-light">
        <tr>
          <th>Equipment</th>
          <th>Renter</th>
          <th>Owner</th>
          <th>Dates</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rentals.map(rental => (
          <tr key={rental.id}>
            <td className="d-flex align-items-center">
              <Cart4 className="me-2 text-primary" />
              {rental.equipmentName}
            </td>
            <td>{rental.renterName}</td>
            <td>{rental.ownerName}</td>
            <td>{format(new Date(rental.startDate), 'MMM dd, yyyy')}</td>
            <td>
              <Badge 
                bg={DASHBOARD_CONSTANTS.STATUS_VARIANTS[rental.status] || 
                    DASHBOARD_CONSTANTS.STATUS_VARIANTS.Default}
              >
                {rental.status}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

RecentRentalsTable.propTypes = {
  rentals: PropTypes.array.isRequired,
  loading: PropTypes.bool
};

// Extracted DashboardHeader component
const DashboardHeader = ({ currentUser, handleLogout, handleSearch, toggleSidebar }) => (
  <Navbar bg="white" expand={false} className="border-bottom px-3">
    <Button 
      variant="outline-secondary" 
      onClick={toggleSidebar}
      className="me-3 d-lg-none"
      aria-label="Toggle sidebar"
    >
      <List size={20} />
    </Button>
    <Navbar.Brand as="h2" className="mb-0">
      Admin Dashboard
    </Navbar.Brand>
    <div className="d-flex align-items-center ms-auto">
      <Form className="me-3 d-none d-md-block">
        <InputGroup>
          <Form.Control 
            size="sm" 
            placeholder="Search..." 
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Button variant="outline-secondary" size="sm">
            <House />
          </Button>
        </InputGroup>
      </Form>
      <Nav>
        <Nav.Link onClick={handleLogout} className="position-relative p-0">
          <Image
            src={currentUser?.photoURL || '/default-user.png'}
            roundedCircle
            width={32}
            height={32}
            className="border"
            alt="User profile"
          />
        </Nav.Link>
      </Nav>
    </div>
  </Navbar>
);

DashboardHeader.propTypes = {
  currentUser: PropTypes.object,
  handleLogout: PropTypes.func.isRequired,
  handleSearch: PropTypes.func.isRequired,
  toggleSidebar: PropTypes.func.isRequired
};

// Main Dashboard Component
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [metrics, setMetrics] = useState({ 
    equipment: 0, 
    users: 0, 
    revenue: 0,
    loading: true,
  });
  const [recentRentals, setRecentRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 992);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate(); // Use React Router's navigate hook

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMetrics(prev => ({ ...prev, loading: true }));
    setRentalsLoading(true);
    setError(null);

    const subscriptions = [];
    const errorHandler = (err) => {
      console.error("Firebase error:", err);
      setError("Failed to load dashboard data");
      setMetrics(prev => ({ ...prev, loading: false }));
      setRentalsLoading(false);
    };

    try {
      // Equipment count
      const unsubEquip = onSnapshot(
        collection(db, 'equipment'),
        snap => setMetrics(m => ({ ...m, equipment: snap.size })),
        errorHandler
      );
      subscriptions.push(unsubEquip);

      // Users count
      const unsubUsers = onSnapshot(
        query(collection(db, 'users'), where('role', '==', 'renter')),
        snap => setMetrics(m => ({ ...m, users: snap.size })),
        errorHandler
      );
      subscriptions.push(unsubUsers);

      // Revenue calculation
      const unsubRevenue = onSnapshot(
        collection(db, 'rentals'),
        snap => {
          const total = snap.docs.reduce((sum, d) => sum + (d.data().price || 0), 0);
          setMetrics(m => ({ ...m, revenue: total, loading: false }));
        },
        errorHandler
      );
      subscriptions.push(unsubRevenue);

      // Recent rentals
      const unsubRecent = onSnapshot(
        query(collection(db, 'rentals'), orderBy('startDate', 'desc'), limit(5)),
        snap => {
          setRecentRentals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setRentalsLoading(false);
        },
        errorHandler
      );
      subscriptions.push(unsubRecent);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setMetrics((prev) => ({ ...prev, loading: false }));
      setRentalsLoading(false);
    }

    return () => subscriptions.forEach(unsub => unsub());
  }, []);

  // Format currency
  const formattedRevenue = metrics.revenue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  });

  // Generate chart data
  const chartData = () => {
    const revenueByMonth = {};
    const now = new Date();
    
    // Initialize with last 6 months
    for (let i = 6; i >= 1; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = format(date, 'MMM yyyy');
      revenueByMonth[monthKey] = 0;
    }
    
    // Add data from rentals
    recentRentals.forEach(rental => {
      const date = new Date(rental.rentalDate);
      const monthKey = format(date, 'MMM yyyy');
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + rental.totalPrice;
    });

    // Convert to array and sort by date
    const sortedData = Object.entries(revenueByMonth)
      .map(([name, uv]) => ({ name, uv }))
      .sort((a, b) => new Date(a.name) - new Date(b.name));
      
    return sortedData;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Use navigate instead of window.location
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed. Please try again.");
    }
  };

  const handleSearch = (query) => {
    // Implement search functionality
    console.log("Search query:", query);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (window.innerWidth <= 992) {
      setSidebarOpen(false);
    }
  };

  const formattedRevenue = useMemo(() => {
    return metrics.revenue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    });
  }, [metrics.revenue]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-white shadow-lg md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-xl font-bold">RentMate</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-500 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-4 px-4">
          {Object.keys(tabIcons).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center w-full px-4 py-2 mt-2 rounded-md capitalize ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tabIcons[tab]}
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 focus:outline-none md:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-700">Admin Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <img
              src={currentUser?.photoURL || 'https://i.pravatar.cc/60'}
              alt="Profile"
              className="w-8 h-8 rounded-full border border-gray-300"
            />
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded">
              {error}
            </div>
          )}

          {activeTab === 'Overview' && (
            <>
              <Row className="g-4 mb-4">
                <Col xs={12} md={4}>
                  <StatCard 
                    Icon={Cart4} 
                    value={metrics.equipment} 
                    label="Total Equipment" 
                    loading={metrics.loading}
                  />
                </Col>
                <Col xs={12} md={4}>
                  <StatCard 
                    Icon={People} 
                    value={metrics.users} 
                    label="Total Users" 
                    loading={metrics.loading}
                  />
                </Col>
                <Col xs={12} md={4}>
                  <StatCard
                    Icon={BarChart}
                    value={formattedRevenue}
                    label="Total Revenue"
                    loading={metrics.loading}
                  />
                </Col>
              </Row>

              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">Recent Rentals</h5>
                </Card.Header>
                <Card.Body>
                  <RecentRentalsTable rentals={recentRentals} loading={rentalsLoading} />
                </Card.Body>
              </Card>
            </>
          )}

          {activeTab !== 'Overview' && (
            <Alert variant="info">
              {activeTab} section is under development
            </Alert>
          )}
        </Container>
      </div>
    </div>
  );
}

// RecentRentalsTable Component
function RecentRentalsTable({ rentals, loading, statusColors }) {
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!rentals.length) {
    return <p className="text-sm text-gray-500">No recent rentals found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Equipment</th>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Renter</th>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Owner</th>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rentals.map((rental) => (
            <tr key={rental.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4zm0 2h12v10H4V5z" />
                  </svg>
                  {rental.equipmentName || 'N/A'}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{rental.renterName || 'Unknown'}</td>
              <td className="px-4 py-3 whitespace-nowrap">{rental.ownerName || 'Unknown'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {rental.startDate ? new Date(rental.startDate).toLocaleDateString() : 'Unknown'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${statusColors[rental.status] || 'bg-gray-100 text-gray-800'}`}>
                  {rental.status || 'Unknown'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Custom SVG Icons
function CartIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.993.993 0 00.01.042l1.358 5.43-.893.892C3.74 11.84 2 13.497 2 15a3 3 0 106 0c0-1.503-1.74-3.16-2.49-4.455l-.913-.913L9.44 9.44A1 1 0 0010 10v2a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1h-1a1 1 0 00-.707.293l-2.42 2.42a1 1 0 01-1.414 0L6.586 10A1 1 0 005.172 9.586l-.913-.913L3.74 7.26a1 1 0 01.042-.01 1 1 0 01.293-.144l1.358-.892L5 3.292A1 1 0 004.293 2H3z"></path>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0z"></path>
      <path d="M12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
    </svg>
  );
}