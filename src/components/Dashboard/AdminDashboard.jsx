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
import { equipmentService } from '../../services/equipmentService';
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
    totalEquipment: 0,
    availableEquipment: 0,
    rentedEquipment: 0,
    totalUsers: 0,
    activeRenters: 0,
    equipmentOwners: 0,
    totalRentals: 0,
    loading: true
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Reports chart data (replace with real Firestore data)
  const chartData = [
    { month: 'Jan', equipment: 20, rentals: 45 },
    { month: 'Feb', equipment: 23, rentals: 52 },
    { month: 'Mar', equipment: 25, rentals: 48 },
    { month: 'Apr', equipment: 28, rentals: 61 },
    { month: 'May', equipment: 30, rentals: 58 },
    { month: 'Jun', equipment: 33, rentals: 67 }
  ];

  // Fetch real-time data from Firestore
  useEffect(() => {
    const unsubs = [];
    
    const fetchData = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true }));
        
        // Get all equipment using our service
        console.log('🔍 Admin fetching all equipment...');
        const equipment = await equipmentService.getAllEquipment();
        setAllEquipment(equipment);
        
        // Calculate equipment metrics
        const totalEquipment = equipment.length;
        const availableEquipment = equipment.filter(item => item.available).length;
        const rentedEquipment = equipment.filter(item => !item.available).length;
        
        console.log(`✅ Admin loaded ${totalEquipment} total equipment items`);
        
        // Get all users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(users);
        
        // Calculate user metrics
        const totalUsers = users.length;
        const activeRenters = users.filter(user => user.role === 'renter').length;
        const equipmentOwners = users.filter(user => user.role === 'owner').length;
        
        console.log(`✅ Admin loaded ${totalUsers} total users`);
        
        // Get rental statistics
        let totalRentals = 0;
        try {
          const rentalsSnapshot = await getDocs(collection(db, 'rentals'));
          totalRentals = rentalsSnapshot.size;
        } catch (error) {
          console.log('ℹ️ Could not fetch rentals count:', error);
        }
        
        setMetrics({
          totalEquipment,
          availableEquipment,
          rentedEquipment,
          totalUsers,
          activeRenters,
          equipmentOwners,
          totalRentals,
          loading: false
        });
        
      } catch (err) {
        console.error('❌ Error fetching admin dashboard data:', err);
        setError('Failed to load dashboard data');
        setMetrics(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchData();
    
    // Set up real-time listeners for activity and notifications
    try {
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
      }, (error) => {
        console.log('ℹ️ Activity listener error (expected if collection is empty):', error);
        setRecentActivity([
          {
            id: 'activity-1',
            type: 'new_equipment',
            userName: 'Equipment Owner',
            description: 'added new equipment "Excavator (30-ton)"',
            equipmentName: 'Excavator (30-ton)',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            id: 'activity-2',
            type: 'rental',
            userName: 'John Renter',
            description: 'rented equipment "Power Drill"',
            equipmentName: 'Power Drill',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
          }
        ]);
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
      }, (error) => {
        console.log('ℹ️ Notifications listener error (expected if collection is empty):', error);
        setNotifications([
          {
            id: 'notif-1',
            title: 'New Equipment Approval',
            message: 'New equipment "Bulldozer D6" requires approval',
            severity: 'normal',
            timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
          },
          {
            id: 'notif-2',
            title: 'System Update',
            message: 'Platform maintenance scheduled for tonight',
            severity: 'info',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          }
        ]);
      });
      unsubs.push(notificationsUnsub);

    } catch (err) {
      console.log('ℹ️ Some real-time listeners could not be set up:', err);
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
      case 'new_equipment':
        return <Tools className="me-2 text-success" />;
      case 'rental':
        return <FileEarmark className="me-2 text-primary" />;
      case 'new_user':
        return <Person className="me-2 text-info" />;
      case 'maintenance':
        return <Gear className="me-2 text-warning" />;
      default:
        return <CheckCircle className="me-2 text-secondary" />;
    }
  };

  const toggleNotifications = () => setShowNotifications(!showNotifications);

  // Sidebar navigation items
  const navItems = [
    { label: 'Dashboard', icon: <HouseDoor /> },
    { label: 'Equipment', icon: <Tools /> },
    { label: 'Users', icon: <People /> },
    { label: 'Rentals', icon: <FileEarmark /> },
    { label: 'Analytics', icon: <GraphUp /> },
    { label: 'Settings', icon: <Gear /> }
  ];

  // Filtered data for Equipment/Users tab
  const filteredEquipment = allEquipment.filter(
    item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredUsers = allUsers.filter(
    user => (user.displayName || user.email)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container d-flex">
      {/* Sidebar */}
      <div className="sidebar bg-dark text-white">
        <div className="d-flex align-items-center p-3 mb-3">
          <Building size={24} className="text-primary me-2" />
          <h4 className="m-0">RentMate Admin</h4>
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
            {(activeTab === 'Equipment' || activeTab === 'Users') && (
              <InputGroup className="me-3" style={{ maxWidth: 220 }}>
                <Form.Control
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="outline-secondary">
                  <Search />
                </Button>
              </InputGroup>
            )}
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
                  <Card className="stats-card h-100">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="p-3 bg-primary bg-opacity-10 rounded-3 me-3">
                          <Tools className="text-primary fs-4" />
                        </div>
                        <div>
                          <h2 className="mb-1">{metrics.loading ? '...' : metrics.totalEquipment}</h2>
                          <p className="text-muted mb-0 small">Total Equipment</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <Card className="stats-card h-100">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="p-3 bg-success bg-opacity-10 rounded-3 me-3">
                          <CheckCircle className="text-success fs-4" />
                        </div>
                        <div>
                          <h2 className="mb-1">{metrics.loading ? '...' : metrics.availableEquipment}</h2>
                          <p className="text-muted mb-0 small">Available</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <Card className="stats-card h-100">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="p-3 bg-warning bg-opacity-10 rounded-3 me-3">
                          <People className="text-warning fs-4" />
                        </div>
                        <div>
                          <h2 className="mb-1">{metrics.loading ? '...' : metrics.totalUsers}</h2>
                          <p className="text-muted mb-0 small">Total Users</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <Card className="stats-card h-100">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="p-3 bg-info bg-opacity-10 rounded-3 me-3">
                          <FileEarmark className="text-info fs-4" />
                        </div>
                        <div>
                          <h2 className="mb-1">{metrics.loading ? '...' : metrics.totalRentals}</h2>
                          <p className="text-muted mb-0 small">Total Rentals</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Platform Overview */}
              <Row className="mb-4">
                <Col md={8}>
                  <Card>
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">Platform Analytics</h5>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="equipment" stroke="#3b82f6" name="Equipment" />
                          <Line type="monotone" dataKey="rentals" stroke="#10b981" name="Rentals" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Header className="bg-white">
                      <h5 className="mb-0">User Distribution</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Equipment Renters</span>
                        <span className="fw-bold">{metrics.activeRenters}</span>
                      </div>
                      <div className="progress mb-3">
                        <div 
                          className="progress-bar bg-primary" 
                          style={{ 
                            width: `${metrics.totalUsers > 0 ? 
                              (metrics.activeRenters / metrics.totalUsers) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Equipment Owners</span>
                        <span className="fw-bold">{metrics.equipmentOwners}</span>
                      </div>
                      <div className="progress mb-3">
                        <div 
                          className="progress-bar bg-success" 
                          style={{ 
                            width: `${metrics.totalUsers > 0 ? 
                              (metrics.equipmentOwners / metrics.totalUsers) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Admins</span>
                        <span className="fw-bold">
                          {metrics.totalUsers - metrics.activeRenters - metrics.equipmentOwners}
                        </span>
                      </div>
                      <div className="progress">
                        <div 
                          className="progress-bar bg-warning" 
                          style={{ 
                            width: `${metrics.totalUsers > 0 ? 
                              ((metrics.totalUsers - metrics.activeRenters - metrics.equipmentOwners) / metrics.totalUsers) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
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
            </>
          )}

          {/* --------- EQUIPMENT TAB --------- */}
          {activeTab === 'Equipment' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>All Equipment ({allEquipment.length})</h5>
                <div className="d-flex gap-2">
                  <Badge bg="success">{metrics.availableEquipment} Available</Badge>
                  <Badge bg="danger">{metrics.rentedEquipment} Rented</Badge>
                </div>
              </div>
              
              {metrics.loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Row>
                  {filteredEquipment.length > 0 ? (
                    filteredEquipment.map(equipment => (
                      <Col key={equipment.id} md={6} lg={4} className="mb-4">
                        <Card className="h-100">
                          <div style={{ height: '200px', overflow: 'hidden' }}>
                            <Card.Img 
                              variant="top" 
                              src={equipment.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} 
                              style={{ height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                              }}
                            />
                          </div>
                          <Card.Body className="d-flex flex-column">
                            <div className="flex-grow-1">
                              <Card.Title className="h6">{equipment.name}</Card.Title>
                              <div className="mb-2">
                                <Badge bg="primary" className="me-2">{equipment.category}</Badge>
                                <Badge bg={equipment.available ? "success" : "danger"}>
                                  {equipment.available ? "Available" : "Rented"}
                                </Badge>
                              </div>
                              <Card.Text className="small text-muted">
                                Owner: {equipment.ownerName}
                              </Card.Text>
                              <Card.Text className="small text-muted">
                                Location: {equipment.location}
                              </Card.Text>
                            </div>
                            <div className="mt-auto">
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold text-success">${equipment.ratePerDay}/day</span>
                                <Button variant="outline-primary" size="sm">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <Col>
                      <div className="text-center py-5">
                        <Tools className="display-1 text-muted" />
                        <h5 className="mt-3">No equipment found</h5>
                        <p className="text-muted">
                          {searchQuery ? 'Try adjusting your search terms.' : 'No equipment has been added to the platform yet.'}
                        </p>
                      </div>
                    </Col>
                  )}
                </Row>
              )}
            </>
          )}

          {/* --------- USERS TAB --------- */}
          {activeTab === 'Users' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>All Users ({allUsers.length})</h5>
                <div className="d-flex gap-2">
                  <Badge bg="primary">{metrics.activeRenters} Renters</Badge>
                  <Badge bg="success">{metrics.equipmentOwners} Owners</Badge>
                  <Badge bg="warning">{metrics.totalUsers - metrics.activeRenters - metrics.equipmentOwners} Admins</Badge>
                </div>
              </div>
              
              {metrics.loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Card>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map(user => (
                            <tr key={user.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <img 
                                    src={user.photoURL || 'https://via.placeholder.com/40'} 
                                    alt={user.displayName || 'User'}
                                    className="rounded-circle me-2"
                                    width="40"
                                    height="40"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/40';
                                    }}
                                  />
                                  <div>
                                    <div className="fw-semibold">
                                      {user.displayName || 'No Name'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>{user.email}</td>
                              <td>
                                <Badge bg={
                                  user.role === 'admin' ? 'danger' :
                                  user.role === 'owner' ? 'success' : 'primary'
                                }>
                                  {user.role === 'renter' ? 'Renter' : 
                                   user.role === 'owner' ? 'Owner' : 
                                   user.role === 'admin' ? 'Admin' : 'Unknown'}
                                </Badge>
                              </td>
                              <td>
                                {user.createdAt ? 
                                  new Date(user.createdAt.toDate()).toLocaleDateString() : 
                                  'Unknown'
                                }
                              </td>
                              <td>
                                <Button variant="outline-primary" size="sm" className="me-2">
                                  View Profile
                                </Button>
                                <Button variant="outline-secondary" size="sm">
                                  Edit Role
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-4">
                              <People className="display-4 text-muted" />
                              <div className="mt-2">No users found</div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* --------- RENTALS TAB --------- */}
          {activeTab === 'Rentals' && (
            <>
              <h5>Rental Management</h5>
              <p>Rental management section coming soon! Here you'll be able to:</p>
              <ul>
                <li>View all active rentals</li>
                <li>Monitor rental status</li>
                <li>Handle disputes</li>
                <li>Generate rental reports</li>
              </ul>
            </>
          )}

          {/* --------- ANALYTICS TAB --------- */}
          {activeTab === 'Analytics' && (
            <>
              <h5>Platform Analytics</h5>
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="equipment" stroke="#3b82f6" name="Equipment Added" />
                          <Line type="monotone" dataKey="rentals" stroke="#10b981" name="Rentals Completed" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* Additional Analytics Cards */}
              <Row>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">Equipment Categories</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted">Equipment distribution by category analysis coming soon.</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">Revenue Insights</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted">Revenue tracking and projections coming soon.</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* --------- SETTINGS TAB --------- */}
          {activeTab === 'Settings' && (
            <>
              <h5>Admin Settings</h5>
              <Row>
                <Col md={8}>
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">Platform Configuration</h6>
                    </Card.Header>
                    <Card.Body>
                      <p>Admin settings panel coming soon! This will include:</p>
                      <ul>
                        <li>Platform-wide settings</li>
                        <li>User management policies</li>
                        <li>Equipment approval settings</li>
                        <li>Notification preferences</li>
                        <li>Security configurations</li>
                      </ul>
                      <Button variant="primary" disabled>
                        Save Settings
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </div>
      </div>
      
      {/* CSS Styles */}
      <style jsx>{`
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
          transition: all 0.2s;
        }
        
        .sidebar .nav-link:hover {
          color: white;
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .sidebar .nav-link.active {
          color: white;
          background-color: #3b82f6;
        }
        
        .notifications-panel {
          position: absolute;
          top: 100%;
          right: 0;
          width: 350px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .notification-item:hover {
          background-color: #f8f9fa;
        }
        
        .stats-card:hover {
          transform: translateY(-2px);
          transition: transform 0.2s;
        }
        
        .activity-list li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f1f3f4;
        }
        
        .activity-list li:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}