// src/components/ReportingUI.jsx
'use client';
import React, { useMemo } from 'react';

// --- CONFIGURATION ---
// This threshold is now only checked when the user clicks a button.
const proximityThresholdInMeters = 250; 

// --- Helper Functions ---
const haversineDistance = (p1, p2) => {
  const R = 6371e3; // Earth's radius in meters
  const lat1 = p1[0] * Math.PI / 180;
  const lat2 = p2[0] * Math.PI / 180;
  const deltaLat = (p2[0] - p1[0]) * Math.PI / 180;
  const deltaLng = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getPolygonCenter = (coords) => {
  const lats = coords.map(p => p[1]);
  const lngs = coords.map(p => p[0]);
  const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
  return [avgLat, avgLng];
};


const ReportingUI = ({ userPosition, zones }) => {
  // --- CHANGE: This hook now ALWAYS finds the nearest zone and its distance ---
  const nearestZoneInfo = useMemo(() => {
    if (!userPosition || !zones || zones.length === 0) {
      return { zone: null, distance: Infinity };
    }

    let nearestZone = null;
    let minDistance = Infinity;

    zones.forEach(zone => {
      const zoneCenter = getPolygonCenter(zone.area.coordinates[0]);
      const distance = haversineDistance(userPosition, zoneCenter);
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    });
    
    return { zone: nearestZone, distance: minDistance };
  }, [userPosition, zones]);


  const handleReport = async (reportType) => {
    // --- CHANGE: The distance check is now performed here, on button click ---
    const { zone, distance } = nearestZoneInfo;

    if (!zone || distance > proximityThresholdInMeters) {
      alert(`You are not close enough to a parking zone. The nearest zone is ${zone?.zoneName}, which is ${Math.round(distance)} meters away.`);
      return;
    }
    
    const { zoneId } = zone; 
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    try {
      const response = await fetch(`${apiUrl}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId, reportType }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Success: ${result.message} for ${zone.zoneName}`);
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
    color: '#333',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  return (
    <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255, 255, 255, 0.8)',
        padding: '10px',
        borderRadius: '8px',
      }}>
      {/* --- CHANGE: The UI now provides constant feedback --- */}
      <div style={{ fontWeight: 'bold', color: '#555', fontSize: '14px' }}>
        {nearestZoneInfo.zone 
          ? `Nearest: ${nearestZoneInfo.zone.zoneName} (${Math.round(nearestZoneInfo.distance)}m away)` 
          : "Finding nearest parking zone..."}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => handleReport('parked')} style={buttonStyle}>I Just Parked</button>
        <button onClick={() => handleReport('left')} style={buttonStyle}>I Just Left</button>
        <button onClick={() => handleReport('full')} style={buttonStyle}>Area is Full</button>
      </div>
    </div>
  );
};
export default ReportingUI;
