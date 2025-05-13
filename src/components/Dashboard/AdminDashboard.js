import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Table, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOwners: 0,
    totalRenters: 0,
    totalEquipment: 0,
    pendingEquipment: 0,
    activeRentals: 0
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchAllData();
  }, [currentUser]);

  async function fetchAllData() {
    try {
      setLoading(true);
      
      // Fetch users
      const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const userSnapshot = await getDocs(usersQuery);
      const usersList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList.filter(user => user.id !== currentUser.uid));
      
      // Fetch equipment
      const equipmentQuery = query(collection(db, "equipment"), orderBy("createdAt", "desc"));
      const equipmentSnapshot = await getDocs(equipmentQuery);
      const equipmentList = equipmentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEquipment(equipmentList);
      
      // Fetch rentals
      const rentalsQuery = query(collection(db, "rentals"), orderBy("createdAt", "desc"));
      const rentalSnapshot = await getDocs(rentalsQuery);
      const rentalsList = rentalSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRentals(rentalsList);
      
      // Calculate stats
      const ownerCount = usersList.filter(user => user.role === 'owner').length;
      const renterCount = usersList.filter(user => user.role === 'renter').length;
      const pendingEquipmentCount = equipmentList.filter(eq => eq.status === 'pending').length;
      const activeRentalsCount = rentalsList.filter(rental => rental.status === 'active').length;
      
      setStats({
        totalUsers: usersList.length,
        totalOwners: ownerCount,
        totalRenters: renterCount,
        totalEquipment: equipmentList.length,
        pendingEquipment: pendingEquipmentCount,
        activeRentals: activeRentalsCount
      });
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard data');
      setLoading(false);
      console.error(err);
    }
  }

  async function handleApproveEquipment(equipmentId) {
    try {
      const equipmentRef = doc(db, "equipment", equipmentId);
      await updateDoc(equipmentRef, {
        status: "approved"
      });
      
      // Update local state
      setEquipment(prevEquipment => 
        prevEquipment.map(item => 
          item.id === equipmentId 
            ? { ...item, status: "approved" } 
            : item
        )
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingEquipment: prev.pendingEquipment - 1
      }));
    } catch (err) {
      setError('Failed to approve equipment');
      console.error(err);
    }
  }

  async function handleRejectEquipment(equipmentId) {
    try {
      await deleteDoc(doc(db, "equipment", equipmentId));
      
      // Update local state
      setEquipment(prevEquipment => 
        prevEquipment.filter(item => item.id !== equipmentId)
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalEquipment: prev.totalEquipment - 1,
        pendingEquipment: prev.pendingEquipment - 1
      }));
    } catch (err) {
      setError('Failed to reject equipment');
      console.error(err);
    }
  }

  async function handleUpdateUserRole(userId, newRole) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        role: newRole
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, role: newRole } 
            : user
        )
      );
      
      // Recalculate stats
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      );
      const ownerCount = updatedUsers.filter(user => user.role === 'owner').length;
      const renterCount = updatedUsers.filter(user => user.role === 'renter').length;
      
      setStats(prev => ({
        ...prev,
        totalOwners: ownerCount,
        totalRenters: renterCount
      }));
      
      setShowUserModal(false);
    } catch (err) {
      setError('Failed to update user role');
      console.error(err);
    }
  }

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  if (loading) return <div className="d-flex justify-content-center p-5"><h4>Loading admin dashboard...</h4></div>;

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">Admin Dashboard</h2>
          <p className="text-muted">Manage users, equipment, and monitor platform activity</p>
        </Col>
      </Row>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="bg-primary text-white">
            <Card.Body>
              <h5>Total Users</h5>
              <h2>{stats.totalUsers}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-success text-white">
            <Card.Body>
              <h5>Owners</h5>
              <h2>{stats.totalOwners}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-info text-white">
            <Card.Body>
              <h5>Renters</h5>
              <h2>{stats.totalRenters}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-warning text-dark">
            <Card.Body>
              <h5>Total Equipment</h5>
              <h2>{stats.totalEquipment}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="bg-orange text-white">
            <Card.Body>
              <h5>Pending Approvals</h5>
              <h2>{stats.pendingEquipment}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="bg-secondary text-white">
            <Card.Body>
              <h5>Active Rentals</h5>
              <h2>{stats.activeRentals}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Users Management */}
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-light">
          <i className="fas fa-users me-2"></i>Users Management
        </Card.Header>
        <Card.Body>
          <Table responsive striped hover>
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.displayName || user.name || 'N/A'}</td>
                  <td>{user.email}</td>
                  <td>
                    <Badge bg={
                      user.role === 'admin' ? 'danger' : 
                      user.role === 'owner' ? 'success' : 'primary'
                    }>
                      {user.role || 'No Role'}
                    </Badge>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => openUserModal(user)}
                    >
                      Edit Role
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted">No users found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Equipment Management */}
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-light">
          <i className="fas fa-tools me-2"></i>Equipment Management
        </Card.Header>
        <Card.Body>
          <Table responsive striped hover>
            <thead className="table-dark">
              <tr>
                <th>Equipment</th>
                <th>Category</th>
                <th>Owner</th>
                <th>Rate/Day</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipment.filter(item => item.status === 'pending').map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.ownerName}</td>
                  <td>${item.ratePerDay}</td>
                  <td>
                    <Badge bg={item.status === 'approved' ? 'success' : 'warning'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td>
                    {item.status === 'pending' && (
                      <>
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleApproveEquipment(item.id)}
                        >
                          <i className="fas fa-check me-1"></i>Approve
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleRejectEquipment(item.id)}
                        >
                          <i className="fas fa-times me-1"></i>Reject
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {equipment.filter(item => item.status === 'pending').length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted">No pending equipment approvals</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Recent Rentals */}
      <Card>
        <Card.Header as="h5" className="bg-light">
          <i className="fas fa-handshake me-2"></i>Recent Rentals
        </Card.Header>
        <Card.Body>
          <Table responsive striped hover>
            <thead className="table-dark">
              <tr>
                <th>Equipment</th>
                <th>Renter</th>
                <th>Owner</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rentals.slice(0, 10).map(rental => (
                <tr key={rental.id}>
                  <td>{rental.equipmentName}</td>
                  <td>{rental.renterName}</td>
                  <td>{rental.ownerName}</td>
                  <td>{rental.startDate ? new Date(rental.startDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                  <td>{rental.endDate ? new Date(rental.endDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                  <td>${rental.totalPrice}</td>
                  <td>
                    <Badge bg={
                      rental.status === 'active' ? 'success' : 
                      rental.status === 'completed' ? 'primary' : 'warning'
                    }>
                      {rental.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {rentals.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted">No rentals found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* User Role Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>User: {selectedUser.email}</Form.Label>
                <Form.Label>Current Role: <Badge>{selectedUser.role || 'No Role'}</Badge></Form.Label>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Select New Role:</Form.Label>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => handleUpdateUserRole(selectedUser.id, 'renter')}
                  >
                    Renter
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={() => handleUpdateUserRole(selectedUser.id, 'owner')}
                  >
                    Owner
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    onClick={() => handleUpdateUserRole(selectedUser.id, 'admin')}
                  >
                    Admin
                  </Button>
                </div>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}