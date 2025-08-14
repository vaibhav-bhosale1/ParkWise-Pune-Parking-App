// src/app/page.js
'use client' // This makes the component a Client Component

import ReportingUI from '@/components/ReportingUI';
import MapLoader from '@/components/MapLoader';
import { useState, useEffect } from 'react';
import TimeSlider from "@/components/TimeSlider"; // Import the TimeSlider component

export default function Home() {
  const [zones, setZones] = useState([]);
  // This state will now be controlled by the TimeSlider
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    // This function fetches zone data on the client-side
    const getZones = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      try {
        const res = await fetch(`${apiUrl}/zones`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch zones');
        const data = await res.json();
        setZones(data);
      } catch (error) {
        console.error("API Error:", error);
        setZones([]); // Set to empty on error
      }
    };

    getZones();
  }, []); // The empty dependency array means this runs once when the component mounts.

  return (
    <main style={{ height: '100vh', width: '100vw' }}>
      {/* The TimeSlider component is now added to the UI */}
      <TimeSlider selectedTime={selectedTime} setSelectedTime={setSelectedTime}/>
      
      {/* The MapLoader now receives the selectedTime state, so the map updates when the slider moves */}
      <MapLoader zones={zones} selectedTime={selectedTime} />
      
      <ReportingUI />
    </main>
  );
}
