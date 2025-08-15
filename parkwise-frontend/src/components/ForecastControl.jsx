// src/components/ForecastControl.jsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import TimePicker from './TimePicker ';

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const ForecastControl = ({ selectedTime, setSelectedTime }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleOk = (newTime) => {
    setSelectedTime(newTime);
    setIsPickerOpen(false);
  };

  const handleCancel = () => {
    setIsPickerOpen(false);
  };

  return (
    <>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}>
        <Button onClick={() => setIsPickerOpen(true)}>
          Forecast for: {formatTime(selectedTime)}
        </Button>
      </div>

      {isPickerOpen && (
        <TimePicker 
          initialTime={selectedTime}
          onOk={handleOk}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default ForecastControl;
