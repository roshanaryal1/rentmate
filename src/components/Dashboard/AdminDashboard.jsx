import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
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
  PersonCircle
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
  Image
} from 'react-bootstrap';

const ICON_SIZE = 24;

// Map tab names to icons
const TAB_ICONS = {
  Overview: House,
  Equipment: Cart4,
  Users: People,
  Rentals: Check2All,
  Analytics: BarChart,
  Settings: Gear
};

// Badge variant mapping
const STATUS_VARIANTS = {
  Returned: 'success',
  Pending: 'warning',
  Overdue: 'danger'
};

const StatCard = ({ Icon, value, label }) => (
  <Card className="h-100 shadow-sm">
    <Card.Body className="d-flex align-items-center">
      <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
        <Icon size={ICON_SIZE} className="text-primary" />
      </div>
      <div>
        <h3 className="mb-0">{value}</h3>
        <small className="text-muted">{label}</small>
      </div>
    </Card.Body>
  </Card>
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [metrics, setMetrics] = useState({ equipment: 0, users: 0, revenue: 0 });
  const [recentRentals, setRecentRentals] = useState([]);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubEquip = onSnapshot(collection(db, 'equipment'), snap =>
      setMetrics(m => ({ ...m, equipment: snap.size }))
    );
    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'renter')),
      snap => setMetrics(m => ({ ...m, users: snap.size }))
    );
    const unsubRevenue = onSnapshot(collection(db, 'rentals'), snap => {
      const total = snap.docs.reduce((sum, d) => sum + (d.data().price || 0), 0);
      setMetrics(m => ({ ...m, revenue: total }));
    });
    const unsubRecent = onSnapshot(
      query(collection(db, 'rentals'), orderBy('startDate', 'desc'), limit(5)),
      snap => setRecentRentals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => [unsubEquip, unsubUsers, unsubRevenue, unsubRecent].forEach(fn => fn());
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar */}
      <Offcanvas show={true} backdrop={false} scroll={true} className="bg-white border-end">
        <Offcanvas.Header closeButton={false}>
          <Offcanvas.Title>
            <Building size={ICON_SIZE} className="text-primary me-2" />
            RentMate
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="pt-0">
          <Nav variant="pills" className="flex-column">
            {Object.keys(TAB_ICONS).map(tab => {
              const Icon = TAB_ICONS[tab];
              return (
                <Nav.Item key={tab}>
                  <Nav.Link
                    active={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className="d-flex align-items-center"
                  >
                    <Icon size={ICON_SIZE} className="me-2" />
                    {tab}
                  </Nav.Link>
                </Nav.Item>
              );
            })}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Header */}
        <Navbar bg="white" expand={false} className="border-bottom px-3">
          <Navbar.Brand as="h2" className="mb-0">
            Admin Dashboard
          </Navbar.Brand>
          <div className="d-flex align-items-center ms-auto">
            <Form className="me-3">
              <InputGroup>
                <Form.Control size="sm" placeholder="Search..." />
                <Button variant="outline-secondary" size="sm">
                  <House />
                </Button>
              </InputGroup>
            </Form>
            <Nav>
              <Nav.Link onClick={handleLogout} className="position-relative p-0">
                <Image
                  src={currentUser?.photoURL}
                  roundedCircle
                  width={32}
                  height={32}
                  className="border"
                />
              </Nav.Link>
            </Nav>
          </div>
        </Navbar>

        {/* Tabs */}
        <Nav
          variant="tabs"
          activeKey={activeTab}
          onSelect={k => setActiveTab(k)}
          className="px-3 mt-2"
        >
          {Object.keys(TAB_ICONS).map(tab => (
            <Nav.Item key={tab}>
              <Nav.Link eventKey={tab}>{tab}</Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        {/* Content */}
        <Container fluid className="pt-4 overflow-auto">
          {activeTab === 'Overview' && (
            <>
              <Row className="g-4 mb-4">
                <Col xs={12} md={4}>
                  <StatCard Icon={Cart4} value={metrics.equipment} label="Total Equipment" />
                </Col>
                <Col xs={12} md={4}>
                  <StatCard Icon={People} value={metrics.users} label="Total Users" />
                </Col>
                <Col xs={12} md={4}>
                  <StatCard
                    Icon={BarChart}
                    value={`$${metrics.revenue.toLocaleString()}`}
                    label="Total Revenue"
                  />
                </Col>
              </Row>

              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">Recent Rentals</h5>
                </Card.Header>
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
                    {recentRentals.map(r => (
                      <tr key={r.id}>
                        <td className="d-flex align-items-center">
                          <Cart4 className="me-2 text-primary" />
                          {r.equipmentName}
                        </td>
                        <td>{r.renterName}</td>
                        <td>{r.ownerName}</td>
                        <td>{new Date(r.startDate).toLocaleDateString()}</td>
                        <td>
                          <Badge bg={STATUS_VARIANTS[r.status] || 'secondary'}>
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </>
          )}

          {/* TODO: implement other tabs (Equipment, Users, etc.) */}
        </Container>
      </div>
    </div>
  );
}
