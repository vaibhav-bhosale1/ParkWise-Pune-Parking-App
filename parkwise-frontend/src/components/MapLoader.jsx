// src/components/MapLoader.jsx
'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const MapLoader = ({ zones }) => {
  const Map = useMemo(() => dynamic(
    () => import('@/components/MapComponent'),
    { 
      loading: () => <p>A map is loading...</p>,
      ssr: false 
    }
  ), [zones]);

  return <Map zones={zones} />;
};

export default MapLoader;