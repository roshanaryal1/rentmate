import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

function RentEquipment() {
  const { equipmentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const docRef = doc(db, 'equipment', equipmentId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Equipment not found');
        }
        
        const equipmentData = docSnap.data();
        
        // Validate equipment is available for rent
        if (equipmentData.status !== 'available') {
          throw new Error('This equipment is not currently available for rent');
        }
        
        setEquipment({ id: docSnap.id, ...equipmentData });
      } catch (err) {
        setError(err.message || 'Failed to fetch equipment details');
        console.error('Fetch equipment error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [equipmentId]);

  useEffect(() => {
    if (startDate && endDate && equipment) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate dates
      if (start >= end) {
        setError('End date must be after start date');
        return;
      }
      
      const days = Math.ceil((end - start) / (1000 * 3600 * 24));
      const price = days * equipment.ratePerDay;
      
      setTotalDays(days);
      setTotalPrice(price);
      setError('');
    }
  }, [startDate, endDate, equipment]);

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      return setError('Please select both start and end dates');
    }

    if (new Date(startDate) < new Date()) {
      return setError('Start date cannot be in the past');
    }

    setIsSubmitting(true);
    setError('');

    try {
      const rentalRef = collection(db, 'rentals');
      
      await addDoc(rentalRef, {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentImage: equipment.imageUrl || null,
        renterId: currentUser.uid,
        renterEmail: currentUser.email,
        ownerId: equipment.ownerId,
        ownerName: equipment.ownerName,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        totalPrice,
        status: 'pending', // Start as pending for owner approval
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Show success message before redirect
      alert('Booking request submitted successfully!');
      navigate('/renter-dashboard');
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading equipment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => navigate(-1)} 
            className="absolute top-0 right-0 px-4 py-3"
          >
            &times;
          </button>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Equipment
        </button>
      </div>
    );
  }

  if (!equipment) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Rent Equipment</h2>
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {equipment.imageUrl && (
          <div className="md:w-1/3">
            <img 
              src={equipment.imageUrl} 
              alt={equipment.name} 
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>
        )}
        
        <div className={`${equipment.imageUrl ? 'md:w-2/3' : 'w-full'}`}>
          <h3 className="text-2xl font-semibold mb-2">{equipment.name}</h3>
          <div className="flex items-center mb-4">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              {equipment.category}
            </span>
            <span className="ml-4 text-gray-600">
              ${equipment.ratePerDay} / day
            </span>
          </div>
          
          <p className="text-gray-700 mb-4">{equipment.description}</p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Owner Information</h4>
            <p className="text-gray-600">{equipment.ownerName}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleBooking} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {totalDays > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Rental Period:</span>
              <span className="font-medium">{totalDays} day{totalDays !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-800">Total Price:</span>
              <span className="font-bold text-blue-600">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || !startDate || !endDate || totalDays <= 0}
            className={`px-6 py-2 rounded-md text-white ${isSubmitting || !startDate || !endDate || totalDays <= 0 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block mr-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                Processing...
              </>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RentEquipment;