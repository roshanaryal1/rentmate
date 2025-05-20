// src/components/Dashboard/RenterDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { sampleEquipment } from '../../data/sampleEquipment';
// Import Bootstrap CSS in your index.js or App.js file if not already imported
// import 'bootstrap/dist/css/bootstrap.min.css';

function RenterDashboard(
  
) {
  const { currentUser } = useAuth();
  const [rentedItems, setRentedItems] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllEquipment, setShowAllEquipment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          // Fetch rented items (currently simulated)
          const simulatedRentals = [
            {
              id: 'rental-001',
              equipmentName: 'Power Drill (Cordless, 18V)',
              ownerName: 'Tool Rental Pro',
              status: 'active',
              endDate: { toDate: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
              totalPrice: 75
            },
            {
              id: 'rental-002',
              equipmentName: 'Pressure Washer (3000 PSI)',
              ownerName: 'Clean Force',
              status: 'active',
              endDate: { toDate: () => new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
              totalPrice: 150
            }
          ];
          
          setRentedItems(simulatedRentals);

          // Fetch equipment list - try firestore first, fallback to sample data
          try {
            const equipmentQuery = query(
              collection(db, "equipment"),
              where("available", "==", true),
              where("status", "==", "approved")
            );
            
            const equipmentSnapshot = await getDocs(equipmentQuery);
            const equipment = [];
            
            equipmentSnapshot.forEach((doc) => {
              equipment.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            // If no data in Firestore, use sample data
            setEquipmentList(equipment.length > 0 ? equipment : sampleEquipment);
          } catch (error) {
            console.error("Error fetching equipment:", error);
            setEquipmentList(sampleEquipment);
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [currentUser]);

  // Filter equipment based on search and category
  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = !searchTerm || 
                          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return item.available && matchesSearch && matchesCategory;
  });

  // Get unique categories for the dropdown
  const categories = [...new Set(equipmentList.map(item => item.category))];

  return (
    <div className="container-fluid px-4">
      <div className="row mb-4 pb-3 border-bottom">
        <div className="col-12">
          <h3 className="fw-bold">Renter Dashboard</h3>
          <p className="text-muted">
            Browse, rent, and manage your equipment rentals in one place.
          </p>
        </div>
      </div>
      
      {/* Current Rentals Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="h5 fw-bold">Current Rentals</h4>
            <Link
              to="/"
              className="btn btn-primary btn-sm"
            >
              Browse All Equipment
            </Link>
          </div>
          
          {loading ? (
            <p className="text-muted py-3">Loading your rentals...</p>
          ) : rentedItems.length > 0 ? (
            <div className="card">
              <ul className="list-group list-group-flush">
                {rentedItems.map((item) => (
                  <li key={item.id} className="list-group-item p-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5 className="mb-1 text-primary">{item.equipmentName}</h5>
                        <p className="mb-1 small text-muted">
                          Rented from: {item.ownerName}
                        </p>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-success rounded-pill">
                          Until {new Date(item.endDate.toDate()).toLocaleDateString()}
                        </span>
                        <p className="mb-0 mt-1 small text-muted">
                          ${item.totalPrice} • {item.status}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-4 bg-light rounded">
              <p className="text-muted mb-3">You don't have any active rentals</p>
              <Link
                to="/"
                className="btn btn-outline-primary"
              >
                Find Equipment to Rent
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
            <h4 className="h5 fw-bold mb-2 mb-md-0">Browse Available Equipment</h4>
            <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-muted py-3">Loading equipment...</p>
          ) : filteredEquipment.length > 0 ? (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {(showAllEquipment ? filteredEquipment : filteredEquipment.slice(0, 6)).map((item) => (
                <div key={item.id} className="col">
                  <div className="card h-100 shadow-sm hover-shadow">
                    <div className="card-body">
                      <h5 className="card-title">{item.name}</h5>
                      <h6 className="card-subtitle mb-2 text-primary">{item.category}</h6>
                      <p className="card-text small text-truncate-2">
                        {item.description}
                      </p>
                      
                      {item.features && item.features.length > 0 && (
                        <div className="mb-2">
                          {item.features.slice(0, 2).map((feature, idx) => (
                            <span key={idx} className="badge bg-info text-dark me-1">
                              {feature}
                            </span>
                          ))}
                          {item.features.length > 2 && (
                            <small className="text-muted">+{item.features.length - 2} more</small>
                          )}
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <h5 className="text-success mb-0">
                          ${item.ratePerDay}/day
                        </h5>
                        <Link
                          to={`/rent/${item.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          Rent Now
                        </Link>
                      </div>
                      <div className="text-muted small mt-2">
                        <div>
                          <i className="bi bi-geo-alt me-1"></i>
                          <span>{item.location || 'Location not specified'}</span>
                        </div>
                        <div>
                          <span>Owner: {item.ownerName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-light rounded">
              <p className="text-muted">No equipment found matching your criteria</p>
            </div>
          )}
          
          {filteredEquipment.length > 6 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllEquipment(!showAllEquipment)}
                className="btn btn-outline-secondary"
              >
                {showAllEquipment ? 'Show Less' : `View All (${filteredEquipment.length} items)`}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Dashboard Shortcuts */}
      <div className="row mb-4">
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Rental History</h5>
              <p className="card-text text-muted">
                View your past equipment rentals and receipts.
              </p>
              <Link
                to="/rental-history"
                className="btn btn-outline-primary"
              >
                View History
              </Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Account Settings</h5>
              <p className="card-text text-muted">
                Update your profile information and preferences.
              </p>
              <Link
                to="/account-settings"
                className="btn btn-outline-primary"
              >
                Edit Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this CSS to your project for Bootstrap Icons and card hover effect
// (Either in a global CSS file or as a style tag in your component)
const bootstrapStyles = `
/* Import Bootstrap Icons */
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");

/* Custom styles */
.hover-shadow:hover {
  box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
  transition: box-shadow 0.3s ease-in-out;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;

export default RenterDashboard;