// TODO: Implement Rental/RentalHistory.js component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';

function RentalHistory() {
  const { currentUser, userRole } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('as-renter');

  useEffect(() => {
    const fetchRentals = async () => {
      if (!currentUser) return;

      try {
        let rentalQuery;
        
        if (activeTab === 'as-renter') {
          // Get rentals where current user is the renter
          rentalQuery = query(
            collection(db, 'rentals'),
            where('renterId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
        } else {
          // Get rentals where current user is the owner
          rentalQuery = query(
            collection(db, 'rentals'),
            where('ownerId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
        }

        const rentalSnapshot = await getDocs(rentalQuery);
        const rentalData = [];
        
        rentalSnapshot.forEach((doc) => {
          rentalData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setRentals(rentalData);
      } catch (error) {
        console.error('Error fetching rentals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, [currentUser, activeTab]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rental history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">RentMate</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/my-dashboard"
                className="text-gray-700 hover:text-blue-600"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Rental History</h1>
            <p className="mt-2 text-gray-600">View your rental history and track your equipment transactions</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('as-renter')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'as-renter'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                As Renter
              </button>
              {(userRole === 'owner' || userRole === 'admin') && (
                <button
                  onClick={() => setActiveTab('as-owner')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'as-owner'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  As Owner
                </button>
              )}
            </nav>
          </div>

          {/* Rentals List */}
          {rentals.length > 0 ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {activeTab === 'as-renter' ? 'Owner' : 'Renter'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rentals.map((rental) => (
                      <tr key={rental.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {rental.equipmentName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {rental.equipmentId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activeTab === 'as-renter' ? rental.ownerName : rental.renterName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</div>
                            <div className="text-xs text-gray-500">
                              {Math.ceil((rental.endDate.toDate() - rental.startDate.toDate()) / (1000 * 60 * 60 * 24))} days
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${rental.totalPrice?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(rental.status)}`}>
                            {rental.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/equipment/${rental.equipmentId}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Equipment
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No rental history</h3>
                <p className="mt-1 text-gray-500">
                  {activeTab === 'as-renter' 
                    ? "You haven't rented any equipment yet." 
                    : "You haven't had any rentals of your equipment yet."}
                </p>
                <div className="mt-6">
                  {activeTab === 'as-renter' ? (
                    <Link
                      to="/"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Browse Equipment
                    </Link>
                  ) : (
                    <Link
                      to="/add-equipment"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Add Equipment
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RentalHistory;