// src/components/dashboard/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

function OwnerDashboard() {
  const { currentUser } = useAuth();
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Owner Dashboard</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          List your equipment and manage your rentals in one place.
        </p>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between mb-4">
          <h4 className="text-md font-medium text-gray-700">Your Equipment</h4>
          <Link
            to="/add-equipment"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Equipment
          </Link>
        </div>
        
        {loading ? (
          <p>Loading your equipment...</p>
        ) : equipmentItems.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {equipmentItems.map((item) => (
                <li key={item.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {item.name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.available ? 'Available' : 'Rented Out'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {item.category} • ${item.ratePerDay}/day
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Link
                          to={`/equipment/${item.id}`}
                          className="text-blue-600 hover:text-blue-500"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">You haven't listed any equipment yet</p>
            <div className="mt-4">
              <Link
                to="/add-equipment"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Add Your First Equipment
              </Link>
            </div>
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