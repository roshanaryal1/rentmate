// TODO: Implement Equipment/RentEquipment.js component
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

function RentEquipment() {
  const { equipmentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const docRef = doc(db, 'equipment', equipmentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEquipment({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Equipment not found.');
        }
      } catch (err) {
        setError('Failed to fetch equipment.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [equipmentId]);

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      return setError('Please select both start and end dates.');
    }

    try {
      const rentalRef = collection(db, 'rentals');
      const totalDays = (new Date(endDate) - new Date(startDate)) / (1000 * 3600 * 24);
      const totalPrice = Math.ceil(totalDays) * equipment.ratePerDay;

      await addDoc(rentalRef, {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        renterId: currentUser.uid,
        renterEmail: currentUser.email,
        ownerId: equipment.ownerId,
        ownerName: equipment.ownerName,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        totalPrice,
        status: 'active',
        createdAt: Timestamp.now(),
      });

      navigate('/renter-dashboard');
    } catch (err) {
      console.error(err);
      setError('Booking failed. Please try again.');
    }
  };

  if (loading) return <div className="text-center py-6">Loading equipment details...</div>;
  if (error) return <div className="text-red-600 text-center py-6">{error}</div>;
  if (!equipment) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Rent: {equipment.name}</h2>
      <p className="text-gray-600 mb-2">Category: {equipment.category}</p>
      <p className="text-gray-600 mb-4">{equipment.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <button
        onClick={handleBooking}
        className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
      >
        Confirm Booking
      </button>
    </div>
  );
}

export default RentEquipment;
