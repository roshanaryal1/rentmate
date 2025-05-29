// src/components/Rental/RentalApprovalSystem.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase';

function RentalApprovalSystem() {
  const { currentUser } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [processedRequests, setProcessedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchRentalRequests();
    }
  }, [currentUser]);

  const fetchRentalRequests = async () => {
    try {
      setLoading(true);
      
      // Get equipment owned by current user to find related rental requests
      const equipmentQuery = query(
        collection(db, 'equipment'),
        where('ownerId', '==', currentUser.uid)
      );
      const equipmentSnapshot = await getDocs(equipmentQuery);
      const equipmentIds = equipmentSnapshot.docs.map(doc => doc.id);

      if (equipmentIds.length === 0) {
        setPendingRequests([]);
        setProcessedRequests([]);
        setLoading(false);
        return;
      }

      // Get rental requests for owner's equipment
      // Note: Firebase 'in' queries are limited to 10 items, so we'll handle this in chunks
      const allRequests = [];
      
      // Process in chunks of 10
      for (let i = 0; i < equipmentIds.length; i += 10) {
        const chunk = equipmentIds.slice(i, i + 10);
        const requestsQuery = query(
          collection(db, 'rentals'),
          where('equipmentId', 'in', chunk),
          orderBy('createdAt', 'desc')
        );
        
        const requestsSnapshot = await getDocs(requestsQuery);
        requestsSnapshot.forEach(doc => {
          allRequests.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }

      // Separate pending and processed requests
      const pending = allRequests.filter(req => req.status === 'pending');
      const processed = allRequests.filter(req => 
        req.status === 'approved' || req.status === 'declined'
      );

      setPendingRequests(pending);
      setProcessedRequests(processed);
      
    } catch (error) {
      console.error('Error fetching rental requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      
      // Update rental status
      const rentalRef = doc(db, 'rentals', requestId);
      await updateDoc(rentalRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.uid,
        updatedAt: serverTimestamp()
      });

      // Update equipment availability
      const request = pendingRequests.find(req => req.id === requestId);
      if (request) {
        const equipmentRef = doc(db, 'equipment', request.equipmentId);
        await updateDoc(equipmentRef, {
          available: false, // Mark as unavailable during rental period
          updatedAt: serverTimestamp()
        });

        // Create notification for renter
        await addDoc(collection(db, 'notifications'), {
          userId: request.renterId,
          type: 'rental_approved',
          title: 'Rental Request Approved!',
          message: `Your rental request for ${request.equipmentName} has been approved.`,
          equipmentId: request.equipmentId,
          rentalId: requestId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Refresh the requests
      await fetchRentalRequests();
      
      alert('✅ Rental request approved successfully!');
      
    } catch (error) {
      console.error('Error approving request:', error);
      alert('❌ Failed to approve request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId, reason = '') => {
    try {
      setProcessingId(requestId);
      
      // Update rental status
      const rentalRef = doc(db, 'rentals', requestId);
      await updateDoc(rentalRef, {
        status: 'declined',
        declinedAt: serverTimestamp(),
        declinedBy: currentUser.uid,
        declineReason: reason,
        updatedAt: serverTimestamp()
      });

      // Create notification for renter
      const request = pendingRequests.find(req => req.id === requestId);
      if (request) {
        await addDoc(collection(db, 'notifications'), {
          userId: request.renterId,
          type: 'rental_declined',
          title: 'Rental Request Declined',
          message: `Your rental request for ${request.equipmentName} has been declined. ${reason ? 'Reason: ' + reason : ''}`,
          equipmentId: request.equipmentId,
          rentalId: requestId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Refresh the requests
      await fetchRentalRequests();
      
      // Close modal and reset
      setShowModal(false);
      setSelectedRequest(null);
      setDeclineReason('');
      
      alert('✅ Rental request declined.');
      
    } catch (error) {
      console.error('Error declining request:', error);
      alert('❌ Failed to decline request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const openDeclineModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const closeDeclineModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setDeclineReason('');
  };

  const formatDate = (dateObj) => {
    if (!dateObj || !dateObj.toDate) return 'Unknown';
    return dateObj.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateObj) => {
    if (!dateObj || !dateObj.toDate) return 'Unknown';
    return dateObj.toDate().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'bg-warning', text: 'Pending Review' },
      approved: { class: 'bg-success', text: 'Approved' },
      declined: { class: 'bg-danger', text: 'Declined' },
      active: { class: 'bg-info', text: 'Active' },
      completed: { class: 'bg-primary', text: 'Completed' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading rental requests...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h2 className="h3 fw-bold">Rental Request Management</h2>
          <p className="text-muted">Review and manage rental requests for your equipment</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="text-warning mb-2">
                <i className="bi bi-clock-history display-6"></i>
              </div>
              <h3 className="fw-bold">{pendingRequests.length}</h3>
              <p className="text-muted mb-0">Pending Requests</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="text-success mb-2">
                <i className="bi bi-check-circle display-6"></i>
              </div>
              <h3 className="fw-bold">
                {processedRequests.filter(req => req.status === 'approved').length}
              </h3>
              <p className="text-muted mb-0">Approved</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="text-danger mb-2">
                <i className="bi bi-x-circle display-6"></i>
              </div>
              <h3 className="fw-bold">
                {processedRequests.filter(req => req.status === 'declined').length}
              </h3>
              <p className="text-muted mb-0">Declined</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="text-info mb-2">
                <i className="bi bi-list-check display-6"></i>
              </div>
              <h3 className="fw-bold">{pendingRequests.length + processedRequests.length}</h3>
              <p className="text-muted mb-0">Total Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="row mb-4">
        <div className="col">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <i className="bi bi-clock-history me-2"></i>
                Pending Requests ({pendingRequests.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'processed' ? 'active' : ''}`}
                onClick={() => setActiveTab('processed')}
              >
                <i className="bi bi-list-check me-2"></i>
                Processed Requests ({processedRequests.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Content */}
      <div className="row">
        <div className="col">
          {activeTab === 'pending' && (
            <div>
              {pendingRequests.length > 0 ? (
                <div className="row">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="col-lg-6 mb-4">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-header bg-warning bg-opacity-10 border-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold">{request.equipmentName}</h6>
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <div className="row g-2">
                              <div className="col-sm-6">
                                <strong className="text-muted small">Renter:</strong>
                                <div>{request.renterName}</div>
                                <div className="small text-muted">{request.renterEmail}</div>
                              </div>
                              <div className="col-sm-6">
                                <strong className="text-muted small">Phone:</strong>
                                <div>{request.renterPhone}</div>
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="row g-2">
                              <div className="col-sm-6">
                                <strong className="text-muted small">Start Date:</strong>
                                <div>{formatDate(request.startDate)}</div>
                              </div>
                              <div className="col-sm-6">
                                <strong className="text-muted small">End Date:</strong>
                                <div>{formatDate(request.endDate)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="row g-2">
                              <div className="col-sm-6">
                                <strong className="text-muted small">Duration:</strong>
                                <div>{request.totalDays} day{request.totalDays !== 1 ? 's' : ''}</div>
                              </div>
                              <div className="col-sm-6">
                                <strong className="text-muted small">Total Cost:</strong>
                                <div className="fw-bold text-success">${request.totalPrice}</div>
                              </div>
                            </div>
                          </div>

                          {request.renterAddress && (
                            <div className="mb-3">
                              <strong className="text-muted small">Address:</strong>
                              <div className="small">{request.renterAddress}</div>
                            </div>
                          )}

                          {request.notes && (
                            <div className="mb-3">
                              <strong className="text-muted small">Notes:</strong>
                              <div className="small bg-light p-2 rounded">{request.notes}</div>
                            </div>
                          )}

                          <div className="mb-3">
                            <strong className="text-muted small">Requested:</strong>
                            <div className="small">{formatDateTime(request.createdAt)}</div>
                          </div>
                        </div>
                        <div className="card-footer bg-transparent border-0 pt-0">
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-success flex-fill"
                              onClick={() => handleApprove(request.id)}
                              disabled={processingId === request.id}
                            >
                              {processingId === request.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-check-circle me-2"></i>
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              className="btn btn-outline-danger flex-fill"
                              onClick={() => openDeclineModal(request)}
                              disabled={processingId === request.id}
                            >
                              <i className="bi bi-x-circle me-2"></i>
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-inbox display-1 text-muted"></i>
                  <h5 className="mt-3">No Pending Requests</h5>
                  <p className="text-muted">You don't have any pending rental requests at the moment.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'processed' && (
            <div>
              {processedRequests.length > 0 ? (
                <div className="card border-0 shadow-sm">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Equipment</th>
                          <th>Renter</th>
                          <th>Dates</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Processed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedRequests.map(request => (
                          <tr key={request.id}>
                            <td>
                              <div className="fw-semibold">{request.equipmentName}</div>
                              <div className="small text-muted">ID: {request.equipmentId}</div>
                            </td>
                            <td>
                              <div>{request.renterName}</div>
                              <div className="small text-muted">{request.renterEmail}</div>
                            </td>
                            <td>
                              <div>{formatDate(request.startDate)}</div>
                              <div className="small text-muted">to {formatDate(request.endDate)}</div>
                            </td>
                            <td>
                              <div className="fw-bold">${request.totalPrice}</div>
                              <div className="small text-muted">{request.totalDays} days</div>
                            </td>
                            <td>{getStatusBadge(request.status)}</td>
                            <td>
                              <div className="small">
                                {formatDateTime(request.approvedAt || request.declinedAt)}
                              </div>
                              {request.declineReason && (
                                <div className="small text-muted">
                                  Reason: {request.declineReason}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-archive display-1 text-muted"></i>
                  <h5 className="mt-3">No Processed Requests</h5>
                  <p className="text-muted">You haven't processed any rental requests yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Decline Modal */}
      {showModal && selectedRequest && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-x-circle text-danger me-2"></i>
                  Decline Rental Request
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDeclineModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p>Are you sure you want to decline the rental request for:</p>
                  <div className="bg-light p-3 rounded">
                    <strong>{selectedRequest.equipmentName}</strong>
                    <br />
                    <small className="text-muted">
                      Requested by: {selectedRequest.renterName} ({selectedRequest.renterEmail})
                    </small>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Reason for decline (optional but recommended):
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Please provide a reason for declining this request..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeDeclineModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDecline(selectedRequest.id, declineReason)}
                  disabled={processingId === selectedRequest.id}
                >
                  {processingId === selectedRequest.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Declining...
                    </>
                  ) : (
                    'Decline Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RentalApprovalSystem;