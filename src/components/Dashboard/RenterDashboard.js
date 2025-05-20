import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { sampleEquipment } from '../../data/sampleEquipment';

function RenterDashboard(
  
) {
  const { currentUser } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllEquipment, setShowAllEquipment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchEquipmentList = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'equipment'));
        const equipment = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipmentList(equipment.length ? equipment : sampleEquipment);
      } catch (error) {
        console.error('Error fetching equipment:', error);
        setEquipmentList(sampleEquipment);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentList();
  }, []);

  const filteredEquipment = equipmentList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return item.available && matchesSearch && matchesCategory;
  });

  const categories = [...new Set(equipmentList.map(item => item.category))];

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Welcome to Your Dashboard</h2>
          <p className="text-gray-500 mt-1">Explore and rent available equipment easily.</p>
        </div>
        <Link
          to="/rental-history"
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          View Rental History
        </Link>
      </div>

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
              className="text-blue-600 hover:underline"
            >
              {showAllEquipment ? 'Show Less' : `View All ${filteredEquipment.length} Items`}
            </button>
          </div>
        )}
      </Section>
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
      <input
        type="text"
        placeholder="Search by name or description..."
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
      />
      <select
        value={selectedCategory}
        onChange={e => onCategoryChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
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
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4">
      <h4 className="text-lg font-medium text-gray-800 mb-1">{item.name}</h4>
      <p className="text-sm text-blue-600 mb-1">{item.category}</p>
      <p className="text-sm text-gray-600 mb-2">{item.description?.substring(0, 100)}...</p>
      {item.features && item.features.length > 0 && (
        <div className="flex flex-wrap gap-1 text-xs text-blue-800 mb-2">
          {item.features.slice(0, 2).map((feature, index) => (
            <span key={index} className="bg-blue-100 px-2 py-1 rounded-full">{feature}</span>
          ))}
          {item.features.length > 2 && (
            <span className="text-gray-400">+{item.features.length - 2} more</span>
          )}
        </div>
      )}
      <div className="flex justify-between items-center mt-3">
        <p className="text-green-600 font-semibold">${item.ratePerDay}/day</p>
        <Link
          to={`/rent/${item.id}/fill-details`}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Rent Now
        </Link>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        📍 {item.location} • Owner: {item.ownerName}
      </div>
    </div>
  );
}




export default RenterDashboard;
