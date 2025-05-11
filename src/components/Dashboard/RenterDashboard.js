// src/components/dashboard/RenterDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

function RenterDashboard() {
  const { currentUser } = useAuth();
  const [rentedItems, setRentedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRentedItems = async () => {
      if (currentUser) {
        try {
          const q = query(
            collection(db, "rentals"),
            where("renterId", "==", currentUser.uid)
          );
          
          const querySnapshot = await getDocs(q);
          const items = [];
          
          querySnapshot.forEach((doc) => {
            items.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setRentedItems(items);
        } catch (error) {
          console.error("Error fetching rented items:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchRentedItems();
  }, [currentUser]);

  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Renter Dashboard</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Browse, rent, and manage your equipment rentals in one place.
        </p>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between mb-4">
          <h4 className="text-md font-medium text-gray-700">Current Rentals</h4>
          <Link
            to="/browse-equipment"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Equipment
          </Link>
        </div>
        
        {loading ? (
          <p>Loading your rentals...</p>
        ) : rentedItems.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {rentedItems.map((item) => (
                <li key={item.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {item.equipmentName}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {new Date(item.endDate.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Rented from: {item.ownerName}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          ${item.totalPrice} • {item.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">You don't have any active rentals</p>
            <div className="mt-4">
              <Link
                to="/browse-equipment"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Find Equipment to Rent
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Rental History</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>View your past equipment rentals and receipts.</p>
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

export default RenterDashboard;