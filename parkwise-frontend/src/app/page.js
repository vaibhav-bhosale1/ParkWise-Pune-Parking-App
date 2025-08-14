// src/app/page.js

import ReportingUI from '@/components/ReportingUI';
import MapLoader from '@/components/MapLoader'; // Import the new client component

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

  return (
    <main style={{ height: '100vh', width: '100vw' }}>
      {/* The map logic is now handled by the MapLoader client component, 
        which safely performs the dynamic import with ssr: false.
      */}
      <MapLoader zones={zones} />
      
      {/* The ReportingUI component already contains the buttons. */}
      <ReportingUI />
    </main>
  );
}
