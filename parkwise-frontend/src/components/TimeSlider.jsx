// src/components/TimeSlider.jsx
'use client';

import React, { useState } from 'react'; // Import useState

// A simple utility to format time for display
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const TimeSlider = ({ selectedTime, setSelectedTime }) => {
  // --- CHANGE: Use useState to get the current time only ONCE ---
  // This creates a stable "now" that doesn't change on re-renders.
  const [now] = useState(() => new Date());
  
  // The slider will represent the number of 15-minute intervals from now.
  // We have 96 intervals for 24 hours.
  const handleSliderChange = (event) => {
    const intervals = parseInt(event.target.value, 10);
    const newTime = new Date(now.getTime() + intervals * 15 * 60 * 1000);
    setSelectedTime(newTime);
  };

  // Calculate the current slider value based on the selectedTime state
  const getSliderValue = () => {
    // Ensure selectedTime is valid before calculating difference
    if (!selectedTime) return 0;
    const diffInMinutes = (selectedTime.getTime() - now.getTime()) / (60 * 1000);
    return Math.round(diffInMinutes / 15);
  };

  return (
    <div style={{
      position: 'absolute',
      color:"black",
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      width: '80%',
      maxWidth: '500px',
      textAlign: 'center'
    }}>
      <label htmlFor="time-slider" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
        {/* Ensure selectedTime exists before formatting */}
        Forecast for: {selectedTime ? formatTime(selectedTime) : 'Loading...'}
      </label>
      <input
        type="range"
        id="time-slider"
        min="0" // 0 intervals from now (i.e., now)
        max="95" // ~24 hours from now
        step="1" // Move one 15-min interval at a time
        value={getSliderValue()}
        onChange={handleSliderChange}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default TimeSlider;
