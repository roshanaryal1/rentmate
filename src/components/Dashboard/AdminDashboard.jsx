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
      };
      
      fetchProperties();
      
      // Renters count
      const rentersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'renter')
      );
      
      const rentersUnsub = onSnapshot(rentersQuery, async (snapshot) => {
        const total = snapshot.size;
        
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
          console.error('Error fetching active renters:', err);
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
      console.error('Error fetching dashboard data:', err);
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
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // More than a day
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
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

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Mock sidebar navigation items
  const navItems = [
    { label: 'Dashboard', icon: <HouseDoor /> },
    { label: 'Properties', icon: <Building /> },
    { label: 'Renters', icon: <People /> },
    { label: 'Maintenance', icon: <Tools /> },
    { label: 'Approvals', icon: <CheckCircle /> },
    { label: 'Reports', icon: <GraphUp /> },
    { label: 'Settings', icon: <Gear /> }
  ];

  return (
    <div className="dashboard-container">
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
      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header bg-white d-flex justify-content-between align-items-center p-3 shadow-sm">
          <h4>Dashboard</h4>
          <div className="d-flex align-items-center">
            <InputGroup className="me-3">
              <Form.Control
                placeholder="Search..."
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
                          {notif.type === 'approval' ? (
                            <Flag className="text-warning me-2" />
                          ) : notif.type === 'alert' ? (
                            <ArrowDown className="text-danger me-2" />
                          ) : (
                            <Bell className="text-primary me-2" />
                          )}
                          <div>
                            <p className="mb-1">{notif.message}</p>
                            <small className="text-muted">
                              {formatTimestamp(notif.timestamp)}
                              {notif.recats && ` · ${notif.recats} recats ago`}
                            </small>
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
                />
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item>
                  <Person className="me-2" /> Profile
                </Dropdown.Item>
                <Dropdown.Item>
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
                  <h2 className="display-4">{metrics.loading ? '...' : metrics.occupied}</h2>
                  <p className="text-muted">Vacant</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3} className="mb-3">
              <Card className="stats-card">
                <Card.Body>
                  <h2 className="display-4">{metrics.loading ? '...' : (metrics.properties > 0 ? Math.round((metrics.occupied / metrics.properties) * 100) : 0)}%</h2>
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
                            <p className="mb-0">{activity.description}</p>
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
          
          {/* Renter Overview */}
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
            
            <Col md={6} className="mb-3">
              <Card>
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Renters Overview</h5>
                </Card.Header>
                <Card.Body>
                  <div className="renters-chart">
                    <div className="d-flex">
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Active</span>
                        </div>
                        <div className="progress mb-3" style={{ height: '30px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            style={{ 
                              width: `${metrics.activeRenters + metrics.inactiveRenters > 0 ? 
                                (metrics.activeRenters / (metrics.activeRenters + metrics.inactiveRenters)) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <span>Inactive</span>
                        </div>
                        <div className="progress" style={{ height: '30px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            style={{ 
                              width: `${metrics.activeRenters + metrics.inactiveRenters > 0 ? 
                                (metrics.inactiveRenters / (metrics.activeRenters + metrics.inactiveRenters)) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}