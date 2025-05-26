import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { sampleEquipment } from '../../data/sampleEquipment';

function RenterDashboard() {
  const { currentUser } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllEquipment, setShowAllEquipment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [stats, setStats] = useState({
    totalRentals: 0,
    activeRentals: 0,
    totalSpent: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch equipment list
        const equipmentSnapshot = await getDocs(collection(db, 'equipment'));
        const equipment = equipmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipmentList(equipment.length ? equipment : sampleEquipment);

        // Fetch rental history for current user
        if (currentUser) {
          const rentalsQuery = query(
            collection(db, 'rentals'),
            where('renterId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          
          try {
            const rentalsSnapshot = await getDocs(rentalsQuery);
            const rentals = rentalsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setRentalHistory(rentals);
            
            // Calculate stats
            const totalRentals = rentals.length;
            const activeRentals = rentals.filter(r => r.status === 'active').length;
            const totalSpent = rentals.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
            
            setStats({ totalRentals, activeRentals, totalSpent });
          } catch (error) {
            console.log('Error fetching rentals, using sample data:', error);
            // Use sample rental data
            const sampleRentals = [
              {
                id: 'rental-001',
                equipmentName: 'Power Drill (Cordless, 18V)',
                equipmentId: 'eq-011',
                status: 'completed',
                startDate: { toDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                endDate: { toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
                totalPrice: 125,
                ownerName: 'Tool Rental Pro'
              },
              {
                id: 'rental-002',
                equipmentName: 'Pressure Washer (3000 PSI)',
                equipmentId: 'eq-038',
                status: 'active',
                startDate: { toDate: () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
                endDate: { toDate: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
                totalPrice: 150,
                ownerName: 'Clean Force'
              }
            ];
            setRentalHistory(sampleRentals);
            setStats({
              totalRentals: sampleRentals.length,
              activeRentals: sampleRentals.filter(r => r.status === 'active').length,
              totalSpent: sampleRentals.reduce((sum, r) => sum + r.totalPrice, 0)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setEquipmentList(sampleEquipment);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return item.available && matchesSearch && matchesCategory;
  });

  const categories = [...new Set(equipmentList.map(item => item.category))];

  const formatDate = (dateObj) => {
    if (!dateObj || !dateObj.toDate) return 'Unknown';
    return dateObj.toDate().toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const badgeClass = {
      'active': 'bg-success',
      'completed': 'bg-primary', 
      'pending': 'bg-warning',
      'cancelled': 'bg-danger'
    };
    
    return (
      <span className={`badge ${badgeClass[status] || 'bg-secondary'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0]}!
        </h2>
        <p className="text-gray-500 mt-1">Find and rent the equipment you need for your projects.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Rentals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalRentals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Rentals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeRentals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Spent</p>
              <p className="text-2xl font-semibold text-gray-900">${stats.totalSpent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'browse'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Browse Equipment
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rentals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Rentals
          </button>
        </nav>
      </div>

      {/* Browse Equipment Tab */}
      {activeTab === 'browse' && (
        <Section title="Browse Equipment">
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
            />
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-6">Loading equipment...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showAllEquipment ? filteredEquipment : filteredEquipment.slice(0, 6)).map(item => (
                <EquipmentCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {filteredEquipment.length > 6 && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAllEquipment(!showAllEquipment)}
                className="text-blue-600 hover:underline font-medium"
              >
                {showAllEquipment ? 'Show Less' : `View All ${filteredEquipment.length} Items`}
              </button>
            </div>
          )}
        </Section>
      )}

      {/* My Rentals Tab */}
      {activeTab === 'rentals' && (
        <Section title="My Rentals">
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              {rentalHistory.length} rental{rentalHistory.length !== 1 ? 's' : ''} found
            </p>
            <Link
              to="/rental-history"
              className="text-blue-600 hover:underline font-medium"
            >
              View Full History
            </Link>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-6">Loading rentals...</div>
          ) : rentalHistory.length > 0 ? (
            <div className="space-y-4">
              {rentalHistory.slice(0, 5).map(rental => (
                <div key={rental.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-800">{rental.equipmentName}</h4>
                      <p className="text-gray-600 mt-1">From: {rental.ownerName}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        <span>{formatDate(rental.startDate)} - {formatDate(rental.endDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(rental.status)}
                      <p className="text-lg font-semibold text-gray-900 mt-2">${rental.totalPrice}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <Link
                      to={`/rental-details/${rental.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Details
                    </Link>
                    {rental.status === 'completed' && (
                      <Link
                        to={`/review/${rental.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Leave Review
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No rentals yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by browsing available equipment.</p>
              <div className="mt-6">
                <button
                  onClick={() => setActiveTab('browse')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Equipment
                </button>
              </div>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SearchFilter({ searchTerm, onSearchChange, selectedCategory, onCategoryChange, categories }) {
  return (
    <>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by name or description..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <select
        value={selectedCategory}
        onChange={e => onCategoryChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">All Categories</option>
        {categories.map(category => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
    </>
  );
}

function EquipmentCard({ item }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="h-48 bg-gray-200 relative">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="w-full h-full bg-gray-200 flex items-center justify-center" style={{display: item.imageUrl ? 'none' : 'flex'}}>
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div className="absolute top-2 right-2">
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            Available
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h4 className="text-lg font-medium text-gray-800 mb-1">{item.name}</h4>
        <p className="text-sm text-blue-600 mb-2">{item.category}</p>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description?.substring(0, 100)}...
        </p>
        
        {item.features && item.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.features.slice(0, 2).map((feature, index) => (
              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {feature}
              </span>
            ))}
            {item.features.length > 2 && (
              <span className="text-xs text-gray-400">+{item.features.length - 2} more</span>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <p className="text-green-600 font-semibold text-lg">${item.ratePerDay}/day</p>
          <Link
            to={`/rent/${item.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Rent Now
          </Link>
        </div>
        
        <div className="text-xs text-gray-500 mt-2 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {item.location} • Owner: {item.ownerName}
        </div>
      </div>
    </div>
  );
}

export default RenterDashboard;