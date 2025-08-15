// src/components/MapComponent.jsx
'use client';
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// --- Helper Functions ---
const getColorByAvailability = (score) => {
  if (score > 0.7) return '#4CAF50'; // Green
  if (score > 0.3) return '#FFC107'; // Yellow
  return '#F44336'; // Red
};
const getLiveColor = (occupancy, capacity) => {
    if (capacity === 0) return '#F44336';
    const availability = 1 - (occupancy / capacity);
    if (availability > 0.7) return '#4CAF50';
    if (availability > 0.1) return '#FFC107';
    return '#F44336';
};
const getPredictionForTime = (predictions, selectedTime) => {
  const timeToCompare = selectedTime || new Date();
  if (!predictions || predictions.length === 0) {
    return { availabilityScore: 0.5, timestamp: timeToCompare };
  }
  return predictions.reduce((closest, current) => {
    const closestDiff = Math.abs(new Date(closest.timestamp).getTime() - timeToCompare.getTime());
    const currentDiff = Math.abs(new Date(current.timestamp).getTime() - timeToCompare.getTime());
    return currentDiff < closestDiff ? current : closest;
  });
};

// --- Icon Fix & Recenter Component (unchanged) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
function RecenterAutomatically({position}){
    const map = useMap();
    const [hasCentered, setHasCentered] = useState(false);
    useEffect(() => {
        if (position && !hasCentered) {
            map.flyTo(position, 15);
            setHasCentered(true);
        }
    }, [position, hasCentered, map]);
    return null;
}


const MapComponent = ({ zones, selectedTime ,userPosition, liveZoneData, viewMode }) => {
  const initialPosition = [18.5204, 73.8567]; // Pune

  return (
    <MapContainer center={initialPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <RecenterAutomatically position={userPosition} />

      {userPosition && (
        <Marker position={userPosition}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {zones.map((zone) => {
        let color, popupText;

        // --- CORRECTED LOGIC ---
        if (viewMode === 'forecast') {
          // FORECAST VIEW: Always use prediction data
          const prediction = getPredictionForTime(zone.predictions, selectedTime);
          color = getColorByAvailability(prediction.availabilityScore);
          popupText = `Predicted Availability: ${Math.round(prediction.availabilityScore * 100)}%`;
        } else {
          // LIVE VIEW: Prioritize Pusher data, but fall back to initial DB data
          const liveUpdate = liveZoneData[zone.zoneId];
          
          const occupancy = liveUpdate ? liveUpdate.currentOccupancy : zone.currentOccupancy;
          const capacity = liveUpdate ? liveUpdate.capacity : zone.capacity;
          
          color = getLiveColor(occupancy, capacity);
          const available = capacity - occupancy;
          popupText = `Live Status: ${available} / ${capacity} spots available`;
        }

        return (
          <Polygon
            key={zone.zoneId}
            positions={zone.area.coordinates[0].map(coord => [coord[1], coord[0]])}
            pathOptions={{ color: color, fillColor: color, fillOpacity: 0.6 }}
          >
            <Popup>
              <div>
                <h3 style={{ margin: 0, fontWeight: 'bold' }}>{zone.zoneName}</h3>
                <p style={{ margin: '5px 0' }}>{zone.description}</p>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                <p style={{ margin: '5px 0' }}>
                  <strong>Status:</strong> {popupText}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Total Capacity:</strong> {zone.capacity}
                </p>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </MapContainer>
  );
};

export default MapComponent;
