// src/components/Dashboard/AdminDashboard.jsx - Enhanced with Tooltips and Dark Mode

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router';
import { 
  Row, Col, Card, Badge, Dropdown, Button, Form, InputGroup, Modal, Table, Alert, Spinner, ProgressBar,
  OverlayTrigger, Tooltip
} from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { 
  Bell, Flag, Building, People, Tools, FileEarmark, HouseDoor, Gear, GraphUp, CheckCircle, Person, Search, BoxArrowRight, PencilSquare, Eye, Envelope, Calendar, Shield, XCircle, Check, X, Trash, Ban, Download, Upload, Save, ChatText, StarFill, ExclamationTriangle, FileText, Archive, Moon, Sun
} from 'react-bootstrap-icons';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { equipmentService } from '../../services/equipmentService';

// Dark Mode Context
const DarkModeContext = createContext();

const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('adminDashboard_darkMode');
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('adminDashboard_darkMode', JSON.stringify(newMode));
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

// Enhanced Tooltip Wrapper Component
const TooltipWrapper = ({ children, tooltip, placement = "top", ...props }) => (
  <OverlayTrigger
    placement={placement}
    overlay={<Tooltip {...props}>{tooltip}</Tooltip>}
  >
    {children}
  </OverlayTrigger>
);

function getLastNMonths(n = 6) {
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const arr = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    arr.push({
      label: monthsShort[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
      start: startOfMonth(d),
      end: endOfMonth(d),
    });
  }
  return arr;
}

// ----------- AUDIT LOGGING FUNCTION ----------
const logAdminAction = async (action, details, adminId) => {
  try {
    await addDoc(collection(db, 'adminActions'), {
      action,
      ...details,
      timestamp: serverTimestamp(),
      adminId: adminId || 'system',
      ip: 'xxx.xxx.xxx.xxx', // In production, capture real IP
      userAgent: navigator.userAgent
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

// ----------- DISPUTE RESOLUTION MODAL ----------
function DisputeResolutionModal({ dispute, isOpen, onClose, onDisputeUpdate }) {
  const [resolution, setResolution] = useState('');
  const [action, setAction] = useState('resolve_favor_renter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen) {
      setResolution('');
      setAction('resolve_favor_renter');
      setError('');
    }
  }, [isOpen]);

  const handleResolve = async () => {
    if (!resolution.trim()) {
      setError('Please provide a resolution explanation.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData = {
        status: 'resolved',
        resolution: resolution,
        resolutionAction: action,
        resolvedBy: currentUser?.uid,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'disputes', dispute.id), updateData);

      // Log admin action
      await logAdminAction('dispute_resolution', {
        targetDisputeId: dispute.id,
        targetRentalId: dispute.rentalId,
        resolutionAction: action,
        resolution: resolution
      }, currentUser?.uid);

      // Create notifications for involved parties
      const notifications = [
        {
          userId: dispute.renterId,
          title: 'Dispute Resolved',
          message: `Your dispute for rental #${dispute.rentalId?.slice(-8)} has been resolved: ${resolution}`,
          type: 'info',
          timestamp: serverTimestamp(),
          read: false
        },
        {
          userId: dispute.ownerId,
          title: 'Dispute Resolved',
          message: `The dispute for your equipment rental has been resolved: ${resolution}`,
          type: 'info',
          timestamp: serverTimestamp(),
          read: false
        }
      ];

      for (const notification of notifications) {
        await addDoc(collection(db, 'notifications'), notification);
      }

      onDisputeUpdate(dispute.id, { ...dispute, ...updateData });
      onClose();
    } catch (error) {
      setError('Failed to resolve dispute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !dispute) return null;

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      size="lg" 
      centered
      className={isDarkMode ? 'dark-mode' : ''}
    >
      <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
        <Modal.Title>
          <Flag className="me-2 text-warning" />
          Resolve Dispute
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={isDarkMode ? 'bg-dark text-light' : ''}>
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}
        
        <div className="mb-4">
          <h6>Dispute Details</h6>
          <Card className={isDarkMode ? 'bg-secondary border-secondary' : 'bg-light'}>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Rental ID:</strong> #{dispute.rentalId?.slice(-8)}</p>
                  <p><strong>Equipment:</strong> {dispute.equipmentName}</p>
                  <p><strong>Type:</strong> <Badge bg="warning">{dispute.type}</Badge></p>
                </Col>
                <Col md={6}>
                  <p><strong>Filed by:</strong> {dispute.reporterName}</p>
                  <p><strong>Filed on:</strong> {dispute.createdAt ? new Date(dispute.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</p>
                  <p><strong>Priority:</strong> <Badge bg={dispute.priority === 'high' ? 'danger' : dispute.priority === 'medium' ? 'warning' : 'info'}>{dispute.priority}</Badge></p>
                </Col>
              </Row>
              <div className="mt-2">
                <strong>Description:</strong>
                <p className="mt-1">{dispute.description}</p>
              </div>
              {dispute.evidence && (
                <div className="mt-2">
                  <strong>Evidence:</strong>
                  <div className="mt-1">
                    {dispute.evidence.map((item, index) => (
                      <a key={index} href={item.url} target="_blank" rel="noopener noreferrer" className="me-2">
                        📎 {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Resolution Action:</Form.Label>
          <Form.Select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            disabled={loading}
            className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
          >
            <option value="resolve_favor_renter">Resolve in favor of renter</option>
            <option value="resolve_favor_owner">Resolve in favor of owner</option>
            <option value="resolve_compromise">Compromise resolution</option>
            <option value="dismiss_dispute">Dismiss dispute</option>
            <option value="escalate_external">Escalate to external mediation</option>
          </Form.Select>
        </Form.Group>

        <Form.Group>
          <Form.Label>Resolution Explanation:</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Explain the resolution and any actions taken..."
            disabled={loading}
            className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className={isDarkMode ? 'bg-dark border-secondary' : ''}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleResolve} disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Resolving...
            </>
          ) : (
            'Resolve Dispute'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ----------- REVIEW MODERATION MODAL ----------
function ReviewModerationModal({ review, isOpen, onClose, onReviewUpdate }) {
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen) {
      setAction('approve');
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if ((action === 'reject' || action === 'remove') && !reason.trim()) {
      setError('Please provide a reason for this action.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData = {
        moderationStatus: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'removed',
        moderatedBy: currentUser?.uid,
        moderatedAt: serverTimestamp(),
        moderationReason: action !== 'approve' ? reason : null,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'reviews', review.id), updateData);

      // Log admin action
      await logAdminAction('review_moderation', {
        targetReviewId: review.id,
        targetEquipmentId: review.equipmentId,
        action: action,
        reason: reason || null
      }, currentUser?.uid);

      // Notify review author if rejected/removed
      if (action !== 'approve') {
        await addDoc(collection(db, 'notifications'), {
          userId: review.userId,
          title: `Review ${action === 'reject' ? 'Rejected' : 'Removed'}`,
          message: `Your review has been ${action}ed: ${reason}`,
          type: 'warning',
          timestamp: serverTimestamp(),
          read: false
        });
      }

      onReviewUpdate(review.id, { ...review, ...updateData });
      onClose();
    } catch (error) {
      setError(`Failed to ${action} review. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !review) return null;

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      size="lg" 
      centered
      className={isDarkMode ? 'dark-mode' : ''}
    >
      <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
        <Modal.Title>
          <StarFill className="me-2 text-warning" />
          Moderate Review
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={isDarkMode ? 'bg-dark text-light' : ''}>
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}
        
        <div className="mb-4">
          <h6>Review Details</h6>
          <Card className={isDarkMode ? 'bg-secondary border-secondary' : 'bg-light'}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="d-flex align-items-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <StarFill
                        key={i}
                        className={`me-1 ${i < review.rating ? 'text-warning' : 'text-muted'}`}
                        size={16}
                      />
                    ))}
                    <span className="ms-2 fw-bold">{review.rating}/5</span>
                  </div>
                  <p className="mb-0"><strong>By:</strong> {review.userName}</p>
                  <p className="mb-0"><strong>Equipment:</strong> {review.equipmentName}</p>
                  <p className="mb-0"><strong>Posted:</strong> {review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</p>
                </div>
                {review.flaggedCount && (
                  <Badge bg="danger">🚩 {review.flaggedCount} reports</Badge>
                )}
              </div>
              <div className="mt-3">
                <strong>Review Content:</strong>
                <p className={`mt-1 border p-2 rounded ${isDarkMode ? 'bg-dark text-light border-secondary' : 'bg-white'}`}>
                  {review.comment}
                </p>
              </div>
              {review.images && review.images.length > 0 && (
                <div className="mt-2">
                  <strong>Images:</strong>
                  <div className="d-flex gap-2 mt-1">
                    {review.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Review ${index + 1}`}
                        className="rounded"
                        style={{ width: 60, height: 60, objectFit: 'cover' }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {review.flagReasons && review.flagReasons.length > 0 && (
                <div className="mt-2">
                  <strong>Reported for:</strong>
                  <div className="mt-1">
                    {review.flagReasons.map((reason, index) => (
                      <Badge key={index} bg="warning" className="me-1">{reason}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Moderation Action:</Form.Label>
          <Form.Select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            disabled={loading}
            className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
          >
            <option value="approve">Approve Review</option>
            <option value="reject">Reject Review</option>
            <option value="remove">Remove Review</option>
          </Form.Select>
        </Form.Group>

        {(action === 'reject' || action === 'remove') && (
          <Form.Group>
            <Form.Label>Reason:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this review is being rejected/removed..."
              disabled={loading}
              className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
            />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer className={isDarkMode ? 'bg-dark border-secondary' : ''}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant={action === 'approve' ? 'success' : 'danger'} 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Remove'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ----------- EXPORT/IMPORT MODAL ----------
function ExportImportModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('export');
  const [exportType, setExportType] = useState('users');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importFile, setImportFile] = useState(null);
  const [importType, setImportType] = useState('equipment');
  const { currentUser } = useAuth();
  const { isDarkMode } = useDarkMode();

  const handleExport = async () => {
    setLoading(true);
    setProgress(0);

    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get data based on type and date range
      let queryRef = collection(db, exportType);
      
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        queryRef = query(queryRef, 
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)
        );
      } else if (dateRange === 'last30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        queryRef = query(queryRef, where('createdAt', '>=', thirtyDaysAgo));
      }

      const snapshot = await getDocs(queryRef);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
      }));

      // Convert to CSV
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
            return value;
          }).join(','))
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        // Log admin action
        await logAdminAction('data_export', {
          exportType,
          recordCount: data.length,
          dateRange
        }, currentUser?.uid);
      }

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setLoading(true);
    setProgress(0);

    try {
      const text = await importFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');
          const data = {};
          headers.forEach((header, index) => {
            data[header.trim()] = values[index]?.trim() || '';
          });
          
          // Add to Firestore (example for equipment)
          if (importType === 'equipment') {
            await addDoc(collection(db, 'equipment'), {
              ...data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              approvalStatus: 'pending',
              imported: true
            });
          }
          
          imported++;
          setProgress((i / lines.length) * 100);
        }
      }

      // Log admin action
      await logAdminAction('data_import', {
        importType,
        recordCount: imported,
        fileName: importFile.name
      }, currentUser?.uid);

      alert(`Successfully imported ${imported} records`);
      
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check file format.');
    } finally {
      setLoading(false);
      setProgress(0);
      setImportFile(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      size="lg" 
      centered
      className={isDarkMode ? 'dark-mode' : ''}
    >
      <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
        <Modal.Title>
          <Archive className="me-2" />
          Data Export & Import
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={isDarkMode ? 'bg-dark text-light' : ''}>
        <div className="d-flex mb-3">
          <Button
            variant={activeTab === 'export' ? 'primary' : 'outline-primary'}
            className="me-2"
            onClick={() => setActiveTab('export')}
          >
            <Download className="me-1" size={16} />
            Export Data
          </Button>
          <Button
            variant={activeTab === 'import' ? 'primary' : 'outline-primary'}
            onClick={() => setActiveTab('import')}
          >
            <Upload className="me-1" size={16} />
            Import Data
          </Button>
        </div>

        {activeTab === 'export' && (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>Data Type:</Form.Label>
              <Form.Select 
                value={exportType} 
                onChange={(e) => setExportType(e.target.value)}
                className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
              >
                <option value="users">Users</option>
                <option value="equipment">Equipment</option>
                <option value="rentals">Rentals</option>
                <option value="reviews">Reviews</option>
                <option value="disputes">Disputes</option>
                <option value="adminActions">Admin Actions</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date Range:</Form.Label>
              <Form.Select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
              >
                <option value="all">All Time</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </Form.Select>
            </Form.Group>

            {dateRange === 'custom' && (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Start Date:</Form.Label>
                    <Form.Control
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>End Date:</Form.Label>
                    <Form.Control
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            {loading && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small>Exporting...</small>
                  <small>{progress.toFixed(0)}%</small>
                </div>
                <ProgressBar now={progress} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>Import Type:</Form.Label>
              <Form.Select 
                value={importType} 
                onChange={(e) => setImportType(e.target.value)}
                className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
              >
                <option value="equipment">Equipment</option>
                <option value="users">Users (Bulk Registration)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>CSV File:</Form.Label>
              <Form.Control
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
              />
              <Form.Text className="text-muted">
                Upload a CSV file with the appropriate headers for {importType}.
              </Form.Text>
            </Form.Group>

            {loading && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small>Importing...</small>
                  <small>{progress.toFixed(0)}%</small>
                </div>
                <ProgressBar now={progress} />
              </div>
            )}

            <Alert variant="info">
              <strong>CSV Format Requirements:</strong>
              <ul className="mb-0 mt-2">
                <li>Equipment: name, category, description, ratePerDay, location, ownerId</li>
                <li>Users: email, displayName, role (renter/owner/admin)</li>
              </ul>
            </Alert>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className={isDarkMode ? 'bg-dark border-secondary' : ''}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {activeTab === 'export' ? (
          <Button variant="primary" onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="me-2" />
                Export {exportType}
              </>
            )}
          </Button>
        ) : (
          <Button variant="primary" onClick={handleImport} disabled={loading || !importFile}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="me-2" />
                Import Data
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

// ----------- USER PROFILE MODAL ----------
function UserProfileModal({ user, isOpen, onClose }) {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails();
    }
  }, [isOpen, user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        setUserDetails({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      setUserDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
    return new Date(timestamp).toLocaleDateString();
  };

  if (!isOpen || !user) return null;

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      size="lg" 
      centered
      className={isDarkMode ? 'dark-mode' : ''}
    >
      <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : 'bg-primary text-white'}>
        <Modal.Title>
          <Person className="me-2" />
          User Profile
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={isDarkMode ? 'bg-dark text-light' : ''}>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : userDetails ? (
          <div>
            <div className="text-center mb-4">
              <img 
                src={userDetails.photoURL || 'https://via.placeholder.com/120'} 
                alt={userDetails.displayName || 'User'}
                className="rounded-circle mb-3"
                width="120"
                height="120"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/120?text=User';
                }}
              />
              <h4>{userDetails.displayName || 'No Name'}</h4>
              <Badge bg={
                userDetails.role === 'admin' ? 'danger' :
                userDetails.role === 'owner' ? 'success' : 'primary'
              } className="fs-6">
                {userDetails.role === 'renter' ? 'Renter' : 
                 userDetails.role === 'owner' ? 'Owner' : 
                 userDetails.role === 'admin' ? 'Admin' : 'Unknown'}
              </Badge>
              {userDetails.banned && (
                <Badge bg="danger" className="ms-2">BANNED</Badge>
              )}
            </div>
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <strong className="d-flex align-items-center">
                    <Envelope className="me-2 text-primary" />
                    Email:
                  </strong>
                  <p className="mb-0 ms-4">{userDetails.email}</p>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong className="d-flex align-items-center">
                    <Calendar className="me-2 text-success" />
                    Joined:
                  </strong>
                  <p className="mb-0 ms-4">{formatDate(userDetails.createdAt)}</p>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong className="d-flex align-items-center">
                    <Shield className="me-2 text-warning" />
                    Email Verified:
                  </strong>
                  <p className="mb-0 ms-4">
                    <Badge bg={userDetails.emailVerified ? 'success' : 'warning'}>
                      {userDetails.emailVerified ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>User ID:</strong>
                  <p className="mb-0 text-muted small">{userDetails.id}</p>
                </div>
              </Col>
            </Row>
            {userDetails.phone && (
              <div className="mb-3">
                <strong>Phone:</strong>
                <p className="mb-0">{userDetails.phone}</p>
              </div>
            )}
            {userDetails.address && (
              <div className="mb-3">
                <strong>Address:</strong>
                <p className="mb-0">{userDetails.address}</p>
              </div>
            )}
            <div className={`p-3 rounded ${isDarkMode ? 'bg-secondary' : 'bg-light'}`}>
              <h6 className="mb-2">Account Status</h6>
              <div className="d-flex justify-content-between">
                <span>Status:</span>
                <Badge bg={userDetails.banned ? 'danger' : 'success'}>
                  {userDetails.banned ? 'Banned' : 'Active'}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p>User details not found</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className={isDarkMode ? 'bg-dark border-secondary' : ''}>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ----------- EDIT ROLE MODAL ----------
function EditRoleModal({ user, isOpen, onClose, onRoleUpdate }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen && user) {
      setSelectedRole(user.role || 'renter');
      setError('');
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!selectedRole || selectedRole === user.role) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateDoc(doc(db, 'users', user.id), {
        role: selectedRole,
        updatedAt: serverTimestamp()
      });

      // Log admin action
      await logAdminAction('role_change', {
        targetUserId: user.id,
        targetUserEmail: user.email,
        oldRole: user.role,
        newRole: selectedRole
      }, currentUser?.uid);

      onRoleUpdate(user.id, selectedRole);
      onClose();
    } catch (error) {
      setError('Failed to update user role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      centered
      className={isDarkMode ? 'dark-mode' : ''}
    >
      <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
        <Modal.Title>
          <PencilSquare className="me-2" />
          Edit User Role
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={isDarkMode ? 'bg-dark text-light' : ''}>
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}
        <div className="mb-3">
          <p><strong>User:</strong> {user.displayName || user.email}</p>
          <p><strong>Current Role:</strong> 
            <Badge bg={
              user.role === 'admin' ? 'danger' :
              user.role === 'owner' ? 'success' : 'primary'
            } className="ms-2">
              {user.role === 'renter' ? 'Renter' : 
               user.role === 'owner' ? 'Owner' : 
               user.role === 'admin' ? 'Admin' : 'Unknown'}
            </Badge>
          </p>
        </div>
        <Form.Group>
          <Form.Label>New Role:</Form.Label>
          <Form.Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={loading}
            className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
          >
            <option value="renter">Renter</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className={isDarkMode ? 'bg-dark border-secondary' : ''}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={loading || selectedRole === user.role}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Updating...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ----------- BAN USER MODAL ----------
function BanUserModal({ user, isOpen, onClose, onUserUpdate }) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('permanent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDuration('permanent');
      setError('');
    }
  }, [isOpen]);

  const handleBan = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for the ban.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const banData = {
        banned: true,
        banReason: reason,
        banDuration: duration,
        bannedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (duration !== 'permanent') {
        const days = parseInt(duration);
        const banExpiry = new Date();
        banExpiry.setDate(banExpiry.getDate() + days);
        banData.banExpiry = Timestamp.fromDate(banExpiry);
      }

      await updateDoc(doc(db, 'users', user.id), banData);

      // Log admin action
      await logAdminAction('user_ban', {
        targetUserId: user.id,
        targetUserEmail: user.email,
        reason: reason,
        duration: duration
      }, currentUser?.uid);

      onUserUpdate(user.id, { ...user, banned: true, banReason: reason });
      onClose();
    } catch (error) {
      setError('Failed to ban user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      centered
      className={isDarkMode ? 'dark-mode' : ''}
    >
      <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
        <Modal.Title className="text-danger">
          <Ban className="me-2" />
          Ban User
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={isDarkMode ? 'bg-dark text-light' : ''}>
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}
        <Alert variant="warning">
          <strong>Warning:</strong> This action will prevent the user from accessing the platform.
        </Alert>
        <div className="mb-3">
          <p><strong>User:</strong> {user.displayName || user.email}</p>
        </div>
        <Form.Group className="mb-3">
          <Form.Label>Reason for Ban:</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this user is being banned..."
            disabled={loading}
            className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Ban Duration:</Form.Label>
          <Form.Select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={loading}
            className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="permanent">Permanent</option>
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className={isDarkMode ? 'bg-dark border-secondary' : ''}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleBan} disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Banning...
            </>
          ) : (
            'Ban User'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ----------- EQUIPMENT APPROVAL MODAL ----------
function EquipmentApprovalModal({ equipment, isOpen, onClose, onEquipmentUpdate }) {
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen) {
      setAction('approve');
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (action === 'reject' && !reason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData = {
        approvalStatus: action === 'approve' ? 'approved' : 'rejected',
        approvedAt: action === 'approve' ? serverTimestamp() : null,
        rejectedAt: action === 'reject' ? serverTimestamp() : null,
        rejectionReason: action === 'reject' ? reason : null,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'equipment', equipment.id), updateData);

      // Log admin action
      await logAdminAction(`equipment_${action}`, {
        targetEquipmentId: equipment.id,
        targetEquipmentName: equipment.name,
        reason: reason || null
      }, currentUser?.uid);

      // Create notification for equipment owner
      await addDoc(collection(db, 'notifications'), {
        userId: equipment.ownerId,
        title: `Equipment ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your equipment "${equipment.name}" has been ${action}ed${action === 'reject' ? `: ${reason}` : ''}`,
        type: action === 'approve' ? 'success' : 'warning',
        timestamp: serverTimestamp(),
        read: false
      });

      onEquipmentUpdate(equipment.id, { ...equipment, approvalStatus: updateData.approvalStatus });
      onClose();
    } catch (error) {
      setError(`Failed to ${action} equipment. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !equipment) return null;

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      size="lg" 
      centered
      className={isDarkMode ? 'dark-mode' : ''}
    >
      <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
        <Modal.Title>
          <Tools className="me-2" />
          Review Equipment
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={isDarkMode ? 'bg-dark text-light' : ''}>
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}
        <Row>
          <Col md={6}>
            <img 
              src={equipment.imageUrl || 'https://via.placeholder.com/300x200'} 
              alt={equipment.name}
              className="img-fluid rounded"
              style={{ maxHeight: '200px', objectFit: 'cover' }}
            />
          </Col>
          <Col md={6}>
            <h5>{equipment.name}</h5>
            <p><strong>Category:</strong> {equipment.category}</p>
            <p><strong>Owner:</strong> {equipment.ownerName}</p>
            <p><strong>Rate:</strong> ${equipment.ratePerDay}/day</p>
            <p><strong>Location:</strong> {equipment.location}</p>
            <p><strong>Description:</strong> {equipment.description}</p>
          </Col>
        </Row>
        
        <hr />
        
        <Form.Group className="mb-3">
          <Form.Label>Action:</Form.Label>
          <Form.Select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            disabled={loading}
            className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
          >
            <option value="approve">Approve Equipment</option>
            <option value="reject">Reject Equipment</option>
          </Form.Select>
        </Form.Group>

        {action === 'reject' && (
          <Form.Group>
            <Form.Label>Reason for Rejection:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this equipment is being rejected..."
              disabled={loading}
              className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
            />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer className={isDarkMode ? 'bg-dark border-secondary' : ''}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant={action === 'approve' ? 'success' : 'danger'} 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            action === 'approve' ? 'Approve' : 'Reject'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ----------- SETTINGS MODAL ----------
function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    allowUserRegistration: true,
    requireEmailVerification: true,
    equipmentApprovalRequired: true,
    maxEquipmentPerUser: 10,
    defaultRentalDuration: 7,
    platformFeePercentage: 5,
    autoApproveVerifiedUsers: false,
    maintenanceMode: false,
    supportEmail: '',
    maxFileUploadSize: 5
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));
      if (settingsDoc.exists()) {
        setSettings({ ...settings, ...settingsDoc.data() });
      }
    } catch (error) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await updateDoc(doc(db, 'settings', 'platform'), {
        ...settings,
        updatedAt: serverTimestamp()
      });

      // Log admin action
      await logAdminAction('settings_update', {}, currentUser?.uid);

      onClose();
    } catch (error) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      size="lg" 
      centered
      className={isDarkMode ? 'dark-mode' : ''}
    >
      <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
        <Modal.Title>
          <Gear className="me-2" />
          Platform Settings
        </Modal.Title>
      </Modal.Header>
      <Modal.Body 
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
        className={isDarkMode ? 'bg-dark text-light' : ''}
      >
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}
        
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <Form>
            <h6 className="text-primary mb-3">General Settings</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Site Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    placeholder="RentMate"
                    className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Support Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    placeholder="support@rentmate.com"
                    className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Site Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                placeholder="Equipment rental platform"
                className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
              />
            </Form.Group>

            <h6 className="text-primary mb-3 mt-4">User Management</h6>
            <Row>
              <Col md={6}>
                <Form.Check
                  type="switch"
                  label="Allow User Registration"
                  checked={settings.allowUserRegistration}
                  onChange={(e) => setSettings({ ...settings, allowUserRegistration: e.target.checked })}
                  className="mb-3"
                />
                <Form.Check
                  type="switch"
                  label="Require Email Verification"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                  className="mb-3"
                />
              </Col>
              <Col md={6}>
                <Form.Check
                  type="switch"
                  label="Auto-approve Verified Users"
                  checked={settings.autoApproveVerifiedUsers}
                  onChange={(e) => setSettings({ ...settings, autoApproveVerifiedUsers: e.target.checked })}
                  className="mb-3"
                />
                <Form.Check
                  type="switch"
                  label="Maintenance Mode"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="mb-3"
                />
              </Col>
            </Row>

            <h6 className="text-primary mb-3 mt-4">Equipment Settings</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Equipment per User</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxEquipmentPerUser}
                    onChange={(e) => setSettings({ ...settings, maxEquipmentPerUser: parseInt(e.target.value) })}
                    className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
                  />
                </Form.Group>
                <Form.Check
                  type="switch"
                  label="Require Equipment Approval"
                  checked={settings.equipmentApprovalRequired}
                  onChange={(e) => setSettings({ ...settings, equipmentApprovalRequired: e.target.checked })}
                  className="mb-3"
                />
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max File Upload Size (MB)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxFileUploadSize}
                    onChange={(e) => setSettings({ ...settings, maxFileUploadSize: parseInt(e.target.value) })}
                    className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Default Rental Duration (days)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={settings.defaultRentalDuration}
                    onChange={(e) => setSettings({ ...settings, defaultRentalDuration: parseInt(e.target.value) })}
                    className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="text-primary mb-3 mt-4">Financial Settings</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Platform Fee Percentage (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={settings.platformFeePercentage}
                    onChange={(e) => setSettings({ ...settings, platformFeePercentage: parseFloat(e.target.value) })}
                    className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer className={isDarkMode ? 'bg-dark border-secondary' : ''}>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="me-2" />
              Save Settings
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ----------- MAIN ADMIN DASHBOARD COMPONENT ----------
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [metrics, setMetrics] = useState({
    totalEquipment: 0,
    availableEquipment: 0,
    rentedEquipment: 0,
    pendingApproval: 0,
    totalUsers: 0,
    activeRenters: 0,
    equipmentOwners: 0,
    bannedUsers: 0,
    totalRentals: 0,
    activeRentals: 0,
    completedRentals: 0,
    totalDisputes: 0,
    activeDisputes: 0,
    flaggedReviews: 0,
    loading: true
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allRentals, setAllRentals] = useState([]);
  const [allDisputes, setAllDisputes] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();

  // Modal states
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [showBanUser, setShowBanUser] = useState(false);
  const [showEquipmentApproval, setShowEquipmentApproval] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDisputeResolution, setShowDisputeResolution] = useState(false);
  const [showReviewModeration, setShowReviewModeration] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    const unsubs = [];
    const fetchData = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true }));

        // Equipment
        const equipment = await equipmentService.getAllEquipment();
        setAllEquipment(equipment);

        const totalEquipment = equipment.length;
        const availableEquipment = equipment.filter(item => item.available && item.approvalStatus === 'approved').length;
        const rentedEquipment = equipment.filter(item => !item.available).length;
        const pendingApproval = equipment.filter(item => item.approvalStatus === 'pending').length;

        // Users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllUsers(users);

        const totalUsers = users.length;
        const activeRenters = users.filter(user => user.role === 'renter' && !user.banned).length;
        const equipmentOwners = users.filter(user => user.role === 'owner' && !user.banned).length;
        const bannedUsers = users.filter(user => user.banned).length;

        // Rentals
        let totalRentals = 0;
        let activeRentals = 0;
        let completedRentals = 0;
        try {
          const rentalsSnapshot = await getDocs(collection(db, 'rentals'));
          const rentals = rentalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllRentals(rentals);
          
          totalRentals = rentals.length;
          activeRentals = rentals.filter(rental => rental.status === 'active').length;
          completedRentals = rentals.filter(rental => rental.status === 'completed').length;
        } catch (error) { }

        // Disputes
        let totalDisputes = 0;
        let activeDisputes = 0;
        try {
          const disputesSnapshot = await getDocs(collection(db, 'disputes'));
          const disputes = disputesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllDisputes(disputes);
          
          totalDisputes = disputes.length;
          activeDisputes = disputes.filter(dispute => dispute.status === 'open' || dispute.status === 'investigating').length;
        } catch (error) { }

        // Reviews
        let flaggedReviews = 0;
        try {
          const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
          const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllReviews(reviews);
          
          flaggedReviews = reviews.filter(review => 
            review.flagged === true || 
            (review.flaggedCount && review.flaggedCount > 0) ||
            review.moderationStatus === 'pending'
          ).length;
        } catch (error) { }

        setMetrics({
          totalEquipment,
          availableEquipment,
          rentedEquipment,
          pendingApproval,
          totalUsers,
          activeRenters,
          equipmentOwners,
          bannedUsers,
          totalRentals,
          activeRentals,
          completedRentals,
          totalDisputes,
          activeDisputes,
          flaggedReviews,
          loading: false
        });
      } catch (err) {
        setError('Failed to load dashboard data');
        setMetrics(prev => ({ ...prev, loading: false }));
      }
    };

    // Chart data for last 6 months
    const fetchChartData = async () => {
      const months = getLastNMonths(6);
      const promises = months.map(async (m) => {
        const eqQuery = query(
          collection(db, "equipment"),
          where("createdAt", ">=", m.start),
          where("createdAt", "<=", m.end)
        );
        const eqSnap = await getDocs(eqQuery);

        const rentalQuery = query(
          collection(db, "rentals"),
          where("createdAt", ">=", m.start),
          where("createdAt", "<=", m.end)
        );
        const rentalSnap = await getDocs(rentalQuery);

        return {
          month: m.label,
          equipment: eqSnap.size,
          rentals: rentalSnap.size,
        };
      });
      setChartData(await Promise.all(promises));
    };

    fetchData();
    fetchChartData();

    // Real-time listeners
    try {
      const activityQuery = query(
        collection(db, 'activity'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const activityUnsub = onSnapshot(activityQuery, (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setRecentActivity(activities);
      }, (error) => setRecentActivity([]));
      unsubs.push(activityUnsub);

      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipients', 'array-contains', 'admin'),
        orderBy('timestamp', 'desc'),
        limit(3)
      );
      const notificationsUnsub = onSnapshot(notificationsQuery, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setNotifications(notifs);
      }, (error) => setNotifications([]));
      unsubs.push(notificationsUnsub);

    } catch (err) {}

    return () => unsubs.forEach(unsub => unsub && unsub());
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Logout failed. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const now = new Date();
    const diff = now - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'new_equipment': return <Tools className="me-2 text-success" />;
      case 'rental': return <FileEarmark className="me-2 text-primary" />;
      case 'new_user': return <Person className="me-2 text-info" />;
      case 'maintenance': return <Gear className="me-2 text-warning" />;
      default: return <CheckCircle className="me-2 text-secondary" />;
    }
  };

  const getRentalStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <Badge bg="warning">Pending</Badge>;
      case 'active': return <Badge bg="success">Active</Badge>;
      case 'completed': return <Badge bg="primary">Completed</Badge>;
      case 'cancelled': return <Badge bg="danger">Cancelled</Badge>;
      case 'disputed': return <Badge bg="dark">Disputed</Badge>;
      default: return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const getDisputeStatusBadge = (status) => {
    switch(status) {
      case 'open': return <Badge bg="danger">Open</Badge>;
      case 'investigating': return <Badge bg="warning">Investigating</Badge>;
      case 'resolved': return <Badge bg="success">Resolved</Badge>;
      case 'closed': return <Badge bg="secondary">Closed</Badge>;
      default: return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const toggleNotifications = () => setShowNotifications(!showNotifications);

  // Sidebar navigation items - Updated with new tabs
  const navItems = [
    { label: 'Dashboard', icon: <HouseDoor /> },
    { label: 'Equipment', icon: <Tools /> },
    { label: 'Users', icon: <People /> },
    { label: 'Rentals', icon: <FileEarmark /> },
    { label: 'Dispute Center', icon: <Flag /> },
    { label: 'Review Moderation', icon: <StarFill /> },
    { label: 'Analytics', icon: <GraphUp /> },
    { label: 'Settings', icon: <Gear /> }
  ];

  const filteredEquipment = allEquipment.filter(
    item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredUsers = allUsers.filter(
    user => (user.displayName || user.email)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRentals = allRentals.filter(
    rental => rental.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              rental.renterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              rental.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDisputes = allDisputes.filter(
    dispute => dispute.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               dispute.reporterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               dispute.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = allReviews.filter(
    review => review.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              review.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              review.comment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Modal handlers with tooltips
  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };
  
  const handleEditRole = (user) => {
    setSelectedUser(user);
    setShowEditRole(true);
  };
  
  const handleBanUser = (user) => {
    setSelectedUser(user);
    setShowBanUser(true);
  };

  const handleApproveEquipment = (equipment) => {
    setSelectedEquipment(equipment);
    setShowEquipmentApproval(true);
  };

  const handleResolveDispute = (dispute) => {
    setSelectedDispute(dispute);
    setShowDisputeResolution(true);
  };

  const handleModerateReview = (review) => {
    setSelectedReview(review);
    setShowReviewModeration(true);
  };

  const handleRoleUpdate = (userId, newRole) => {
    setAllUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  const handleUserUpdate = (userId, updatedUser) => {
    setAllUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? updatedUser : user
      )
    );
  };

  const handleEquipmentUpdate = (equipmentId, updatedEquipment) => {
    setAllEquipment(prevEquipment => 
      prevEquipment.map(equipment => 
        equipment.id === equipmentId ? updatedEquipment : equipment
      )
    );
  };

  const handleDisputeUpdate = (disputeId, updatedDispute) => {
    setAllDisputes(prevDisputes => 
      prevDisputes.map(dispute => 
        dispute.id === disputeId ? updatedDispute : dispute
      )
    );
  };

  const handleReviewUpdate = (reviewId, updatedReview) => {
    setAllReviews(prevReviews => 
      prevReviews.map(review => 
        review.id === reviewId ? updatedReview : review
      )
    );
  };

  const handleRemoveEquipment = async (equipmentId) => {
    if (window.confirm('Are you sure you want to remove this equipment? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'equipment', equipmentId));
        setAllEquipment(prevEquipment => 
          prevEquipment.filter(equipment => equipment.id !== equipmentId)
        );
        
        // Log admin action
        await logAdminAction('equipment_removal', {
          targetEquipmentId: equipmentId
        }, currentUser?.uid);
      } catch (error) {
        setError('Failed to remove equipment');
      }
    }
  };

  return (
    <>
      {/* All Modals */}
      <UserProfileModal
        user={selectedUser}
        isOpen={showUserProfile}
        onClose={() => {
          setShowUserProfile(false);
          setSelectedUser(null);
        }}
      />

      <EditRoleModal
        user={selectedUser}
        isOpen={showEditRole}
        onClose={() => {
          setShowEditRole(false);
          setSelectedUser(null);
        }}
        onRoleUpdate={handleRoleUpdate}
      />

      <BanUserModal
        user={selectedUser}
        isOpen={showBanUser}
        onClose={() => {
          setShowBanUser(false);
          setSelectedUser(null);
        }}
        onUserUpdate={handleUserUpdate}
      />

      <EquipmentApprovalModal
        equipment={selectedEquipment}
        isOpen={showEquipmentApproval}
        onClose={() => {
          setShowEquipmentApproval(false);
          setSelectedEquipment(null);
        }}
        onEquipmentUpdate={handleEquipmentUpdate}
      />

      <DisputeResolutionModal
        dispute={selectedDispute}
        isOpen={showDisputeResolution}
        onClose={() => {
          setShowDisputeResolution(false);
          setSelectedDispute(null);
        }}
        onDisputeUpdate={handleDisputeUpdate}
      />

      <ReviewModerationModal
        review={selectedReview}
        isOpen={showReviewModeration}
        onClose={() => {
          setShowReviewModeration(false);
          setSelectedReview(null);
        }}
        onReviewUpdate={handleReviewUpdate}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <ExportImportModal
        isOpen={showExportImport}
        onClose={() => setShowExportImport(false)}
      />

      <div className={`dashboard-container d-flex ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Sidebar */}
      <div className={`sidebar ${isDarkMode ? 'bg-dark' : 'bg-dark'} text-white`}>
        <div className="d-flex align-items-center p-3 mb-3">
          <Building size={24} className="text-primary me-2" />
          <h4 className="m-0">RentMate Admin</h4>
        </div>
        <ul className="nav flex-column">
          {navItems.map((item, index) => (
            <li key={index} className="nav-item">
              <TooltipWrapper 
                tooltip={`Navigate to ${item.label}`}
                placement="right"
              >
                <button
                  className={`nav-link d-flex align-items-center enhanced-hover ${activeTab === item.label ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.label)}
                >
                  <span className="icon me-3">{item.icon}</span>
                  {item.label}
                  {item.label === 'Equipment' && metrics.pendingApproval > 0 && (
                    <Badge bg="warning" className="ms-auto">{metrics.pendingApproval}</Badge>
                  )}
                  {item.label === 'Dispute Center' && metrics.activeDisputes > 0 && (
                    <Badge bg="danger" className="ms-auto">{metrics.activeDisputes}</Badge>
                  )}
                  {item.label === 'Review Moderation' && metrics.flaggedReviews > 0 && (
                    <Badge bg="warning" className="ms-auto">{metrics.flaggedReviews}</Badge>
                  )}
                </button>
              </TooltipWrapper>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content flex-grow-1">
        {/* Header */}
        <header className={`dashboard-header d-flex justify-content-between align-items-center p-3 shadow-sm ${isDarkMode ? 'bg-dark text-light border-bottom border-secondary' : 'bg-white'}`}>
          <h4>{activeTab}</h4>
          <div className="d-flex align-items-center">
            {(activeTab === 'Equipment' || activeTab === 'Users' || activeTab === 'Rentals' || activeTab === 'Dispute Center' || activeTab === 'Review Moderation') && (
              <InputGroup className="me-3" style={{ maxWidth: 220 }}>
                <Form.Control
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}
                />
                <TooltipWrapper tooltip="Search items">
                  <Button variant={isDarkMode ? "outline-light" : "outline-secondary"}>
                    <Search />
                  </Button>
                </TooltipWrapper>
              </InputGroup>
            )}
            <div className="position-relative me-3">
              <TooltipWrapper tooltip="View notifications">
                <Button 
                  variant="link" 
                  className={`position-relative enhanced-hover ${isDarkMode ? 'text-light' : ''}`}
                  onClick={toggleNotifications}
                >
                  <Bell size={20} />
                  <Badge 
                    bg="danger" 
                    className="position-absolute top-0 start-100 translate-middle rounded-pill"
                  >
                    {notifications.length}
                  </Badge>
                </Button>
              </TooltipWrapper>
              {/* Notifications Panel */}
              {showNotifications && (
                <div className={`notifications-panel ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                  <div className={`d-flex justify-content-between align-items-center p-3 ${isDarkMode ? 'border-bottom border-secondary' : 'border-bottom'}`}>
                    <h5 className="m-0">
                      <Bell className="me-2" /> Notifications
                    </h5>
                    <Button 
                      variant="link" 
                      className={`p-0 ${isDarkMode ? 'text-light' : 'text-secondary'}`}
                      onClick={toggleNotifications}
                    >
                      &times;
                    </Button>
                  </div>
                  <div className="notifications-body">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`notification-item p-3 enhanced-hover ${isDarkMode ? 'border-bottom border-secondary' : 'border-bottom'}`}>
                        <div className="d-flex align-items-center">
                          {notif.severity === 'critical' ? <Flag className="text-danger me-2" /> : <Bell className="me-2 text-primary" />}
                          <div>
                            <div>
                              <strong>{notif.title || "Notification"}</strong>
                              <span className="ms-2 text-muted">{notif.senderName || ""}</span>
                            </div>
                            <p className="mb-1">{notif.message}</p>
                            <small className="text-muted">{formatTimestamp(notif.timestamp)}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="p-2 text-center">
                      <Button variant="link">View all</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Dropdown>
              <TooltipWrapper tooltip="User menu">
                <Dropdown.Toggle variant="link" className="p-0">
                  <img 
                    src={currentUser?.photoURL || "/assets/default-avatar.png"} 
                    alt="Profile" 
                    className="avatar rounded-circle enhanced-hover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/32";
                    }}
                    style={{ width: 32, height: 32 }}
                  />
                </Dropdown.Toggle>
              </TooltipWrapper>
              <Dropdown.Menu align="end" className={isDarkMode ? 'bg-dark border-secondary' : ''}>
                <Dropdown.Item 
                  onClick={() => navigate('/profile')}
                  className={isDarkMode ? 'text-light dropdown-item-dark' : ''}
                >
                  <Person className="me-2" /> Profile
                </Dropdown.Item>
                <Dropdown.Item 
                  onClick={() => setShowSettings(true)}
                  className={isDarkMode ? 'text-light dropdown-item-dark' : ''}
                >
                  <Gear className="me-2" /> Settings
                </Dropdown.Item>
                <Dropdown.Item 
                  onClick={toggleDarkMode}
                  className={isDarkMode ? 'text-light dropdown-item-dark' : ''}
                >
                  {isDarkMode ? <Sun className="me-2" /> : <Moon className="me-2" />} 
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Dropdown.Item>
                <Dropdown.Divider className={isDarkMode ? 'border-secondary' : ''} />
                <Dropdown.Item 
                  onClick={handleLogout}
                  className={isDarkMode ? 'text-light dropdown-item-dark' : ''}
                >
                  <BoxArrowRight className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <div className={`dashboard-body p-4 ${isDarkMode ? 'bg-dark text-light' : ''}`}>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* --------- DASHBOARD TAB --------- */}
          {activeTab === 'Dashboard' && (
            <>
              {/* Enhanced Stats Cards */}
              <Row className="mb-4">
                <Col md={6} lg={3} className="mb-3">
                  <Card className={`stats-card h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="p-3 bg-primary bg-opacity-10 rounded-3 me-3">
                          <Tools className="text-primary fs-4" />
                        </div>
                        <div>
                          <h2 className="mb-1">{metrics.loading ? '...' : metrics.totalEquipment}</h2>
                          <p className="text-muted mb-0 small">Total Equipment</p>
                          {metrics.pendingApproval > 0 && (
                            <Badge bg="warning" className="mt-1">{metrics.pendingApproval} Pending</Badge>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <Card className={`stats-card h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="p-3 bg-warning bg-opacity-10 rounded-3 me-3">
                          <People className="text-warning fs-4" />
                        </div>
                        <div>
                          <h2 className="mb-1">{metrics.loading ? '...' : metrics.totalUsers}</h2>
                          <p className="text-muted mb-0 small">Total Users</p>
                          {metrics.bannedUsers > 0 && (
                            <Badge bg="danger" className="mt-1">{metrics.bannedUsers} Banned</Badge>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <Card className={`stats-card h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="p-3 bg-info bg-opacity-10 rounded-3 me-3">
                          <FileEarmark className="text-info fs-4" />
                        </div>
                        <div>
                          <h2 className="mb-1">{metrics.loading ? '...' : metrics.totalRentals}</h2>
                          <p className="text-muted mb-0 small">Total Rentals</p>
                          <Badge bg="success" className="mt-1 me-1">{metrics.activeRentals} Active</Badge>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <Card className={`stats-card h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="p-3 bg-success bg-opacity-10 rounded-3 me-3">
                          <CheckCircle className="text-success fs-4" />
                        </div>
                        <div>
                          <h2 className="mb-1">{metrics.loading ? '...' : metrics.availableEquipment}</h2>
                          <p className="text-muted mb-0 small">Available Equipment</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* New Stats for Disputes and Reviews */}
              <Row className="mb-4">
                <Col md={6} lg={3} className="mb-3">
                  <Card className={`stats-card h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="p-3 bg-danger bg-opacity-10 rounded-3 me-3">
                          <Flag className="text-danger fs-4" />
                        </div>
                        <div>
                          <h2 className="mb-1">{metrics.loading ? '...' : metrics.totalDisputes}</h2>
                          <p className="text-muted mb-0 small">Total Disputes</p>
                          {metrics.activeDisputes > 0 && (
                            <Badge bg="danger" className="mt-1">{metrics.activeDisputes} Active</Badge>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                  <Card className={`stats-card h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="p-3 bg-warning bg-opacity-10 rounded-3 me-3">
                          <StarFill className="text-warning fs-4" />
                        </div>
                        <div>
                          <h2 className="mb-1">{metrics.loading ? '...' : metrics.flaggedReviews}</h2>
                          <p className="text-muted mb-0 small">Flagged Reviews</p>
                          {metrics.flaggedReviews > 0 && (
                            <Badge bg="warning" className="mt-1">Needs Moderation</Badge>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Platform Overview */}
              <Row className="mb-4">
                <Col md={8}>
                  <Card className={isDarkMode ? 'bg-dark border-secondary text-light' : ''}>
                    <Card.Header className={isDarkMode ? 'bg-dark border-secondary' : 'bg-white'}>
                      <h5 className="mb-0">Platform Analytics</h5>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid stroke={isDarkMode ? "#4a5568" : "#eee"} strokeDasharray="5 5" />
                          <XAxis dataKey="month" stroke={isDarkMode ? "#e2e8f0" : "#333"} />
                          <YAxis stroke={isDarkMode ? "#e2e8f0" : "#333"} />
                          <RechartsTooltip 
                            contentStyle={{
                              backgroundColor: isDarkMode ? '#2d3748' : '#fff',
                              border: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                              color: isDarkMode ? '#e2e8f0' : '#333'
                            }}
                          />
                          <Line type="monotone" dataKey="equipment" stroke="#3b82f6" name="Equipment" />
                          <Line type="monotone" dataKey="rentals" stroke="#10b981" name="Rentals" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className={`h-100 ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                    <Card.Header className={isDarkMode ? 'bg-dark border-secondary' : 'bg-white'}>
                      <h5 className="mb-0">User Distribution</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Equipment Renters</span>
                        <span className="fw-bold">{metrics.activeRenters}</span>
                      </div>
                      <div className="progress mb-3">
                        <div 
                          className="progress-bar bg-primary" 
                          style={{ 
                            width: `${metrics.totalUsers > 0 ? 
                              (metrics.activeRenters / metrics.totalUsers) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Equipment Owners</span>
                        <span className="fw-bold">{metrics.equipmentOwners}</span>
                      </div>
                      <div className="progress mb-3">
                        <div 
                          className="progress-bar bg-success" 
                          style={{ 
                            width: `${metrics.totalUsers > 0 ? 
                              (metrics.equipmentOwners / metrics.totalUsers) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Admins</span>
                        <span className="fw-bold">
                          {metrics.totalUsers - metrics.activeRenters - metrics.equipmentOwners}
                        </span>
                      </div>
                      <div className="progress">
                        <div 
                          className="progress-bar bg-warning" 
                          style={{ 
                            width: `${metrics.totalUsers > 0 ? 
                              ((metrics.totalUsers - metrics.activeRenters - metrics.equipmentOwners) / metrics.totalUsers) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Recent Activity */}
              <Row className="mb-4">
                <Col md={12}>
                  <Card className={isDarkMode ? 'bg-dark border-secondary text-light' : ''}>
                    <Card.Header className={isDarkMode ? 'bg-dark border-secondary' : 'bg-white'}>
                      <h5 className="mb-0">Recent Activity</h5>
                    </Card.Header>
                    <Card.Body>
                      {recentActivity.length > 0 ? (
                        <ul className="activity-list list-unstyled">
                          {recentActivity.map(activity => (
                            <li key={activity.id} className="d-flex align-items-center mb-3 enhanced-hover">
                              {getActivityIcon(activity.type)}
                              <div>
                                <div>
                                  <strong>{activity.userName || "User"}</strong> {activity.description}
                                  {activity.equipmentName && (
                                    <> <span className="text-info">({activity.equipmentName})</span></>
                                  )}
                                </div>
                                <small className="text-muted">{formatTimestamp(activity.timestamp)}</small>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-center text-muted">No recent activity</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* --------- EQUIPMENT TAB --------- */}
          {activeTab === 'Equipment' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>All Equipment ({allEquipment.length})</h5>
                <div className="d-flex gap-2">
                  <Badge bg="success">{metrics.availableEquipment} Available</Badge>
                  <Badge bg="danger">{metrics.rentedEquipment} Rented</Badge>
                  <Badge bg="warning">{metrics.pendingApproval} Pending Approval</Badge>
                </div>
              </div>
              
              {metrics.loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <Row>
                  {filteredEquipment.length > 0 ? (
                    filteredEquipment.map(equipment => (
                      <Col key={equipment.id} md={6} lg={4} className="mb-4">
                        <Card className={`h-100 enhanced-hover ${isDarkMode ? 'bg-dark border-secondary text-light' : ''}`}>
                          <div style={{ height: '200px', overflow: 'hidden' }}>
                            <Card.Img 
                              variant="top" 
                              src={equipment.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} 
                              style={{ height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                              }}
                            />
                          </div>
                          <Card.Body className="d-flex flex-column">
                            <div className="flex-grow-1">
                              <Card.Title className="h6">{equipment.name}</Card.Title>
                              <div className="mb-2">
                                <Badge bg="primary" className="me-2">{equipment.category}</Badge>
                                <Badge bg={equipment.available ? "success" : "danger"} className="me-2">
                                  {equipment.available ? "Available" : "Rented"}
                                </Badge>
                                {equipment.approvalStatus === 'pending' && (
                                  <Badge bg="warning">Pending Approval</Badge>
                                )}
                                {equipment.approvalStatus === 'rejected' && (
                                  <Badge bg="danger">Rejected</Badge>
                                )}
                              </div>
                              <Card.Text className="small text-muted">
                                Owner: {equipment.ownerName}
                              </Card.Text>
                              <Card.Text className="small text-muted">
                                Location: {equipment.location}
                              </Card.Text>
                            </div>
                            <div className="mt-auto">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-bold text-success">${equipment.ratePerDay}/day</span>
                              </div>
                              <div className="d-flex gap-1">
                                <TooltipWrapper tooltip="View details">
                                  <Button variant="outline-primary" size="sm" className="enhanced-hover">
                                    <Eye className="me-1" size={12} />
                                    View
                                  </Button>
                                </TooltipWrapper>
                                {equipment.approvalStatus === 'pending' && (
                                  <TooltipWrapper tooltip="Review equipment">
                                    <Button 
                                      variant="outline-warning" 
                                      size="sm"
                                      className="enhanced-hover"
                                      onClick={() => handleApproveEquipment(equipment)}
                                    >
                                      <Check className="me-1" size={12} />
                                      Review
                                    </Button>
                                  </TooltipWrapper>
                                )}
                                <TooltipWrapper tooltip="Remove equipment">
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    className="enhanced-hover"
                                    onClick={() => handleRemoveEquipment(equipment.id)}
                                  >
                                    <Trash className="me-1" size={12} />
                                    Remove
                                  </Button>
                                </TooltipWrapper>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <Col>
                      <div className="text-center py-5">
                        <Tools className="display-1 text-muted" />
                        <h5 className="mt-3">No equipment found</h5>
                        <p className="text-muted">
                          {searchQuery ? 'Try adjusting your search terms.' : 'No equipment has been added to the platform yet.'}
                        </p>
                      </div>
                    </Col>
                  )}
                </Row>
              )}
            </>
          )}

          {/* --------- USERS TAB --------- */}
          {activeTab === 'Users' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>All Users ({allUsers.length})</h5>
                <div className="d-flex gap-2">
                  <Badge bg="primary">{metrics.activeRenters} Renters</Badge>
                  <Badge bg="success">{metrics.equipmentOwners} Owners</Badge>
                  <Badge bg="warning">{metrics.totalUsers - metrics.activeRenters - metrics.equipmentOwners} Admins</Badge>
                  {metrics.bannedUsers > 0 && (
                    <Badge bg="danger">{metrics.bannedUsers} Banned</Badge>
                  )}
                </div>
              </div>
              
              {metrics.loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <Card className={isDarkMode ? 'bg-dark border-secondary' : ''}>
                  <div className="table-responsive">
                    <Table hover className={`mb-0 ${isDarkMode ? 'table-dark' : ''}`}>
                      <thead className={isDarkMode ? 'table-dark' : 'table-light'}>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map(user => (
                            <tr key={user.id} className="enhanced-hover">
                              <td>
                                <div className="d-flex align-items-center">
                                  <img 
                                    src={user.photoURL || 'https://via.placeholder.com/40'} 
                                    alt={user.displayName || 'User'}
                                    className="rounded-circle me-2"
                                    width="40"
                                    height="40"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/40';
                                    }}
                                  />
                                  <div>
                                    <div className="fw-semibold">
                                      {user.displayName || 'No Name'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>{user.email}</td>
                              <td>
                                <Badge bg={
                                  user.role === 'admin' ? 'danger' :
                                  user.role === 'owner' ? 'success' : 'primary'
                                }>
                                  {user.role === 'renter' ? 'Renter' : 
                                   user.role === 'owner' ? 'Owner' : 
                                   user.role === 'admin' ? 'Admin' : 'Unknown'}
                                </Badge>
                              </td>
                              <td>
                                {user.banned ? (
                                  <Badge bg="danger">Banned</Badge>
                                ) : (
                                  <Badge bg="success">Active</Badge>
                                )}
                              </td>
                              <td>
                                {user.createdAt ? 
                                  new Date(user.createdAt.toDate()).toLocaleDateString() : 
                                  'Unknown'
                                }
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <TooltipWrapper tooltip="View profile">
                                    <Button variant="outline-primary" size="sm" onClick={() => handleViewProfile(user)} className="enhanced-hover">
                                      <Eye className="me-1" size={12} />
                                      View
                                    </Button>
                                  </TooltipWrapper>
                                  <TooltipWrapper tooltip="Edit user role">
                                    <Button variant="outline-secondary" size="sm" onClick={() => handleEditRole(user)} className="enhanced-hover">
                                      <PencilSquare className="me-1" size={12} />
                                      Edit Role
                                    </Button>
                                  </TooltipWrapper>
                                  {!user.banned && (
                                    <TooltipWrapper tooltip="Ban user">
                                      <Button variant="outline-danger" size="sm" onClick={() => handleBanUser(user)} className="enhanced-hover">
                                        <Ban className="me-1" size={12} />
                                        Ban
                                      </Button>
                                    </TooltipWrapper>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-4">
                              <People className="display-4 text-muted" />
                              <div className="mt-2">No users found</div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* --------- RENTALS TAB --------- */}
          {activeTab === 'Rentals' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>All Rentals ({allRentals.length})</h5>
                <div className="d-flex gap-2">
                  <Badge bg="warning">{allRentals.filter(r => r.status === 'pending').length} Pending</Badge>
                  <Badge bg="success">{metrics.activeRentals} Active</Badge>
                  <Badge bg="primary">{metrics.completedRentals} Completed</Badge>
                  <Badge bg="danger">{allRentals.filter(r => r.status === 'cancelled').length} Cancelled</Badge>
                </div>
              </div>
              
              {metrics.loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <Card className={isDarkMode ? 'bg-dark border-secondary' : ''}>
                  <div className="table-responsive">
                    <Table hover className={`mb-0 ${isDarkMode ? 'table-dark' : ''}`}>
                      <thead className={isDarkMode ? 'table-dark' : 'table-light'}>
                        <tr>
                          <th>Rental ID</th>
                          <th>Equipment</th>
                          <th>Renter</th>
                          <th>Owner</th>
                          <th>Duration</th>
                          <th>Total Cost</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRentals.length > 0 ? (
                          filteredRentals.map(rental => (
                            <tr key={rental.id} className="enhanced-hover">
                              <td className="text-muted small">#{rental.id.slice(-8)}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <img 
                                    src={rental.equipmentImage || 'https://via.placeholder.com/40'} 
                                    alt={rental.equipmentName}
                                    className="rounded me-2"
                                    width="40"
                                    height="40"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/40';
                                    }}
                                  />
                                  <div>
                                    <div className="fw-semibold">{rental.equipmentName}</div>
                                    <small className="text-muted">{rental.equipmentCategory}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold">{rental.renterName}</div>
                                <small className="text-muted">{rental.renterEmail}</small>
                              </td>
                              <td>
                                <div className="fw-semibold">{rental.ownerName}</div>
                                <small className="text-muted">{rental.ownerEmail}</small>
                              </td>
                              <td>
                                {rental.startDate && rental.endDate ? (
                                  <div>
                                    <div>{new Date(rental.startDate.toDate()).toLocaleDateString()}</div>
                                    <small className="text-muted">to {new Date(rental.endDate.toDate()).toLocaleDateString()}</small>
                                  </div>
                                ) : (
                                  <span className="text-muted">Unknown</span>
                                )}
                              </td>
                              <td className="fw-bold text-success">${rental.totalCost || '0'}</td>
                              <td>{getRentalStatusBadge(rental.status)}</td>
                              <td>
                                {rental.createdAt ? 
                                  new Date(rental.createdAt.toDate()).toLocaleDateString() : 
                                  'Unknown'
                                }
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <TooltipWrapper tooltip="View rental details">
                                    <Button variant="outline-primary" size="sm" className="enhanced-hover">
                                      <Eye className="me-1" size={12} />
                                      View
                                    </Button>
                                  </TooltipWrapper>
                                  {rental.status === 'disputed' && (
                                    <TooltipWrapper tooltip="Resolve dispute">
                                      <Button variant="outline-warning" size="sm" className="enhanced-hover">
                                        <Flag className="me-1" size={12} />
                                        Resolve
                                      </Button>
                                    </TooltipWrapper>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="text-center py-4">
                              <FileEarmark className="display-4 text-muted" />
                              <div className="mt-2">No rentals found</div>
                              {searchQuery && (
                                <p className="text-muted">Try adjusting your search terms.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* --------- DISPUTE CENTER TAB --------- */}
          {activeTab === 'Dispute Center' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Dispute Center ({allDisputes.length})</h5>
                <div className="d-flex gap-2">
                  <Badge bg="danger">{allDisputes.filter(d => d.status === 'open').length} Open</Badge>
                  <Badge bg="warning">{allDisputes.filter(d => d.status === 'investigating').length} Investigating</Badge>
                  <Badge bg="success">{allDisputes.filter(d => d.status === 'resolved').length} Resolved</Badge>
                  <Badge bg="secondary">{allDisputes.filter(d => d.status === 'closed').length} Closed</Badge>
                </div>
              </div>
              
              {metrics.loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <Card className={isDarkMode ? 'bg-dark border-secondary' : ''}>
                  <div className="table-responsive">
                    <Table hover className={`mb-0 ${isDarkMode ? 'table-dark' : ''}`}>
                      <thead className={isDarkMode ? 'table-dark' : 'table-light'}>
                        <tr>
                          <th>Dispute ID</th>
                          <th>Type</th>
                          <th>Equipment</th>
                          <th>Reported By</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDisputes.length > 0 ? (
                          filteredDisputes.map(dispute => (
                            <tr key={dispute.id} className="enhanced-hover">
                              <td className="text-muted small">#{dispute.id.slice(-8)}</td>
                              <td>
                                <Badge bg={
                                  dispute.type === 'damage' ? 'danger' :
                                  dispute.type === 'payment' ? 'warning' :
                                  dispute.type === 'quality' ? 'info' : 'secondary'
                                }>
                                  {dispute.type}
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <img 
                                    src={dispute.equipmentImage || 'https://via.placeholder.com/40'} 
                                    alt={dispute.equipmentName}
                                    className="rounded me-2"
                                    width="40"
                                    height="40"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/40';
                                    }}
                                  />
                                  <div>
                                    <div className="fw-semibold">{dispute.equipmentName}</div>
                                    <small className="text-muted">Rental #{dispute.rentalId?.slice(-8)}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold">{dispute.reporterName}</div>
                                <small className="text-muted">{dispute.reporterEmail}</small>
                              </td>
                              <td>
                                <Badge bg={
                                  dispute.priority === 'high' ? 'danger' :
                                  dispute.priority === 'medium' ? 'warning' : 'info'
                                }>
                                  {dispute.priority}
                                </Badge>
                              </td>
                              <td>{getDisputeStatusBadge(dispute.status)}</td>
                              <td>
                                {dispute.createdAt ? 
                                  new Date(dispute.createdAt.toDate()).toLocaleDateString() : 
                                  'Unknown'
                                }
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <TooltipWrapper tooltip="View dispute details">
                                    <Button variant="outline-primary" size="sm" className="enhanced-hover">
                                      <Eye className="me-1" size={12} />
                                      View
                                    </Button>
                                  </TooltipWrapper>
                                  {(dispute.status === 'open' || dispute.status === 'investigating') && (
                                    <TooltipWrapper tooltip="Resolve dispute">
                                      <Button 
                                        variant="outline-success" 
                                        size="sm"
                                        className="enhanced-hover"
                                        onClick={() => handleResolveDispute(dispute)}
                                      >
                                        <Check className="me-1" size={12} />
                                        Resolve
                                      </Button>
                                    </TooltipWrapper>
                                  )}
                                  <TooltipWrapper tooltip="View messages">
                                    <Button variant="outline-warning" size="sm" className="enhanced-hover">
                                      <ChatText className="me-1" size={12} />
                                      Messages
                                    </Button>
                                  </TooltipWrapper>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              <Flag className="display-4 text-muted" />
                              <div className="mt-2">No disputes found</div>
                              {searchQuery ? (
                                <p className="text-muted">Try adjusting your search terms.</p>
                              ) : (
                                <p className="text-muted">Great! No active disputes on the platform.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* --------- REVIEW MODERATION TAB --------- */}
          {activeTab === 'Review Moderation' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Review Moderation ({allReviews.length})</h5>
                <div className="d-flex gap-2">
                  <Badge bg="warning">{allReviews.filter(r => r.moderationStatus === 'pending' || r.flagged).length} Flagged</Badge>
                  <Badge bg="success">{allReviews.filter(r => r.moderationStatus === 'approved').length} Approved</Badge>
                  <Badge bg="danger">{allReviews.filter(r => r.moderationStatus === 'rejected' || r.moderationStatus === 'removed').length} Rejected/Removed</Badge>
                </div>
              </div>
              
              {metrics.loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <Card className={isDarkMode ? 'bg-dark border-secondary' : ''}>
                  <div className="table-responsive">
                    <Table hover className={`mb-0 ${isDarkMode ? 'table-dark' : ''}`}>
                      <thead className={isDarkMode ? 'table-dark' : 'table-light'}>
                        <tr>
                          <th>Review</th>
                          <th>Equipment</th>
                          <th>Reviewer</th>
                          <th>Rating</th>
                          <th>Flags</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReviews.length > 0 ? (
                          filteredReviews.map(review => (
                            <tr key={review.id} className={`enhanced-hover ${
                              (review.flagged || review.flaggedCount > 0 || review.moderationStatus === 'pending') ? 
                              (isDarkMode ? 'table-warning-dark' : 'table-warning') : ''
                            }`}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div>
                                    <div className="fw-semibold">Review #{review.id.slice(-6)}</div>
                                    <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                                      {review.comment}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <img 
                                    src={review.equipmentImage || 'https://via.placeholder.com/40'} 
                                    alt={review.equipmentName}
                                    className="rounded me-2"
                                    width="40"
                                    height="40"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/40';
                                    }}
                                  />
                                  <div>
                                    <div className="fw-semibold">{review.equipmentName}</div>
                                    <small className="text-muted">{review.equipmentCategory}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold">{review.userName}</div>
                                <small className="text-muted">{review.userEmail}</small>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <StarFill
                                      key={i}
                                      className={`me-1 ${i < review.rating ? 'text-warning' : 'text-muted'}`}
                                      size={14}
                                    />
                                  ))}
                                  <span className="ms-1 small">{review.rating}/5</span>
                                </div>
                              </td>
                              <td>
                                {review.flaggedCount > 0 ? (
                                  <Badge bg="danger">🚩 {review.flaggedCount}</Badge>
                                ) : review.flagged ? (
                                  <Badge bg="warning">🚩 Flagged</Badge>
                                ) : (
                                  <Badge bg="success">Clean</Badge>
                                )}
                                {review.flagReasons && review.flagReasons.length > 0 && (
                                  <div className="mt-1">
                                    {review.flagReasons.slice(0, 2).map((reason, index) => (
                                      <Badge key={index} bg="secondary" className="me-1 small">{reason}</Badge>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td>
                                <Badge bg={
                                  review.moderationStatus === 'approved' ? 'success' :
                                  review.moderationStatus === 'rejected' ? 'danger' :
                                  review.moderationStatus === 'removed' ? 'dark' : 'warning'
                                }>
                                  {review.moderationStatus || 'Pending'}
                                </Badge>
                              </td>
                              <td>
                                {review.createdAt ? 
                                  new Date(review.createdAt.toDate()).toLocaleDateString() : 
                                  'Unknown'
                                }
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <TooltipWrapper tooltip="View review details">
                                    <Button variant="outline-primary" size="sm" className="enhanced-hover">
                                      <Eye className="me-1" size={12} />
                                      View
                                    </Button>
                                  </TooltipWrapper>
                                  {(review.flagged || review.flaggedCount > 0 || review.moderationStatus === 'pending') && (
                                    <TooltipWrapper tooltip="Moderate review">
                                      <Button 
                                        variant="outline-warning" 
                                        size="sm"
                                        className="enhanced-hover"
                                        onClick={() => handleModerateReview(review)}
                                      >
                                        <ExclamationTriangle className="me-1" size={12} />
                                        Moderate
                                      </Button>
                                    </TooltipWrapper>
                                  )}
                                  {review.moderationStatus === 'approved' && (
                                    <TooltipWrapper tooltip="Remove review">
                                      <Button variant="outline-danger" size="sm" className="enhanced-hover">
                                        <X className="me-1" size={12} />
                                        Remove
                                      </Button>
                                    </TooltipWrapper>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              <StarFill className="display-4 text-muted" />
                              <div className="mt-2">No reviews found</div>
                              {searchQuery ? (
                                <p className="text-muted">Try adjusting your search terms.</p>
                              ) : (
                                <p className="text-muted">No reviews need moderation at this time.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* --------- ANALYTICS TAB --------- */}
          {activeTab === 'Analytics' && (
            <>
              <h5>Platform Analytics</h5>
              <Row className="mb-4">
                <Col md={12}>
                  <Card className={isDarkMode ? 'bg-dark border-secondary text-light' : ''}>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                          <CartesianGrid stroke={isDarkMode ? "#4a5568" : "#eee"} strokeDasharray="5 5" />
                          <XAxis dataKey="month" stroke={isDarkMode ? "#e2e8f0" : "#333"} />
                          <YAxis stroke={isDarkMode ? "#e2e8f0" : "#333"} />
                          <RechartsTooltip 
                            contentStyle={{
                              backgroundColor: isDarkMode ? '#2d3748' : '#fff',
                              border: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                              color: isDarkMode ? '#e2e8f0' : '#333'
                            }}
                          />
                          <Line type="monotone" dataKey="equipment" stroke="#3b82f6" name="Equipment Added" />
                          <Line type="monotone" dataKey="rentals" stroke="#10b981" name="Rentals Completed" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* Additional Analytics Cards */}
              <Row>
                <Col md={6}>
                  <Card className={isDarkMode ? 'bg-dark border-secondary text-light' : ''}>
                    <Card.Header className={isDarkMode ? 'border-secondary' : ''}>
                      <h6 className="mb-0">Equipment Categories</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted">Equipment distribution by category analysis coming soon.</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className={isDarkMode ? 'bg-dark border-secondary text-light' : ''}>
                    <Card.Header className={isDarkMode ? 'border-secondary' : ''}>
                      <h6 className="mb-0">Revenue Insights</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted">Revenue tracking and projections coming soon.</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* --------- SETTINGS TAB --------- */}
          {activeTab === 'Settings' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Admin Settings</h5>
                <div className="d-flex gap-2">
                  <TooltipWrapper tooltip="Configure platform settings">
                    <Button variant="primary" onClick={() => setShowSettings(true)} className="enhanced-hover">
                      <Gear className="me-2" />
                      Configure Platform
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper tooltip="Export or import data">
                    <Button variant="outline-primary" onClick={() => setShowExportImport(true)} className="enhanced-hover">
                      <Archive className="me-2" />
                      Export/Import
                    </Button>
                  </TooltipWrapper>
                </div>
              </div>
              <Row>
                <Col md={8}>
                  <Card className={isDarkMode ? 'bg-dark border-secondary text-light' : ''}>
                    <Card.Header className={isDarkMode ? 'border-secondary' : ''}>
                      <h6 className="mb-0">Quick Actions</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-grid gap-2">
                        <TooltipWrapper tooltip="Export user data to CSV">
                          <Button 
                            variant="outline-primary" 
                            className="d-flex align-items-center justify-content-start enhanced-hover"
                            onClick={() => setShowExportImport(true)}
                          >
                            <Download className="me-2" />
                            Export User Data
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper tooltip="Export equipment data to CSV">
                          <Button 
                            variant="outline-primary" 
                            className="d-flex align-items-center justify-content-start enhanced-hover"
                            onClick={() => setShowExportImport(true)}
                          >
                            <Download className="me-2" />
                            Export Equipment Data
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper tooltip="Export rental reports">
                          <Button 
                            variant="outline-primary" 
                            className="d-flex align-items-center justify-content-start enhanced-hover"
                            onClick={() => setShowExportImport(true)}
                          >
                            <Download className="me-2" />
                            Export Rental Reports
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper tooltip="Bulk import equipment from CSV">
                          <Button 
                            variant="outline-warning" 
                            className="d-flex align-items-center justify-content-start enhanced-hover"
                            onClick={() => setShowExportImport(true)}
                          >
                            <Upload className="me-2" />
                            Bulk Import Equipment
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper tooltip="Export admin actions log">
                          <Button 
                            variant="outline-info" 
                            className="d-flex align-items-center justify-content-start enhanced-hover"
                            onClick={() => setShowExportImport(true)}
                          >
                            <FileText className="me-2" />
                            Export Admin Actions Log
                          </Button>
                        </TooltipWrapper>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className={isDarkMode ? 'bg-dark border-secondary text-light' : ''}>
                    <Card.Header className={isDarkMode ? 'border-secondary' : ''}>
                      <h6 className="mb-0">System Status</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Database Status:</span>
                        <Badge bg="success">Online</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Storage Usage:</span>
                        <Badge bg="primary">45% Used</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Active Sessions:</span>
                        <Badge bg="info">{metrics.totalUsers} Users</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Pending Disputes:</span>
                        <Badge bg={metrics.activeDisputes > 0 ? "danger" : "success"}>
                          {metrics.activeDisputes}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Flagged Reviews:</span>
                        <Badge bg={metrics.flaggedReviews > 0 ? "warning" : "success"}>
                          {metrics.flaggedReviews}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Theme Mode:</span>
                        <TooltipWrapper tooltip={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
                          <Button 
                            variant={isDarkMode ? "outline-light" : "outline-dark"} 
                            size="sm" 
                            onClick={toggleDarkMode}
                            className="enhanced-hover"
                          >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                          </Button>
                        </TooltipWrapper>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </div>
      </div>
      
      {/* Enhanced CSS Styles with Dark Mode and Hover Effects */}
      <style jsx>{`
        /* Dark Mode Styles */
        .dark-mode {
          background-color: #1a202c !important;
          color: #e2e8f0 !important;
        }
        
        .dark-mode .card {
          background-color: #2d3748 !important;
          border-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        .dark-mode .modal-content {
          background-color: #2d3748 !important;
          border-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        .dark-mode .form-control {
          background-color: #2d3748 !important;
          border-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        .dark-mode .form-control:focus {
          background-color: #2d3748 !important;
          border-color: #63b3ed !important;
          color: #e2e8f0 !important;
          box-shadow: 0 0 0 0.2rem rgba(99, 179, 237, 0.25) !important;
        }
        
        .dark-mode .form-select {
          background-color: #2d3748 !important;
          border-color: #4a5568 !important;
          color: #e2e8f0 !important;
        }
        
        .dark-mode .table-warning-dark {
          background-color: rgba(255, 193, 7, 0.2) !important;
        }
        
        .dark-mode .dropdown-item-dark:hover {
          background-color: #4a5568 !important;
        }
        
        /* Enhanced Hover Effects */
        .enhanced-hover {
          transition: all 0.3s ease !important;
        }
        
        .enhanced-hover:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
        }
        
        .dark-mode .enhanced-hover:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Sidebar Styles */
        .sidebar { 
          width: 250px; 
          min-height: 100vh; 
        }
        
        .sidebar .nav-link { 
          color: rgba(255, 255, 255, 0.8); 
          padding: 0.75rem 1rem; 
          border: none; 
          background: none; 
          width: 100%; 
          text-align: left; 
          border-radius: 0; 
          transition: all 0.3s ease !important;
        }
        
        .sidebar .nav-link:hover { 
          color: white; 
          background-color: rgba(255, 255, 255, 0.1); 
          transform: translateX(5px) !important;
        }
        
        .sidebar .nav-link.active { 
          color: white; 
          background-color: #3b82f6; 
        }
        
        /* Notifications Panel */
        .notifications-panel { 
          position: absolute; 
          top: 100%; 
          right: 0; 
          width: 350px; 
          background: white; 
          border: 1px solid #e5e7eb; 
          border-radius: 0.5rem; 
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
          z-index: 1000; 
          max-height: 400px; 
          overflow-y: auto; 
        }
        
        .notification-item:hover { 
          background-color: #f8f9fa; 
        }
        
        .dark-mode .notification-item:hover {
          background-color: #4a5568 !important;
        }
        
        /* Stats Cards */
        .stats-card:hover { 
          transform: translateY(-4px) !important; 
          transition: transform 0.3s ease !important;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
        }
        
        .dark-mode .stats-card:hover {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Activity List */
        .activity-list li { 
          padding: 0.5rem 0; 
          border-bottom: 1px solid #f1f3f4; 
          transition: all 0.2s ease !important;
        }
        
        .activity-list li:last-child { 
          border-bottom: none; 
        }
        
        .activity-list li:hover {
          background-color: rgba(59, 130, 246, 0.05) !important;
          border-radius: 0.375rem !important;
          padding-left: 1rem !important;
        }
        
        .dark-mode .activity-list li {
          border-bottom-color: #4a5568 !important;
        }
        
        .dark-mode .activity-list li:hover {
          background-color: rgba(99, 179, 237, 0.1) !important;
        }
        
        /* Table Row Hover */
        .table-hover tbody tr:hover {
          background-color: rgba(59, 130, 246, 0.05) !important;
        }
        
        .dark-mode .table-hover tbody tr:hover {
          background-color: rgba(99, 179, 237, 0.1) !important;
        }
        
        /* Button Hover Effects */
        .btn.enhanced-hover:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;
        }
        
        .dark-mode .btn.enhanced-hover:hover {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Card Hover Effects */
        .card.enhanced-hover:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        
        .dark-mode .card.enhanced-hover:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Avatar Hover */
        .avatar.enhanced-hover:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        }
        
        /* Tooltip Enhancements */
        .tooltip {
          font-size: 0.875rem !important;
        }
        
        /* Focus States for Dark Mode */
        .dark-mode .btn:focus,
        .dark-mode .form-control:focus,
        .dark-mode .form-select:focus {
          box-shadow: 0 0 0 0.2rem rgba(99, 179, 237, 0.25) !important;
        }
        
        /* Progress Bar Dark Mode */
        .dark-mode .progress {
          background-color: #4a5568 !important;
        }
        
        /* Alert Dark Mode */
        .dark-mode .alert {
          border-color: #4a5568 !important;
        }
        
        /* Badge Hover Effects */
        .badge.enhanced-hover:hover {
          transform: scale(1.05) !important;
        }
        
        /* Smooth Scrolling */
        * {
          scroll-behavior: smooth;
        }
        
        /* Custom Scrollbar for Dark Mode */
        .dark-mode ::-webkit-scrollbar {
          width: 8px;
        }
        
        .dark-mode ::-webkit-scrollbar-track {
          background: #2d3748;
        }
        
        .dark-mode ::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 4px;
        }
        
        .dark-mode ::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }
      `}</style>
    </div>
    </>
  );
}

// Export with Dark Mode Provider
export default function AdminDashboardWithProvider() {
  return (
    <DarkModeProvider>
      <AdminDashboard />
    </DarkModeProvider>
  );
}