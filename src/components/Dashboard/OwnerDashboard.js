// src/components/Dashboard/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import FeedbackModal from '../FeedbackModal';
import './OwnerDashboard.css';

function OwnerDashboard() {
  const { currentUser } = useAuth();
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we just came from adding equipment
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('equipmentAdded') === 'true') {
      setShowFeedback(true);
      // Clean up the URL
      navigate('/my-dashboard', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          // Fetch equipment items
          const equipmentQuery = query(
            collection(db, "equipment"),
            where("ownerId", "==", currentUser.uid)
          );
          
          const equipmentSnapshot = await getDocs(equipmentQuery);
          const equipment = [];
          
          equipmentSnapshot.forEach((doc) => {
            equipment.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setEquipmentItems(equipment);
          
          // Fetch active rentals for owner's equipment
          const equipmentIds = equipment.map(item => item.id);
          
          if (equipmentIds.length > 0) {
            const rentalsQuery = query(
              collection(db, "rentals"),
              where("equipmentId", "in", equipmentIds),
              where("status", "==", "active")
            );
            
            const rentalsSnapshot = await getDocs(rentalsQuery);
            const rentals = [];
            
            rentalsSnapshot.forEach((doc) => {
              rentals.push({
                id: doc.id,
                ...doc.data()
              });
            });
            
            setActiveRentals(rentals);
          }
        } catch (error) {
          console.error("Error fetching owner data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [currentUser]);

  const handleCloseFeedback = () => {
    setShowFeedback(false);
  };

  return (
    <div className="dashboard-container">
      <FeedbackModal 
        isOpen={showFeedback}
        onClose={handleCloseFeedback}
        title="Equipment Added Successfully! 🎉"
        message="Your equipment has been listed and is now available for rent. You can track its performance and manage bookings from this dashboard."
      />
      
      <div className="dashboard-header">
        <h2>Owner Dashboard</h2>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          List your equipment and manage your rentals in one place.
        </p>
      </div>
      
      <div className="dashboard-actions">
        <Link to="/add-equipment" className="add-btn">
          + Add New Equipment
        </Link>
        <Link to="/equipment-analytics" className="analytics-btn">
          📊 View Analytics
        </Link>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between mb-4">
          <h4 className="text-md font-medium text-gray-700">Your Equipment</h4>
        </div>
        
        {loading ? (
          <p>Loading your equipment...</p>
        ) : equipmentItems.length > 0 ? (
          <ul className="equipment-list">
            {equipmentItems.map((item) => (
              <li key={item.id} className="equipment-card">
                <img 
                  src={item.imageUrl || '/api/placeholder/400/250'} 
                  alt={item.name}
                />
                <div className="equipment-info">
                  <h4>{item.name}</h4>
                  <p>{item.category}</p>
                  <span className={`status-badge ${item.available ? 'available' : 'unavailable'}`}>
                    {item.available ? 'Available' : 'Rented Out'}
                  </span>
                  <p className="rate">${item.ratePerDay}/day</p>
                  <Link to={`/equipment/${item.id}`} className="details-link">
                    View Details →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-equipment">
            <p>You haven't listed any equipment yet</p>
            <Link to="/add-equipment">
              Add Your First Equipment
            </Link>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h4 className="text-md font-medium text-gray-700 mb-4">Active Rentals</h4>
        
        {loading ? (
          <p>Loading active rentals...</p>
        ) : activeRentals.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {activeRentals.map((rental) => (
                <li key={rental.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {rental.equipmentName}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Until {new Date(rental.endDate.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Rented by: {rental.renterName}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>${rental.totalPrice}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No active rentals at the moment</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Rental History</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>View past rentals and income from your equipment.</p>
            </div>
            <div className="mt-5">
              <Link
                to="/rental-history"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View History
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Account Settings</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Update your profile information and preferences.</p>
            </div>
            <div className="mt-5">
              <Link
                to="/account-settings"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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

export default OwnerDashboard;