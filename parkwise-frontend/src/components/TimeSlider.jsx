// src/components/TimeSlider.jsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const TimeSlider = ({ selectedTime, setSelectedTime }) => {
  const [now] = useState(() => new Date());
  
  const handleSliderChange = (value) => {
    const intervals = value[0];
    const newTime = new Date(now.getTime() + intervals * 15 * 60 * 1000);
    setSelectedTime(newTime);
  };

  const getSliderValue = () => {
    if (!selectedTime) return [0];
    const diffInMinutes = (selectedTime.getTime() - now.getTime()) / (60 * 1000);
    return [Math.round(diffInMinutes / 15)];
  };

  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-lg">
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-center text-lg">
            Forecast for: {selectedTime ? formatTime(selectedTime) : 'Loading...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Slider
            defaultValue={[0]}
            value={getSliderValue()}
            onValueChange={handleSliderChange}
            max={95} // ~24 hours from now in 15-min intervals
            step={1}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeSlider;