import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

function PublicDashboard() {
  const { currentUser, logout } = useAuth();
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        // Fetch all available equipment
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
        
        setEquipmentItems(equipment);
      } catch (error) {
        console.error("Error fetching equipment:", error);
        setError('Failed to load equipment');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEquipment();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleRentClick = (equipmentId) => {
    if (!currentUser) {
      // Store the equipment ID they wanted to rent and redirect to login
      localStorage.setItem('pendingRental', equipmentId);
      navigate('/login');
    } else {
      // User is authenticated, proceed with rental
      navigate(`/rent/${equipmentId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-blue-600">RentMate</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/my-dashboard"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    My Dashboard
                  </Link>
                  <span className="text-sm font-medium text-gray-700">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Available Equipment</h1>
            <p className="mt-2 text-gray-600">Browse and rent equipment from our community</p>
            {!currentUser && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">
                  <Link to="/login" className="font-medium underline">Login</Link> or{' '}
                  <Link to="/signup" className="font-medium underline">Sign up</Link> to start renting equipment!
                </p>
              </div>
            )}
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {loading ? (
                <div className="text-center py-10">
                  <p>Loading available equipment...</p>
                </div>
              ) : equipmentItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {equipmentItems.map((item) => (
                    <div key={item.id} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                        <p className="mt-1 text-gray-500">{item.category}</p>
                        <p className="mt-2 text-gray-600">{item.description}</p>
                        <div className="mt-4 flex justify-between items-center">
                          <p className="text-lg font-medium text-green-600">
                            ${item.ratePerDay}/day
                          </p>
                          <button
                            onClick={() => handleRentClick(item.id)}
                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            {currentUser ? 'Rent Now' : 'Login to Rent'}
                          </button>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Owner: {item.ownerName}</p>
                          <p>Location: {item.location || 'Location not specified'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No equipment available at the moment</p>
                  {currentUser && (
                    <div className="mt-4">
                      <Link
                        to="/my-dashboard"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        Go to My Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default PublicDashboard;