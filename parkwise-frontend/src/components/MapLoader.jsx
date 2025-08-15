// src/components/MapLoader.jsx
'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const MapLoader = ({ zones, selectedTime, userPosition, liveZoneData,viewMode  }) => {
  const Map = useMemo(() => dynamic(
    () => import('@/components/MapComponent'),
    { 
      loading: () => <p>A map is loading...</p>,
      ssr: false 
    }
  ), [zones, liveZoneData,viewMode]); // Re-render if zones or live data change

  return <Map 
    zones={zones} 
    selectedTime={selectedTime} 
    userPosition={userPosition} 
    liveZoneData={liveZoneData} 
    viewMode={viewMode}
  />;
};

export default MapLoader;