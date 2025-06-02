// src/components/AuthDebug.js
import React from 'react';

// Empty component - renders nothing
function AuthDebug() {
<<<<<<< HEAD
  const { currentUser, userRole, loading, authChecked } = useAuth();

  // Always hide the debug panel
  return null;

  // Original code below (will never execute)
  if (process.env.NODE_ENV !== 'development') {
    return null; // Don't show in production
  }

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: '#f0f0f0',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      border: '1px solid #ccc',
      maxWidth: '300px',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>Auth Debug</h4>
      <div style={{ margin: '4px 0' }}>
        <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
      </div>
      <div style={{ margin: '4px 0' }}>
        <strong>Auth Checked:</strong> {authChecked ? 'Yes' : 'No'}
      </div>
      <div style={{ margin: '4px 0' }}>
        <strong>User:</strong> {currentUser ? currentUser.email : 'None'}
      </div>
      <div style={{ margin: '4px 0' }}>
        <strong>User Role:</strong> <span style={{ color: userRole === 'admin' ? 'red' : userRole === 'owner' ? 'blue' : 'green' }}>{userRole || 'None'}</span>
      </div>
      <div style={{ margin: '4px 0' }}>
        <strong>User ID:</strong> {currentUser ? currentUser.uid.substring(0, 8) + '...' : 'None'}
      </div>
      <div style={{ margin: '4px 0' }}>
        <strong>Verified:</strong> {currentUser ? (currentUser.emailVerified ? 'Yes' : 'No') : 'N/A'}
      </div>
      <button
        onClick={() => console.log('Full auth state:', { currentUser, userRole, loading, authChecked })}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          fontSize: '11px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Log Full State
      </button>
    </div>
  );
=======
  return null;
>>>>>>> 6c6fcb2 ( changed on auth debug)
}

export default AuthDebug;