// src/components/ReportingUI.jsx
'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from './ui/button';
import { toast } from "sonner"

// --- Helper Functions ---
const haversineDistance = (p1, p2) => {
  const R = 6371e3;
  const lat1 = p1[0] * Math.PI / 180;
  const lat2 = p2[0] * Math.PI / 180;
  const deltaLat = (p2[0] - p1[0]) * Math.PI / 180;
  const deltaLng = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getPolygonCenter = (coords) => {
  const lats = coords.map(p => p[1]);
  const lngs = coords.map(p => p[0]);
  const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
  return [avgLat, avgLng];
};

const ReportingUI = ({ userPosition, zones, liveZoneData }) => {
  const nearestZoneInfo = useMemo(() => {
    if (!userPosition || !zones || zones.length === 0) {
      return { zone: null, distance: Infinity };
    }
    let nearestZone = null;
    let minDistance = Infinity;
    zones.forEach(zone => {
      // --- FIX: Add a defensive check to ensure the zone has valid area data ---
      if (zone.area && zone.area.coordinates && zone.area.coordinates[0]) {
        const zoneCenter = getPolygonCenter(zone.area.coordinates[0]);
        const distance = haversineDistance(userPosition, zoneCenter);
        if (distance < minDistance) {
          minDistance = distance;
          nearestZone = zone;
        }
      }
    });
    return { zone: nearestZone, distance: minDistance };
  }, [userPosition, zones]);

  const { zone, distance } = nearestZoneInfo;
  
  const liveData = zone ? liveZoneData[zone.zoneId] : null;
  const occupancy = liveData ? liveData.currentOccupancy : zone?.currentOccupancy;
  const capacity = liveData ? liveData.capacity : zone?.capacity;
  const isFull = capacity > 0 ? occupancy >= capacity : false;

  const handleReport = async (reportType) => {
    const proximityThresholdInMeters = 250;
    if (!zone || distance > proximityThresholdInMeters) {
      toast.warning(`You are not close enough to a parking zone. The nearest is ${Math.round(distance)}m away.`);
      return;
    }
    
    const { zoneId } = zone;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    try {
      const response = await fetch(`${apiUrl}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId, reportType }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(`Error: ${result.error}`);
      }else{
        toast.success('Reported !!')
      }
    } catch (error) {
      toast.error('Failed to submit report:');
    }
  };

return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4">
  <Card className="w-full">
    <CardHeader className="p-3">
      <CardTitle className="text-center text-sm font-medium text-gray-700">
        {zone 
          ? `Nearest: ${zone.zoneName} (${Math.round(distance)}m away)` 
          : "Finding nearest parking zone..."}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 pt-0 flex justify-center gap-2">
      <Button 
        onClick={() => handleReport('parked')} 
        disabled={isFull}
      >
        I Just Parked
      </Button>
      <Button onClick={() => handleReport('left')} variant="outline">
        I Just Left
      </Button>
      <Button onClick={() => handleReport('full')} variant="destructive">
        Area is Full
      </Button>
    </CardContent>
  </Card>
</div>

  );
};
export default ReportingUI;
