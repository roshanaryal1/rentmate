// src/components/AuthDebug.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function AuthDebug() {
  const { currentUser, userRole, loading } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: '#f0f0f0',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      border: '1px solid #ccc',
      maxWidth: '200px',
      zIndex: 9999
    }}>
      <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Auth Debug</h4>
      <p style={{ margin: '2px 0' }}>Loading: {loading ? 'Yes' : 'No'}</p>
      <p style={{ margin: '2px 0' }}>User: {currentUser ? currentUser.email : 'None'}</p>
      <p style={{ margin: '2px 0' }}>Role: {userRole || 'None'}</p>
      <p style={{ margin: '2px 0' }}>
        Verified: {currentUser ? (currentUser.emailVerified ? 'Yes' : 'No') : 'N/A'}
      </p>
    </div>
  );
}

export default AuthDebug;