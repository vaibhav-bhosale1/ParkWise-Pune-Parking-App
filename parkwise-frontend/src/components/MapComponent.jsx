// src/components/MapComponent.jsx
'use client';
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// --- Helper Functions ---
const getLiveColor = (occupancy, capacity) => {
    if (capacity === 0) return '#F44336'; // Red if capacity is zero
    const availability = 1 - (occupancy / capacity);
    if (availability > 0.7) return '#4CAF50'; // Green
    if (availability > 0.1) return '#FFC107'; // Yellow
    return '#F44336'; // Red
};

// --- Icon Fix & Recenter Component ---
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

const MapComponent = ({ zones, selectedTime, userPosition, liveZoneData }) => {
  const initialPosition = [18.5204, 73.8567];

  return (
    <MapContainer center={initialPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
      <RecenterAutomatically position={userPosition} />
      {userPosition && <Marker position={userPosition}><Popup>You are here</Popup></Marker>}

      {zones.map((zone) => {
        // Prioritize live data, then initial data, then fallback to prediction
        const liveData = liveZoneData[zone.zoneId];
        const occupancy = liveData ? liveData.currentOccupancy : zone.currentOccupancy;
        const capacity = liveData ? liveData.capacity : zone.capacity;
        
        const color = getLiveColor(occupancy, capacity);
        const available = capacity - occupancy;
        const popupText = `Live Status: ${available} / ${capacity} spots available`;

        return (
          <Polygon
            key={zone.zoneId}
            positions={zone.area.coordinates[0].map(coord => [coord[1], coord[0]])}
            pathOptions={{ color: color, fillColor: color, fillOpacity: 0.6 }}
          >
            <Popup>
              <div>
                <h3 style={{ margin: 0 }}>{zone.zoneName}</h3>
                <p style={{ margin: '5px 0' }}>{popupText}</p>
                <p style={{ margin: '5px 0' }}>Total Capacity: {capacity}</p>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </MapContainer>
  );
};
export default MapComponent;