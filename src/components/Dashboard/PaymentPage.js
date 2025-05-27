import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import QRCode from 'qrcode.react';

function PaymentPage() {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [days, setDays] = useState(1);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      const docRef = doc(db, 'equipment', equipmentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEquipment({ id: docSnap.id, ...docSnap.data() });
      }
    };
    fetchEquipment();
  }, [equipmentId]);

  const handlePayment = async () => {
    if (!equipment) return;

    const totalPrice = equipment.ratePerDay * days;
    const transactionRef = await addDoc(collection(db, 'payments'), {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      amountPaid: totalPrice,
      days,
      renterId: equipment.renterId || 'test-renter', // Replace with auth user ID
      timestamp: serverTimestamp()
    });

    setTransactionId(transactionRef.id);
    setPaymentSuccess(true);

    // Optional: Navigate or update equipment/rental status here
  };

  if (!equipment) return <div className="container py-5 text-center">Loading equipment...</div>;

  return (
    <div className="container py-5">
      <div className="card shadow-sm">
        <div className="card-body">
          <h4 className="mb-3">Payment for: <strong>{equipment.name}</strong></h4>

          <p className="text-muted">{equipment.description}</p>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Rental Duration (days)</label>
              <input
                type="number"
                className="form-control"
                value={days}
                min={1}
                onChange={(e) => setDays(parseInt(e.target.value))}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Rate per Day</label>
              <input
                type="text"
                className="form-control"
                value={`$${equipment.ratePerDay}`}
                disabled
              />
            </div>
          </div>

          <h5 className="mb-4">Total: <span className="text-success">${equipment.ratePerDay * days}</span></h5>

          {!paymentSuccess ? (
            <button className="btn btn-primary" onClick={handlePayment}>
              Pay & Generate QR
            </button>
          ) : (
            <div className="text-center mt-4">
              <h5 className="text-success mb-3">Payment Successful!</h5>
              <QRCode value={transactionId} size={180} />
              <p className="mt-2 small text-muted">Transaction ID: {transactionId}</p>
              <button
                className="btn btn-outline-secondary mt-3"
                onClick={() => navigate('/renter-dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
