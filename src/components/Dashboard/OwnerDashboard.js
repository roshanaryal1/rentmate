import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

function OwnerDashboard() {
  const { currentUser } = useAuth();
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEquipment = async () => {
      if (currentUser) {
        try {
          const q = query(
            collection(db, 'equipment'),
            where('ownerId', '==', currentUser.uid)
          );
          const snapshot = await getDocs(q);
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEquipmentItems(items);
        } catch (error) {
          console.error('Error fetching equipment:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEquipment();
  }, [currentUser]);

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Owner Dashboard</h2>
        <p className="text-gray-600">Manage your listed equipment and track availability.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Link
          to="/add-equipment"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          + Add New Equipment
        </Link>
        <Link
          to="/equipment-analytics"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
        >
          View Analytics
        </Link>
      </div>

      {/* Equipment List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Equipment</h3>
        {loading ? (
          <p>Loading equipment...</p>
        ) : equipmentItems.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentItems.map(item => (
              <li key={item.id} className="bg-white shadow rounded-lg overflow-hidden">
                <img
                  src={item.imageUrl || '/placeholder-image.png'}
                  alt={item.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-blue-600">{item.name}</h4>
                  <p className="text-sm text-gray-500">{item.category}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.available ? (
                      <span className="text-green-600">Available</span>
                    ) : (
                      <span className="text-red-600">Rented Out</span>
                    )}
                  </p>
                  <p className="mt-2 text-green-600 font-medium">${item.ratePerDay}/day</p>
                  <Link
                    to={`/equipment/${item.id}`}
                    className="block mt-3 text-sm text-blue-500 hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500 text-center py-10">
            <p>You haven’t listed any equipment yet.</p>
            <Link
              to="/add-equipment"
              className="mt-4 inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
            >
              Add Your First Equipment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
