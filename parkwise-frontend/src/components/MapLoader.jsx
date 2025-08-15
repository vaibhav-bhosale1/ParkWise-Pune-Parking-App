// src/components/MapLoader.jsx
'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const MapLoader = ({ zones, selectedTime, userPosition }) => {
  const Map = useMemo(() => dynamic(
    () => import('@/components/MapComponent'),
    { 
      loading: () => <p>A map is loading...</p>,
      ssr: false 
    }
  ), [zones, selectedTime, userPosition]);

  return <Map zones={zones} selectedTime={selectedTime} userPosition={userPosition} />;
};

export default MapLoader;