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
    loading: true
  });
  const [recentRentals, setRecentRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 992);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
      errorHandler(err);
    }

    return () => subscriptions.forEach(unsub => unsub());
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
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
    <div className="d-flex vh-100 bg-light">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        show={sidebarOpen} 
        handleClose={closeSidebar}
      />

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <DashboardHeader 
          currentUser={currentUser} 
          handleLogout={handleLogout} 
          handleSearch={handleSearch}
          toggleSidebar={toggleSidebar}
        />

        {/* Tabs */}
        <Nav
          variant="tabs"
          activeKey={activeTab}
          onSelect={k => setActiveTab(k)}
          className="px-3 mt-2"
        >
          {Object.keys(DASHBOARD_CONSTANTS.TAB_ICONS).map(tab => (
            <Nav.Item key={tab}>
              <Nav.Link eventKey={tab}>{tab}</Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        {/* Content */}
        <Container fluid className="pt-4 overflow-auto">
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
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

AdminDashboard.propTypes = {
  // Add any props if needed
};