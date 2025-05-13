// src/components/common/LoadingSpinner.js

import React from 'react';

export default function LoadingSpinner() {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '5px solid lightgray',
        borderTop: '5px solid black',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}