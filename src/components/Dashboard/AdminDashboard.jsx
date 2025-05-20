import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import PropTypes from 'prop-types';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  House, 
  Cart4,
  People,
  BarChart,
  Building,
  Gear,
  Search,
  List,
  X,
  CalendarCheck,
  ClockHistory
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Constants
const DASHBOARD_CONSTANTS = {
  ICON_SIZE: 24,
  TAB_ICONS: {
    Overview: House,
    Inventory: Cart4,
    Customers: People,
    Analytics: BarChart,
    Reservations: CalendarCheck,
    History: ClockHistory,
    Settings: Gear
  },
  STATUS_VARIANTS: {
    Active: 'success',
    Pending: 'warning',
    Maintenance: 'secondary',
    Inactive: 'danger',
    Default: 'secondary'
  }
};

// StatCard Component
const StatCard = ({ Icon, value, label, loading }) => (
  <Card className="h-100 shadow-sm border-0">
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

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, show, handleClose }) => (
  <Offcanvas show={show} onHide={handleClose} backdrop={false} scroll={true} className="bg-white border-end">
    <Offcanvas.Header>
      <Offcanvas.Title className="d-flex align-items-center">
        <Building size={DASHBOARD_CONSTANTS.ICON_SIZE} className="text-primary me-2" />
        <span>EquipHire Pro</span>
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

// RecentRentalsTable Component
const RecentRentalsTable = ({ rentals, loading, searchTerm }) => {
  const filteredRentals = () => {
    if (!searchTerm.trim()) return rentals;
    
    const lowerSearch = searchTerm.toLowerCase();
    return rentals.filter(rental =>
      rental.equipmentName?.toLowerCase().includes(lowerSearch) ||
      rental.customerName?.toLowerCase().includes(lowerSearch)
    );
  };
  
  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
      </div>
    );
  }
  
  if (!filteredRentals().length) {
    return <Alert variant="info">No recent rentals found</Alert>;
  }
  
  return (
    <Table hover responsive className="mb-0">
      <thead className="table-light">
        <tr>
          <th>Equipment</th>
          <th>Customer</th>
          <th>Rental Date</th>
          <th>Return Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {filteredRentals().map(rental => (
          <tr key={rental.id}>
            <td className="d-flex align-items-center">
              <Cart4 className="me-2 text-primary" />
              {rental.equipmentName}
            </td>
            <td>{rental.customerName}</td>
            <td>{format(new Date(rental.rentalDate), 'MMM dd, yyyy')}</td>
            <td>{rental.returnDate ? format(new Date(rental.returnDate), 'MMM dd, yyyy') : '-'}</td>
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

// DashboardHeader Component
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
      EquipHire Admin
    </Navbar.Brand>
    <div className="d-flex align-items-center ms-auto">
      <Form className="me-3">
        <InputGroup>
          <Form.Control 
            size="sm" 
            placeholder="Search..." 
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Button variant="outline-secondary" size="sm">
            <Search />
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

// RevenueChart Component
const RevenueChart = ({ data }) => (
  <Card className="shadow-sm border-0">
    <Card.Header className="d-flex justify-content-between align-items-center">
      <h5 className="mb-0">Revenue Trend</h5>
      <span className="text-muted">Last 6 months</span>
    </Card.Header>
    <Card.Body>
      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(value) => `$${value}`} />
        <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
        <Legend />
        <Line type="monotone" dataKey="uv" stroke="#4e73df" activeDot={{ r: 8 }} strokeWidth={2} />
      </LineChart>
    </Card.Body>
  </Card>
);

// Main Dashboard Component
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [metrics, setMetrics] = useState({ 
    inventory: 0, 
    customers: 0, 
    revenue: 0,
    loading: true
  });
  const [recentRentals, setRecentRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 992);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Firebase Subscriptions
  useEffect(() => {
    setMetrics(prev => ({ ...prev, loading: true }));
    setRentalsLoading(true);
    setError(null);

    const errorHandler = (err) => {
      console.error("Firebase error:", err);
      setError("Failed to load dashboard data");
      setMetrics(prev => ({ ...prev, loading: false }));
      setRentalsLoading(false);
    };

    try {
      const unsubInventory = onSnapshot(
        collection(db, 'equipment'),
        snap => setMetrics(m => ({ ...m, inventory: snap.size })),
        errorHandler
      );

      const unsubCustomers = onSnapshot(
        query(collection(db, 'customers')),
        snap => setMetrics(m => ({ ...m, customers: snap.size })),
        errorHandler
      );

      const unsubRevenue = onSnapshot(
        collection(db, 'rentals'),
        snap => {
          const total = snap.docs.reduce((sum, d) => sum + (d.data().totalPrice || 0), 0);
          setMetrics(m => ({ ...m, revenue: total, loading: false }));
        },
        errorHandler
      );

      const unsubRecent = onSnapshot(
        query(collection(db, 'rentals'), orderBy('rentalDate', 'desc'), limit(5)),
        snap => {
          const rentals = snap.docs.map(d => {
            const data = d.data();
            return { 
              id: d.id,
              equipmentName: data.equipmentName || 'Unknown Equipment',
              customerName: data.customerName || 'Unknown Customer',
              rentalDate: data.rentalDate || new Date(),
              returnDate: data.returnDate || null,
              status: data.status || 'Pending',
              totalPrice: data.totalPrice || 0
            };
          });
          setRecentRentals(rentals);
          setRentalsLoading(false);
        },
        errorHandler
      );

      return () => {
        unsubInventory();
        unsubCustomers();
        unsubRevenue();
        unsubRecent();
      };
    } catch (err) {
      errorHandler(err);
    }
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
      navigate('/login');
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed. Please try again.");
    }
  };

  const handleSearch = (query) => {
    setSearchTerm(query);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (window.innerWidth <= 992) {
      setSidebarOpen(false);
    }
  };

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
                    value={metrics.inventory} 
                    label="Total Equipment" 
                    loading={metrics.loading}
                  />
                </Col>
                <Col xs={12} md={4}>
                  <StatCard 
                    Icon={People} 
                    value={metrics.customers} 
                    label="Total Customers" 
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
              
              <Row className="g-4">
                <Col xs={12} lg={8}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header>
                      <h5 className="mb-0">Recent Rentals</h5>
                    </Card.Header>
                    <Card.Body>
                      <RecentRentalsTable 
                        rentals={recentRentals} 
                        loading={rentalsLoading} 
                        searchTerm={searchTerm}
                      />
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} lg={4}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Header>
                      <h5 className="mb-0">Quick Actions</h5>
                    </Card.Header>
                    <Card.Body className="d-grid gap-3">
                      <Button variant="primary" size="lg">
                        <Cart4 className="me-2" /> Add New Equipment
                      </Button>
                      <Button variant="outline-primary" size="lg">
                        <CalendarCheck className="me-2" /> View All Reservations
                      </Button>
                      <Button variant="outline-primary" size="lg">
                        <People className="me-2" /> Manage Customers
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {activeTab === 'Inventory' && (
            <Row>
              <Col xs={12}>
                <Card className="shadow-sm border-0">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Equipment Inventory</h5>
                    <Button variant="primary">
                      <Cart4 className="me-2" /> Add New Equipment
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <Alert variant="info">This section will display the full equipment inventory.</Alert>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {activeTab === 'Customers' && (
            <Row>
              <Col xs={12}>
                <Card className="shadow-sm border-0">
                  <Card.Header>
                    <h5 className="mb-0">Customer Management</h5>
                  </Card.Header>
                  <Card.Body>
                    <Alert variant="info">Manage registered customers here.</Alert>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {activeTab === 'Analytics' && (
            <Row>
              <Col xs={12}>
                <RevenueChart data={chartData()} />
              </Col>
            </Row>
          )}

          {['Reservations', 'History'].includes(activeTab) && (
            <Alert variant="info">{activeTab} section is under development</Alert>
          )}

          {activeTab === 'Settings' && (
            <Row>
              <Col xs={12} md={8} lg={6}>
                <Card className="shadow-sm border-0">
                  <Card.Header>
                    <h5 className="mb-0">Account Settings</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Business Name</Form.Label>
                        <Form.Control type="text" defaultValue="EquipHire Pro" />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control type="email" defaultValue="admin@equiphire.com" />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control type="tel" defaultValue="+1 (555) 123-4567" />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control as="textarea" rows={3} defaultValue="123 Equipment St, Rent City, RC 12345" />
                      </Form.Group>
                      <Button variant="primary" type="submit">Save Changes</Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    </div>
  );
}

AdminDashboard.propTypes = {
  // Add any props if needed
};