// src/components/MapLoader.jsx
'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const MapLoader = ({ zones, selectedTime, userPosition, liveZoneData }) => {
  const Map = useMemo(() => dynamic(
    () => import('@/components/MapComponent'),
    { 
      loading: () => <p>A map is loading...</p>,
      ssr: false 
    }
  ), [zones, liveZoneData]); // Re-render if zones or live data change

  return <Map 
    zones={zones} 
    selectedTime={selectedTime} 
    userPosition={userPosition} 
    liveZoneData={liveZoneData} 
  />;
};

export default MapLoader;