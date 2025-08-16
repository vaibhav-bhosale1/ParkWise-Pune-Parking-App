// src/app/page.js
'use client'

import ReportingUI from '@/components/ReportingUI';
import MapLoader from '@/components/MapLoader';
import { useState, useEffect } from 'react';
import ForecastControl from "@/components/ForecastControl";
import ForecastSidebar from "../components/ForecastSidebar ";
import Pusher from 'pusher-js';
import ViewToggle from '@/components/ViewToggle';

export default function Home() {
  const [zones, setZones] = useState([]);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [userPosition, setUserPosition] = useState(null);
  const [liveZoneData, setLiveZoneData] = useState({});
  const [viewMode, setViewMode] = useState('live');

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

  useEffect(() => {
    const watcherId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserPosition([latitude, longitude]);
      },
      (error) => {
        console.error(`Geolocation Error (Code ${error.code}): ${error.message}`);
      }
    );
    return () => navigator.geolocation.clearWatch(watcherId);
  }, []);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    });
    const channel = pusher.subscribe('parking-updates');
    channel.bind('zone-update', (data) => {
      setLiveZoneData(prevData => ({
        ...prevData,
        [data.zoneId]: data
      }));
    });
    return () => {
      pusher.unsubscribe('parking-updates');
      pusher.disconnect();
    };
  }, []);

  return (
    <main className="relative h-screen w-screen">
      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      
      {viewMode === 'forecast' && (
        <>
          <ForecastControl selectedTime={selectedTime} setSelectedTime={setSelectedTime} />
          <ForecastSidebar zones={zones} selectedTime={selectedTime} />
        </>
      )}

      <MapLoader 
        zones={zones} 
        selectedTime={selectedTime} 
        userPosition={userPosition} 
        liveZoneData={liveZoneData} 
        viewMode={viewMode}
      />
      
      {viewMode === 'live' && (
        <ReportingUI 
          zones={zones} 
          userPosition={userPosition} 
          liveZoneData={liveZoneData} 
        />
      )}
    </main>
  );
}