// src/components/ViewToggle.jsx
'use client';

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ViewToggle = ({ viewMode, setViewMode }) => {
  return (
    <div className="absolute top-5 right-5 z-[1000]">
      <ToggleGroup 
        type="single" 
        value={viewMode}
        onValueChange={(value) => {
          if (value) setViewMode(value);
        }}
        className="bg-white rounded-md shadow-lg"
      >
        <ToggleGroupItem value="live" aria-label="Toggle live status">
          Live Status
        </ToggleGroupItem>
        <ToggleGroupItem value="forecast" aria-label="Toggle forecast">
          Forecast
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ViewToggle;