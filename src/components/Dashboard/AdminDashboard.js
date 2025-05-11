import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch users
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList.filter(user => user.id !== currentUser.uid));
        
        // Fetch properties
        const propertiesCollection = collection(db, "properties");
        const propertySnapshot = await getDocs(propertiesCollection);
        const propertiesList = propertySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProperties(propertiesList);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
        console.error(err);
      }
    }
    
    fetchData();
  }, [currentUser]);

  async function handleApproveProperty(propertyId) {
    try {
      const propertyRef = doc(db, "properties", propertyId);
      await updateDoc(propertyRef, {
        status: "approved"
      });
      
      // Update local state
      setProperties(prevProperties => 
        prevProperties.map(property => 
          property.id === propertyId 
            ? { ...property, status: "approved" } 
            : property
        )
      );
    } catch (err) {
      setError('Failed to approve property');
      console.error(err);
    }
  }

  async function handleDeleteProperty(propertyId) {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await deleteDoc(doc(db, "properties", propertyId));
        
        // Update local state
        setProperties(prevProperties => 
          prevProperties.filter(property => property.id !== propertyId)
        );
      } catch (err) {
        setError('Failed to delete property');
        console.error(err);
      }
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <Container>
      <h2 className="mt-4 mb-4">Admin Dashboard</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Header as="h5">Users Management</Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header as="h5">Properties Management</Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map(property => (
                  <tr key={property.id}>
                    <td>{property.address}</td>
                    <td>{property.ownerName}</td>
                    <td>
                      <span className={`badge ${property.status === 'approved' ? 'bg-success' : 'bg-warning'}`}>
                        {property.status}
                      </span>
                    </td>
                    <td>
                      {property.status !== 'approved' && (
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleApproveProperty(property.id)}
                        >
                          Approve
                        </Button>
                      )}
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDeleteProperty(property.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center">No properties found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}