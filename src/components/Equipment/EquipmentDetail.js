// TODO: Implement Equipment/EquipmentDetail.js component
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';

function EquipmentDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const equipmentDoc = await getDoc(doc(db, 'equipment', id));
        if (equipmentDoc.exists()) {
          const equipmentData = { id: equipmentDoc.id, ...equipmentDoc.data() };
          setEquipment(equipmentData);
          
          // Increment view count
          await updateDoc(doc(db, 'equipment', id), {
            views: increment(1)
          });
        } else {
          setError('Equipment not found');
        }
      } catch (error) {
        console.error('Error fetching equipment:', error);
        setError('Failed to load equipment details');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [id]);

  const handleRentClick = () => {
    if (!currentUser) {
      // Store the equipment ID they wanted to rent and redirect to login
      localStorage.setItem('pendingRental', id);
      navigate('/login');
    } else {
      navigate(`/rent/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading equipment details...</p>
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Equipment Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The equipment you\'re looking for doesn\'t exist.'}</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Browse
          </Link>
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
              {currentUser ? (
                <Link
                  to="/my-dashboard"
                  className="text-gray-700 hover:text-blue-600"
                >
                  My Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600"
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

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-500 mb-4 inline-block"
          >
            ← Back to Browse
          </Link>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Equipment Header */}
            <div className="px-6 py-8 bg-gray-50 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
                  <p className="text-lg text-blue-600 font-medium mt-1">{equipment.category}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{equipment.views} views</span>
                    <span>•</span>
                    <span>{equipment.rentals} rentals</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">${equipment.ratePerDay}/day</p>
                  <div className="mt-2">
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      equipment.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {equipment.available ? 'Available' : 'Currently Rented'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment Details */}
            <div className="px-6 py-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{equipment.description}</p>

                  {equipment.features && equipment.features.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                      <ul className="space-y-2">
                        {equipment.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2 text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Rental Information</h2>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Owner</dt>
                      <dd className="mt-1 text-gray-900">{equipment.ownerName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="mt-1 text-gray-900">{equipment.location}</dd>
                    </div>
                    {equipment.contactInfo && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Contact Info</dt>
                        <dd className="mt-1 text-gray-900">{equipment.contactInfo}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          equipment.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {equipment.status === 'approved' ? 'Approved' : 'Pending Approval'}
                        </span>
                      </dd>
                    </div>
                  </dl>

                  {/* Rent Button */}
                  <div className="mt-8">
                    {equipment.available && equipment.status === 'approved' ? (
                      <button
                        onClick={handleRentClick}
                        className="w-full py-3 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {currentUser ? 'Rent This Equipment' : 'Login to Rent'}
                      </button>
                    ) : (
                      <div className="w-full py-3 px-6 border border-gray-300 rounded-md shadow-sm text-lg font-medium text-gray-400 bg-gray-100 text-center">
                        {!equipment.available ? 'Currently Unavailable' : 'Pending Approval'}
                      </div>
                    )}
                  </div>

                  {!currentUser && (
                    <p className="mt-3 text-sm text-gray-500 text-center">
                      <Link to="/signup" className="text-blue-600 hover:text-blue-500">
                        Sign up
                      </Link> or{' '}
                      <Link to="/login" className="text-blue-600 hover:text-blue-500">
                        login
                      </Link> to start renting equipment
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentDetail;