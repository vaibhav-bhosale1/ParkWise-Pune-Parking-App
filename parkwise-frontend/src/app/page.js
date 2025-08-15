// src/app/page.js
'use client'

import ReportingUI from '@/components/ReportingUI';
import MapLoader from '@/components/MapLoader';
import { useState, useEffect } from 'react';
import TimeSlider from "@/components/TimeSlider";
import Pusher from 'pusher-js';

export default function Home() {
  const [zones, setZones] = useState([]);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [userPosition, setUserPosition] = useState(null);
  const [liveZoneData, setLiveZoneData] = useState({});

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
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserPosition([latitude, longitude]);
      },
      (error) => {
        console.error(`Geolocation Error (Code ${error.code}): ${error.message}`);
      }
    );
  }, []);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    });
    const channel = pusher.subscribe('parking-updates');
    channel.bind('zone-update', (data) => {
      console.log('Received real-time update:', data);
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
    <main style={{ height: '100vh', width: '100vw' }}>
      <TimeSlider selectedTime={selectedTime} setSelectedTime={setSelectedTime}/>
      <MapLoader 
        zones={zones} 
        selectedTime={selectedTime} 
        userPosition={userPosition} 
        liveZoneData={liveZoneData} 
      />
      <ReportingUI 
        zones={zones} 
        userPosition={userPosition} 
        liveZoneData={liveZoneData} 
      />
    </main>
  );
}