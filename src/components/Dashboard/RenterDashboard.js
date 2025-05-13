import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Container, Row, Col, Card, Button, Badge, Table, Alert, Modal, Form } from 'react-bootstrap';

function RenterDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [rentedItems, setRentedItems] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [extensionDays, setExtensionDays] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [stats, setStats] = useState({
    activeRentals: 0,
    completedRentals: 0,
    totalSpent: 0,
    averageRental: 0
  });

  useEffect(() => {
    if (currentUser) {
      fetchRenterData();
      fetchAvailableEquipment();
    }
  }, [currentUser]);

  const fetchRenterData = async () => {
    try {
      setLoading(true);
      
      // Fetch active rentals for current user
      const activeRentalsQuery = query(
        collection(db, "rentals"),
        where("renterId", "==", currentUser.uid),
        where("status", "==", "active")
      );
      
      const activeRentalsSnapshot = await getDocs(activeRentalsQuery);
      const activeRentals = [];
      
      activeRentalsSnapshot.forEach((doc) => {
        activeRentals.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setRentedItems(activeRentals);
      
      // Fetch rental history
      const historyQuery = query(
        collection(db, "rentals"),
        where("renterId", "==", currentUser.uid),
        where("status", "==", "completed"),
        orderBy("endDate", "desc"),
        limit(10)
      );
      
      const historySnapshot = await getDocs(historyQuery);
      const history = [];
      
      historySnapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setRentalHistory(history);
      
      // Calculate stats
      const totalSpent = history.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
      const avgRental = history.length > 0 ? totalSpent / history.length : 0;
      
      setStats({
        activeRentals: activeRentals.length,
        completedRentals: history.length,
        totalSpent: totalSpent,
        averageRental: avgRental
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching renter data:", error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const fetchAvailableEquipment = async () => {
    try {
      // Fetch available equipment (not owned by current user)
      const equipmentQuery = query(
        collection(db, "equipment"),
        where("available", "==", true),
        where("status", "==", "approved"),
        where("ownerId", "!=", currentUser.uid),
        limit(20)
      );
      
      const equipmentSnapshot = await getDocs(equipmentQuery);
      const equipment = [];
      
      equipmentSnapshot.forEach((doc) => {
        equipment.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setAvailableEquipment(equipment);
      setFilteredEquipment(equipment);
    } catch (error) {
      console.error("Error fetching available equipment:", error);
    }
  };

  // Filter equipment based on search criteria
  useEffect(() => {
    let filtered = availableEquipment;
    
    if (searchCategory) {
      filtered = filtered.filter(item => 
        item.category.toLowerCase().includes(searchCategory.toLowerCase())
      );
    }
    
    if (maxPrice) {
      filtered = filtered.filter(item => item.ratePerDay <= parseFloat(maxPrice));
    }
    
    setFilteredEquipment(filtered);
  }, [searchCategory, maxPrice, availableEquipment]);

  const handleExtendRental = async () => {
    if (!selectedRental || !extensionDays) return;
    
    try {
      const currentEndDate = selectedRental.endDate.toDate();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + parseInt(extensionDays));
      
      const additionalCost = selectedRental.dailyRate * parseInt(extensionDays);
      const newTotalPrice = selectedRental.totalPrice + additionalCost;
      
      const rentalRef = doc(db, "rentals", selectedRental.id);
      await updateDoc(rentalRef, {
        endDate: newEndDate,
        totalPrice: newTotalPrice,
        extendedDays: (selectedRental.extendedDays || 0) + parseInt(extensionDays)
      });
      
      // Update local state
      setRentedItems(prev => 
        prev.map(item => 
          item.id === selectedRental.id 
            ? { 
                ...item, 
                endDate: { toDate: () => newEndDate },
                totalPrice: newTotalPrice 
              } 
            : item
        )
      );
      
      setShowExtendModal(false);
      setSelectedRental(null);
      setExtensionDays('');
    } catch (error) {
      console.error("Error extending rental:", error);
      setError('Failed to extend rental');
    }
  };

  const handleRentClick = (equipmentId) => {
    navigate(`/rent/${equipmentId}`);
  };

  if (loading) return <div className="d-flex justify-content-center p-5"><h4>Loading your dashboard...</h4></div>;

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary">Renter Dashboard</h2>
          <p className="text-muted">Manage your rentals and discover new equipment</p>
        </Col>
        <Col xs="auto">
          <Link to="/" className="btn btn-primary">
            <i className="fas fa-search me-2"></i>Browse Equipment
          </Link>
        </Col>
      </Row>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="bg-info text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h5>Active Rentals</h5>
                  <h2>{stats.activeRentals}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-handshake fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-success text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h5>Completed</h5>
                  <h2>{stats.completedRentals}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-check-circle fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-warning text-dark">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h5>Total Spent</h5>
                  <h2>${stats.totalSpent.toFixed(2)}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-dollar-sign fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-secondary text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h5>Average Rental</h5>
                  <h2>${stats.averageRental.toFixed(2)}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-chart-bar fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Current Rentals */}
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-light">
          <i className="fas fa-tools me-2"></i>Current Rentals
        </Card.Header>
        <Card.Body>
          {rentedItems.length > 0 ? (
            <Table responsive striped hover>
              <thead className="table-dark">
                <tr>
                  <th>Equipment</th>
                  <th>Owner</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Daily Rate</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rentedItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.equipmentName}</strong>
                      <br />
                      <small className="text-muted">{item.category}</small>
                    </td>
                    <td>{item.ownerName}</td>
                    <td>{item.startDate ? new Date(item.startDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                    <td>{item.endDate ? new Date(item.endDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                    <td>${item.dailyRate}/day</td>
                    <td className="text-success">${item.totalPrice}</td>
                    <td>
                      <Badge bg="success">Active</Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => {
                          setSelectedRental(item);
                          setShowExtendModal(true);
                        }}
                      >
                        <i className="fas fa-clock me-1"></i>Extend
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-tools fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No active rentals</h5>
              <p className="text-muted">Browse available equipment to get started</p>
              <Link to="/" className="btn btn-primary">
                <i className="fas fa-search me-2"></i>Browse Equipment
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Available Equipment */}
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-light">
          <i className="fas fa-shopping-cart me-2"></i>Available Equipment
          <div className="float-end">
            <Form className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Search category..."
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                style={{ width: '150px' }}
              />
              <Form.Control
                type="number"
                placeholder="Max price/day"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ width: '150px' }}
              />
            </Form>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            {filteredEquipment.map((item) => (
              <Col md={4} key={item.id} className="mb-3">
                <Card className="h-100">
                  <Card.Body>
                    <h6 className="card-title">{item.name}</h6>
                    <Badge bg="secondary" className="mb-2">{item.category}</Badge>
                    <p className="card-text text-muted small">
                      {item.description?.substring(0, 80)}...
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-success h5 mb-0">${item.ratePerDay}/day</span>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleRentClick(item.id)}
                      >
                        Rent Now
                      </Button>
                    </div>
                    <small className="text-muted d-block mt-2">
                      Owner: {item.ownerName}
                    </small>
                    <small className="text-muted d-block">
                      Location: {item.location}
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          {filteredEquipment.length === 0 && (
            <div className="text-center py-4">
              <h6 className="text-muted">No equipment found matching your criteria</h6>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  setSearchCategory('');
                  setMaxPrice('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Rental History */}
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-light">
          <i className="fas fa-history me-2"></i>Recent Rental History
        </Card.Header>
        <Card.Body>
          {rentalHistory.length > 0 ? (
            <Table responsive striped hover>
              <thead className="table-dark">
                <tr>
                  <th>Equipment</th>
                  <th>Owner</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Total Price</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {rentalHistory.map((rental) => (
                  <tr key={rental.id}>
                    <td>{rental.equipmentName}</td>
                    <td>{rental.ownerName}</td>
                    <td>{rental.endDate ? new Date(rental.endDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                    <td>{rental.duration} days</td>
                    <td>${rental.totalPrice}</td>
                    <td>
                      {rental.rating ? (
                        <div>
                          {[...Array(5)].map((_, i) => (
                            <i 
                              key={i} 
                              className={`fas fa-star ${i < rental.rating ? 'text-warning' : 'text-muted'}`}
                            ></i>
                          ))}
                        </div>
                      ) : (
                        <Badge bg="secondary">Not rated</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-history fa-2x text-muted mb-3"></i>
              <h6 className="text-muted">No rental history yet</h6>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Quick Actions */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <i className="fas fa-search fa-3x text-primary mb-3"></i>
              <h5>Browse Equipment</h5>
              <p className="text-muted">Find the perfect tool for your project</p>
              <Link to="/" className="btn btn-primary">
                Start Browsing
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <i className="fas fa-star fa-3x text-warning mb-3"></i>
              <h5>Rate Rentals</h5>
              <p className="text-muted">Share your experience with others</p>
              <Button variant="warning" href="/rate-rentals">
                Rate Now
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <i className="fas fa-user fa-3x text-success mb-3"></i>
              <h5>Account Settings</h5>
              <p className="text-muted">Manage your profile and preferences</p>
              <Link to="/account-settings" className="btn btn-success">
                Settings
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Extend Rental Modal */}
      <Modal show={showExtendModal} onHide={() => setShowExtendModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Extend Rental</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRental && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Equipment: <strong>{selectedRental.equipmentName}</strong></Form.Label>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Current End Date: {new Date(selectedRental.endDate.toDate()).toLocaleDateString()}</Form.Label>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Number of Days to Extend:</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(e.target.value)}
                  placeholder="Enter days"
                />
              </Form.Group>
              {extensionDays && (
                <Alert variant="info">
                  Additional cost: ${(selectedRental.dailyRate * parseInt(extensionDays)).toFixed(2)}
                </Alert>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExtendModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExtendRental} disabled={!extensionDays}>
            Extend Rental
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default RenterDashboard;