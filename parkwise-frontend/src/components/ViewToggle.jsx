// src/components/ViewToggle.jsx
'use client';

import React from 'react';

const ViewToggle = ({ viewMode, setViewMode }) => {
  const baseStyle = {
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    backgroundColor: '#f0f0f0',
    color: '#333',
  };

  const activeStyle = {
    ...baseStyle,
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  };

  return (
    <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        borderRadius: '5px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
      <button 
        style={viewMode === 'live' ? activeStyle : baseStyle}
        onClick={() => setViewMode('live')}
      >
        Live Status
      </button>
      <button 
        style={viewMode === 'forecast' ? activeStyle : baseStyle}
        onClick={() => setViewMode('forecast')}
      >
        Forecast
      </button>
    </div>
  );
};

export default ViewToggle;