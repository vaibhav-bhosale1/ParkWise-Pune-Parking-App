// src/app/page.js
'use client' // This makes the component a Client Component

import ReportingUI from '@/components/ReportingUI';
import MapLoader from '@/components/MapLoader';
import { useState, useEffect } from 'react';
import TimeSlider from "@/components/TimeSlider";

export default function Home() {
  const [zones, setZones] = useState([]);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    const getZones = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      try {
        const res = await fetch(`${apiUrl}/zones`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch zones');
        const data = await res.json();
        setZones(data);
      } catch (error) {
        console.error("API Error:", error);
        setZones([]);
      }
    };
    getZones();
  }, []);

  // --- CHANGE: Use watchPosition for continuous, more accurate updates ---
  useEffect(() => {
    // Check if geolocation is available in the browser
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser.");
      return;
    }

    // Start watching the user's position
    const watcherId = navigator.geolocation.watchPosition(
      (position) => {
        console.log("New position received:", position.coords);
        const { latitude, longitude } = position.coords;
        setUserPosition([latitude, longitude]);
      },
      (error) => {
        console.error(`Geolocation Error (Code ${error.code}): ${error.message}`);
      },
      {
        enableHighAccuracy: true, // Request the most accurate location possible
        timeout: 10000,           // Wait 10 seconds before timing out
        maximumAge: 0             // Don't use a cached position
      }
    );

    // --- Cleanup function ---
    // This is crucial to stop watching when the component is unmounted.
    return () => {
      navigator.geolocation.clearWatch(watcherId);
    };
  }, []); // The empty dependency array ensures this runs only once on mount.

  return (
    <main style={{ height: '100vh', width: '100vw' }}>
      <TimeSlider selectedTime={selectedTime} setSelectedTime={setSelectedTime}/>
      <MapLoader zones={zones} selectedTime={selectedTime} userPosition={userPosition} />
      <ReportingUI zones={zones} userPosition={userPosition} />
    </main>
  );
}
