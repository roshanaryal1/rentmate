import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getCountFromServer,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Container, Row, Col, Card, Badge, Dropdown, Button, Form, InputGroup } from 'react-bootstrap';

// Recharts for reports/charts
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

// Icon imports
import { 
  Bell, 
  Flag, 
  ArrowDown, 
  Building, 
  People, 
  Tools, 
  FileEarmark, 
  HouseDoor, 
  Gear, 
  GraphUp, 
  CheckCircle, 
  Person, 
  Search,
  BoxArrowRight 
} from 'react-bootstrap-icons';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [metrics, setMetrics] = useState({
    properties: 0,
    occupied: 0,
    activeRenters: 0,
    inactiveRenters: 0,
    loading: true
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Demo/mock data for properties and renters (replace with real data)
  const [properties, setProperties] = useState([]);
  const [renters, setRenters] = useState([]);

  // Reports chart mock data (replace with real Firestore data)
  const chartData = [
    { month: 'Jan', properties: 20 },
    { month: 'Feb', properties: 23 },
    { month: 'Mar', properties: 25 },
    { month: 'Apr', properties: 28 },
    { month: 'May', properties: 30 },
    { month: 'Jun', properties: 33 }
  ];

  // Fetch real-time data from Firestore
  useEffect(() => {
    const unsubs = [];
    try {
      // Properties count
      const fetchProperties = async () => {
        const propertiesRef = collection(db, 'equipment');
        const propertiesSnapshot = await getCountFromServer(propertiesRef);
        const total = propertiesSnapshot.data().count;

        // Occupied properties
        const occupiedQuery = query(
          collection(db, 'equipment'),
          where('available', '==', false)
        );
        const occupiedSnapshot = await getCountFromServer(occupiedQuery);
        const occupied = occupiedSnapshot.data().count;

        setMetrics(prev => ({
          ...prev,
          properties: total,
          occupied: occupied
        }));

        // Demo: fetch all properties (for Properties tab)
        const allPropsSnapshot = await getDocs(propertiesRef);
        setProperties(allPropsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchProperties();

      // Renters count & demo fetch
      const rentersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'renter')
      );

      const rentersUnsub = onSnapshot(rentersQuery, async (snapshot) => {
        const total = snapshot.size;
        // Demo: fetch all renters for Renters tab
        setRenters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Active renters (with at least one active rental)
        const activeRentersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'renter'),
          where('hasActiveRental', '==', true)
        );
        try {
          const activeSnapshot = await getDocs(activeRentersQuery);
          const active = activeSnapshot.size;

          setMetrics(prev => ({
            ...prev,
            activeRenters: active,
            inactiveRenters: total - active,
            loading: false
          }));
        } catch (err) {
          setMetrics(prev => ({
            ...prev,
            activeRenters: 0,
            inactiveRenters: total,
            loading: false
          }));
        }
      });
      unsubs.push(rentersUnsub);

      // Recent activity
      const activityQuery = query(
        collection(db, 'activity'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const activityUnsub = onSnapshot(activityQuery, (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setRecentActivity(activities);
      });
      unsubs.push(activityUnsub);

      // Notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipients', 'array-contains', 'admin'),
        orderBy('timestamp', 'desc'),
        limit(3)
      );
      const notificationsUnsub = onSnapshot(notificationsQuery, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setNotifications(notifs);
      });
      unsubs.push(notificationsUnsub);

    } catch (err) {
      setError('Failed to load dashboard data');
      setMetrics(prev => ({ ...prev, loading: false }));
    }
    return () => unsubs.forEach(unsub => unsub && unsub());
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Logout failed. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const now = new Date();
    const diff = now - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'new_renter':
        return <Bell className="me-2 text-primary" />;
      case 'maintenance':
        return <Tools className="me-2 text-warning" />;
      case 'lease':
        return <FileEarmark className="me-2 text-success" />;
      case 'property':
        return <Building className="me-2 text-info" />;
      default:
        return <CheckCircle className="me-2 text-secondary" />;
    }
  };

  const toggleNotifications = () => setShowNotifications(!showNotifications);

  // Sidebar navigation items
  const navItems = [
    { label: 'Dashboard', icon: <HouseDoor /> },
    { label: 'Properties', icon: <Building /> },
    { label: 'Renters', icon: <People /> },
    { label: 'Maintenance', icon: <Tools /> },
    { label: 'Approvals', icon: <CheckCircle /> },
    { label: 'Reports', icon: <GraphUp /> },
    { label: 'Settings', icon: <Gear /> }
  ];

  // Filtered data for Properties/Renters tab
  const filteredProperties = properties.filter(
    prop => prop.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredRenters = renters.filter(
    renter => (renter.displayName || renter.email)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container d-flex">
      {/* Sidebar */}
      <div className="sidebar bg-dark text-white">
        <div className="d-flex align-items-center p-3 mb-3">
          <Building size={24} className="text-primary me-2" />
          <h4 className="m-0">RentMate</h4>
        </div>
        <ul className="nav flex-column">
          {navItems.map((item, index) => (
            <li key={index} className="nav-item">
              <button
                className={`nav-link d-flex align-items-center ${activeTab === item.label ? 'active' : ''}`}
                onClick={() => setActiveTab(item.label)}
              >
                <span className="icon me-3">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content flex-grow-1">
        {/* Header */}
        <header className="dashboard-header bg-white d-flex justify-content-between align-items-center p-3 shadow-sm">
          <h4>{activeTab}</h4>
          <div className="d-flex align-items-center">
            <InputGroup className="me-3" style={{ maxWidth: 220 }}>
              <Form.Control
                placeholder={`Search ${activeTab === 'Properties' ? 'properties' : activeTab === 'Renters' ? 'renters' : '...'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-secondary">
                <Search />
              </Button>
            </InputGroup>
            <div className="position-relative me-3">
              <Button 
                variant="link" 
                className="position-relative"
                onClick={toggleNotifications}
              >
                <Bell size={20} />
                <Badge 
                  bg="danger" 
                  className="position-absolute top-0 start-100 translate-middle rounded-pill"
                >
                  {notifications.length}
                </Badge>
              </Button>
              {/* Notifications Panel */}
              {showNotifications && (
                <div className="notifications-panel">
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <h5 className="m-0">
                      <Bell className="me-2" /> Notifications
                    </h5>
                    <Button 
                      variant="link" 
                      className="text-secondary p-0"
                      onClick={toggleNotifications}
                    >
                      &times;
                    </Button>
                  </div>
                  <div className="notifications-body">
                    {notifications.map(notif => (
                      <div key={notif.id} className="notification-item p-3 border-bottom">
                        <div className="d-flex align-items-center">
                          {notif.severity === 'critical' ? <Flag className="text-danger me-2" /> : <Bell className="me-2 text-primary" />}
                          <div>
                            <div>
                              <strong>{notif.title || "Notification"}</strong>
                              <span className="ms-2 text-muted">{notif.senderName || ""}</span>
                            </div>
                            <p className="mb-1">{notif.message}</p>
                            <small className="text-muted">{formatTimestamp(notif.timestamp)}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="p-2 text-center">
                      <Button variant="link">View all</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Dropdown>
              <Dropdown.Toggle variant="link" className="p-0">
                <img 
                  src={currentUser?.photoURL || "/assets/default-avatar.png"} 
                  alt="Profile" 
                  className="avatar rounded-circle"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/32";
                  }}
                  style={{ width: 32, height: 32 }}
                />
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item onClick={() => navigate('/profile')}>
                  <Person className="me-2" /> Profile
                </Dropdown.Item>
                <Dropdown.Item onClick={() => navigate('/settings')}>
                  <Gear className="me-2" /> Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <BoxArrowRight className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <div className="dashboard-body p-4">
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          {/* --------- DASHBOARD TAB --------- */}
          {activeTab === 'Dashboard' && (
            <>
              {/* Stats Cards */}
              <Row className="mb-4">
                <Col md={6} lg={3} className="mb-3">
                  <Card className="stats-card">
                    <Card.Body>
                      <h2 className="display-4">{metrics.loading ? '...' : metrics.properties}</h2>
                      <p className="text-muted">Total Properties</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <Card className="stats-card">
                    <Card.Body>
                      <h2 className="display-4">{metrics.loading ? '...' : metrics.occupied}</h2>
                      <p className="text-muted">Occupied</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <Card className="stats-card">
                    <Card.Body>
                      <h2 className="display-4">
                        {metrics.loading ? '...' : metrics.properties - metrics.occupied}
                      </h2>
                      <p className="text-muted">Vacant</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <Card className="stats-card">
                    <Card.Body>
                      <h2 className="display-4">
                        {metrics.loading ? '...' : (metrics.properties > 0 ? Math.round((metrics.occupied / metrics.properties) * 100) : 0)}%
                      </h2>
                      <p className="text-muted">Occupancy Rate</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Recent Activity */}
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">Recent Activity</h5>
                    </Card.Header>
                    <Card.Body>
                      {recentActivity.length > 0 ? (
                        <ul className="activity-list list-unstyled">
                          {recentActivity.map(activity => (
                            <li key={activity.id} className="d-flex align-items-center mb-3">
                              {getActivityIcon(activity.type)}
                              <div>
                                <div>
                                  <strong>{activity.userName || "User"}</strong> {activity.description}
                                  {activity.equipmentName && (
                                    <> <span className="text-info">({activity.equipmentName})</span></>
                                  )}
                                </div>
                                <small className="text-muted">{formatTimestamp(activity.timestamp)}</small>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-center text-muted">No recent activity</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Renters Overview */}
              <Row>
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">Renters Overview</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Active</span>
                        <span>{metrics.activeRenters}</span>
                      </div>
                      <div className="progress mb-4">
                        <div 
                          className="progress-bar bg-primary" 
                          style={{ 
                            width: `${metrics.activeRenters + metrics.inactiveRenters > 0 ? 
                              (metrics.activeRenters / (metrics.activeRenters + metrics.inactiveRenters)) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Inactive</span>
                        <span>{metrics.inactiveRenters}</span>
                      </div>
                      <div className="progress">
                        <div 
                          className="progress-bar bg-secondary" 
                          style={{ 
                            width: `${metrics.activeRenters + metrics.inactiveRenters > 0 ? 
                              (metrics.inactiveRenters / (metrics.activeRenters + metrics.inactiveRenters)) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* --------- PROPERTIES TAB --------- */}
          {activeTab === 'Properties' && (
            <>
              <h5>All Properties</h5>
              <Row>
                {filteredProperties.length > 0 ? (
                  filteredProperties.map(prop => (
                    <Col key={prop.id} md={6} lg={4} className="mb-3">
                      <Card>
                        <Card.Body>
                          <h6>{prop.name || "Unnamed Property"}</h6>
                          <div>
                            <span className="text-muted">{prop.type || "Type N/A"}</span>
                          </div>
                          <div>
                            <Badge bg={prop.available ? "success" : "danger"}>
                              {prop.available ? "Available" : "Occupied"}
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <Col>
                    <p>No properties found.</p>
                  </Col>
                )}
              </Row>
            </>
          )}

          {/* --------- RENTERS TAB --------- */}
          {activeTab === 'Renters' && (
            <>
              <h5>All Renters</h5>
              <Row>
                {filteredRenters.length > 0 ? (
                  filteredRenters.map(renter => (
                    <Col key={renter.id} md={6} lg={4} className="mb-3">
                      <Card>
                        <Card.Body>
                          <h6>{renter.displayName || renter.email}</h6>
                          <div>
                            <span className="text-muted">{renter.email}</span>
                          </div>
                          <div>
                            <Badge bg={renter.hasActiveRental ? "primary" : "secondary"}>
                              {renter.hasActiveRental ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <Col>
                    <p>No renters found.</p>
                  </Col>
                )}
              </Row>
            </>
          )}

          {/* --------- MAINTENANCE TAB --------- */}
          {activeTab === 'Maintenance' && (
            <>
              <h5>Maintenance Requests</h5>
              <p>Maintenance section coming soon!</p>
            </>
          )}

          {/* --------- APPROVALS TAB --------- */}
          {activeTab === 'Approvals' && (
            <>
              <h5>Pending Approvals</h5>
              <p>Approvals section coming soon!</p>
            </>
          )}

          {/* --------- REPORTS TAB --------- */}
          {activeTab === 'Reports' && (
            <>
              <h5>Reports & Analytics</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="properties" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-muted mt-2">Property growth over months (demo data)</p>
            </>
          )}

          {/* --------- SETTINGS TAB --------- */}
          {activeTab === 'Settings' && (
            <>
              <h5>Settings</h5>
              <Button onClick={() => navigate('/settings')}>
                Go to Settings Page
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
