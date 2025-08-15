// src/components/TimePicker.jsx
'use client';

import React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import dayjs from 'dayjs';

const TimePicker = ({ initialTime, onOk, onCancel }) => {
  // This local state holds the time as the user changes it on the clock.
  const [tempTime, setTempTime] = React.useState(() => dayjs(initialTime));

  const handleOk = () => {
    // When "OK" is clicked, call the parent's function with the new time.
    onOk(tempTime.toDate());
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1001, // Higher zIndex to appear above other elements
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <StaticTimePicker
          ampm
          value={tempTime}
          onChange={(newTime) => setTempTime(newTime)}
          onAccept={handleOk} // --- CHANGE: Use the built-in OK button ---
          onClose={onCancel}  // --- CHANGE: Use the built-in Cancel button ---
          slotProps={{
            toolbar: {
              style: {
                backgroundColor: '#f5f5f5',
                padding: '8px 16px',
                borderBottom: '1px solid #e0e0e0',
              },
            },
            // This tells the component to show its default action bar
            actionBar: {
              actions: ['cancel', 'accept'],
            },
          }}
        />
      </LocalizationProvider>
      {/* --- REMOVED: The custom OK and Cancel buttons div has been removed --- */}
    </div>
  );
};

export default TimePicker;
