import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { sampleEquipment } from '../../data/sampleEquipment';

function RenterDashboard() {
  const { currentUser } = useAuth();
  const [rentedItems, setRentedItems] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllEquipment, setShowAllEquipment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchRenterData = async () => {
      if (currentUser) {
        try {
          // Fetch current rentals
          const rentalsQuery = query(
            collection(db, "rentals"),
            where("renterId", "==", currentUser.uid),
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
          
          setRentedItems(rentals);

          // Fetch favorite equipment (optional - if you implement favorites)
          const favoritesQuery = query(
            collection(db, "favorites"),
            where("userId", "==", currentUser.uid)
          );
          
          const favoritesSnapshot = await getDocs(favoritesQuery);
          const favorites = [];
          
          favoritesSnapshot.forEach((doc) => {
            favorites.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setFavoriteItems(favorites);
        } catch (error) {
          console.error("Error fetching renter data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchRenterData();
  }, [currentUser]);

  // Filter equipment based on search and category
  const filteredEquipment = sampleEquipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return item.available && matchesSearch && matchesCategory;
  });

  const categories = [...new Set(sampleEquipment.map(item => item.category))];

  // Calculate stats
  const totalSpent = rentedItems.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
  const activeRentals = rentedItems.length;

  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Renter Dashboard</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Browse, rent, and manage your equipment rentals in one place.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Rentals</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeRentals}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Spent</dt>
                  <dd className="text-lg font-medium text-gray-900">${totalSpent}</dd>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Favorites</dt>
                  <dd className="text-lg font-medium text-gray-900">{favoriteItems.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Current Rentals */}
      <div className="mt-8">
        <div className="flex justify-between mb-4">
          <h4 className="text-md font-medium text-gray-700">Current Rentals</h4>
          <Link
            to="/browse-equipment"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse All Equipment
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading your rentals...</p>
          </div>
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
                          Until {item.endDate ? new Date(item.endDate.toDate()).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Rented from: {item.ownerName || 'Unknown'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          ${item.totalPrice || 0} • {item.status}
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
            <p className="mt-2 text-gray-500">You don't have any active rentals</p>
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

      {/* Browse Equipment */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-medium text-gray-700">Browse Equipment</h4>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Equipment
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Equipment Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(showAllEquipment ? filteredEquipment : filteredEquipment.slice(0, 6))
            .map((item) => (
            <div key={item.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div className="p-4">
                <h5 className="text-md font-medium text-gray-900">{item.name}</h5>
                <p className="text-sm text-blue-600 font-medium mt-1">{item.category}</p>
                <p className="text-sm text-gray-600 mt-2">{item.description.substring(0, 100)}...</p>
                
                {/* Features */}
                {item.features && item.features.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 font-medium">Features:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.features.slice(0, 2).map((feature, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {feature}
                        </span>
                      ))}
                      {item.features.length > 2 && (
                        <span className="text-xs text-gray-500">+{item.features.length - 2} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <p className="text-lg font-semibold text-green-600">
                    ${item.ratePerDay}/day
                  </p>
                  <Link
                    to={`/rent/${item.id}`}
                    className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Rent Now
                  </Link>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p>📍 {item.location}</p>
                  <p>Owner: {item.ownerName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEquipment.length > 6 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAllEquipment(!showAllEquipment)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {showAllEquipment ? 'Show Less' : `View All ${filteredEquipment.length} Items`}
            </button>
          </div>
        )}

        {filteredEquipment.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No equipment found matching your criteria.</p>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
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
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
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
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
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