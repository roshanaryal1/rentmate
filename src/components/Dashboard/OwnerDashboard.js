import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import './OwnerDashboard.css'; // ✅ Link the custom CSS

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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Owner Dashboard</h2>
        <p>Manage your listed equipment and track availability.</p>
      </div>

      <div className="dashboard-actions">
        <Link to="/add-equipment" className="add-btn">+ Add New Equipment</Link>
        <Link to="/equipment-analytics" className="analytics-btn">View Analytics</Link>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Equipment</h3>
        {loading ? (
          <p className="text-gray-500">Loading equipment...</p>
        ) : equipmentItems.length > 0 ? (
          <ul className="equipment-list">
            {equipmentItems.map(item => (
              <li key={item.id} className="equipment-card">
                <img
                  src={item.imageUrl || 'https://via.placeholder.com/400x250.png?text=No+Image'}
                  alt={item.name}
                />
                <div className="equipment-info">
                  <h4>{item.name}</h4>
                  <p>{item.category}</p>
                  <span className={`status-badge ${item.available ? 'available' : 'unavailable'}`}>
                    {item.available ? 'Available' : 'Rented Out'}
                  </span>
                  <p className="rate">${item.ratePerDay}/day</p>
                  <Link to={`/equipment/${item.id}`} className="details-link">
                    View Details →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-equipment">
            <p>You haven’t listed any equipment yet.</p>
            <Link to="/add-equipment">Add Your First Equipment</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
