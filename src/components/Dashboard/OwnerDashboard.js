import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

function OwnerDashboard() {
  const { currentUser } = useAuth();
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalEquipment: 0,
    activeRentals: 0,
    totalRentals: 0
  });

  useEffect(() => {
    const fetchOwnerData = async () => {
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

            // Fetch rental history
            const historyQuery = query(
              collection(db, "rentals"),
              where("equipmentId", "in", equipmentIds),
              orderBy("createdAt", "desc")
            );
            
            const historySnapshot = await getDocs(historyQuery);
            const history = [];
            let totalEarnings = 0;
            
            historySnapshot.forEach((doc) => {
              const rental = { id: doc.id, ...doc.data() };
              history.push(rental);
              if (rental.status === "completed") {
                totalEarnings += rental.totalPrice || 0;
              }
            });
            
            setRentalHistory(history);
            
            // Calculate stats
            setStats({
              totalEarnings: totalEarnings,
              totalEquipment: equipment.length,
              activeRentals: rentals.length,
              totalRentals: history.length
            });
          }
        } catch (error) {
          console.error("Error fetching owner data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchOwnerData();
  }, [currentUser]);

  const availableEquipment = equipmentItems.filter(item => item.available);
  const unavailableEquipment = equipmentItems.filter(item => !item.available);

  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Equipment Owner Dashboard</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Manage your equipment listings and track your rental business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                  <dd className="text-lg font-medium text-gray-900">${stats.totalEarnings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Equipment</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalEquipment}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Rentals</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeRentals}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Rentals</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalRentals}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          to="/add-equipment"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Equipment
        </Link>
        <Link
          to="/equipment-analytics"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View Analytics
        </Link>
      </div>

      {/* Your Equipment */}
      <div className="mt-8">
        <div className="flex justify-between mb-4">
          <h4 className="text-md font-medium text-gray-700">Your Equipment</h4>
          <div className="flex space-x-2">
            <span className="text-sm text-gray-500">
              {availableEquipment.length} available • {unavailableEquipment.length} rented
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading your equipment...</p>
          </div>
        ) : equipmentItems.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {equipmentItems.map((item) => (
                <li key={item.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {item.name}
                        </p>
                        <div className="ml-3">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.available ? 'Available' : 'Rented Out'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="text-sm font-medium text-green-600">
                          ${item.ratePerDay}/day
                        </p>
                        <Link
                          to={`/equipment/${item.id}`}
                          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex sm:space-x-6">
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {item.category}
                        </p>
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {item.location || 'Location not set'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Added {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Recently'}
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
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
            <p className="mt-2 text-gray-500">You haven't listed any equipment yet</p>
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
      
      {/* Active Rentals */}
      <div className="mt-8">
        <h4 className="text-md font-medium text-gray-700 mb-4">Active Rentals</h4>
        
        {loading ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading active rentals...</p>
          </div>
        ) : activeRentals.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {activeRentals.map((rental) => (
                <li key={rental.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {rental.equipmentName}
                        </p>
                        <div className="ml-3">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="text-sm font-medium text-green-600">
                          ${rental.totalPrice}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex sm:space-x-6">
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Rented by: {rental.renterName || 'N/A'}
                        </p>
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Until {rental.endDate ? new Date(rental.endDate.toDate()).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Started {rental.startDate ? new Date(rental.startDate.toDate()).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="mt-2 text-gray-500">No active rentals at the moment</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h4 className="text-md font-medium text-gray-700 mb-4">Recent Rental Activity</h4>
        
        {rentalHistory.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {rentalHistory.slice(0, 5).map((rental) => (
                <li key={rental.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {rental.equipmentName}
                        </p>
                        <div className="ml-3">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rental.status === 'completed' ? 'bg-green-100 text-green-800' :
                            rental.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {rental.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="text-sm font-medium text-gray-900">
                          ${rental.totalPrice}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Rented by {rental.renterName || 'N/A'} • {rental.createdAt ? new Date(rental.createdAt.toDate()).toLocaleDateString() : 'Recently'}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {rentalHistory.length > 5 && (
              <div className="bg-gray-50 px-4 py-3 text-center">
                <Link
                  to="/rental-history"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View all {rentalHistory.length} rentals
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No rental activity yet</p>
          </div>
        )}
      </div>
      
      {/* Management Links */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Rental History & Analytics</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>View detailed rental history, earnings reports, and equipment performance analytics.</p>
            </div>
            <div className="mt-5">
              <Link
                to="/rental-history"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                View History & Analytics
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Account & Equipment Settings</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Update your profile, payment information, and manage equipment settings.</p>
            </div>
            <div className="mt-5">
              <Link
                to="/owner-settings"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;