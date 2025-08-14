// src/app/page.js

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

async function getZones() {
  // In production, this will be your deployed API URL.
  // For local development, it's the serverless-offline URL.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  try {
    const res = await fetch(`${apiUrl}/zones`, { cache: 'no-store' }); // Fetch fresh data every time
    if (!res.ok) {
      throw new Error('Failed to fetch zones');
    }
    return res.json();
  } catch (error) {
    console.error("API Error:", error);
    return []; // Return an empty array on error so the app doesn't crash
  }
}

export default async function Home() {
  const zones = await getZones();

  // Dynamically import the MapComponent ONLY on the client-side
  const Map = useMemo(() => dynamic(
    () => import('@/components/MapComponent'),
    { 
      loading: () => <p>A map is loading...</p>,
      ssr: false // This is the key!
    }
  ), []);

  return (
    <main style={{ height: '100vh', width: '100vw' }}>
      <Map zones={zones} />
      
      {/* We will add reporting buttons here */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000, // Make sure it's above the map
        display: 'flex',
        gap: '10px',
        background: 'rgba(255, 255, 255, 0.8)',
        padding: '10px',
        borderRadius: '8px',
      }}>
        <button style={{padding: '10px 20px', fontSize: '16px'}}>I Just Parked</button>
        <button style={{padding: '10px 20px', fontSize: '16px'}}>I Just Left</button>
        <button style={{padding: '10px 20px', fontSize: '16px'}}>Area is Full</button>
      </div>
    </main>
  );
}
