// src/components/ReportingUI.jsx
'use client';
import React from 'react';

const ReportingUI = () => {
  const handleReport = async (reportType) => {
    // For now, we hardcode the zoneId. Later, this could be dynamic.
    const zoneId = 'zone_fc_road_01'; 
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const response = await fetch(`${apiUrl}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zoneId, reportType }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Success: ${result.message}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Check the console.');
    }
  };

   const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#333', // Dark text color for readability
    backgroundColor: '#fff', // Explicit white background
    border: '1px solid #ccc', // A light border to define the button shape
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' // A subtle shadow for depth
  };

  return (
    <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        background: 'rgba(255, 255, 255, 0.8)',
        padding: '10px',
        borderRadius: '8px',
      }}>
      <button onClick={() => handleReport('parked')} style={buttonStyle}>I Just Parked</button>
      <button onClick={() => handleReport('left')} style={buttonStyle}>I Just Left</button>
      <button onClick={() => handleReport('full')} style={buttonStyle}>Area is Full</button>
    </div>
  );
};
export default ReportingUI;
