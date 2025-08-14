// src/components/MapComponent.jsx
'use client';
import { useState, useEffect } from 'react'; 
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Helper Functions (unchanged) ---
const getColorByAvailability = (score) => {
  if (score > 0.7) return '#4CAF50'; // Green
  if (score > 0.3) return '#FFC107'; // Yellow
  return '#F44336'; // Red
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

// --- Icon Fix (unchanged) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- Component to handle user location with improved error handling ---
function LocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMap(); // Get the map instance

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPosition = [latitude, longitude];
        setPosition(newPosition);
        map.flyTo(newPosition, 15); 
      },
      // --- UPDATED: More detailed error callback ---
      (error) => {
        console.error(`Geolocation Error (Code ${error.code}): ${error.message}`);
        // This provides more specific feedback in the console.
        if (error.code === 1) {
          console.log("Reason: User denied the request for Geolocation.");
        } else if (error.code === 2) {
          console.log("Reason: Location information is unavailable (e.g., no GPS signal).");
        } else if (error.code === 3) {
          console.log("Reason: The request to get user location timed out.");
        }
      },
      { enableHighAccuracy: true }
    );
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
}


const MapComponent = ({ zones, selectedTime }) => {
  const initialPosition = [18.5204, 73.8567]; // Pune

  return (
    <MapContainer center={initialPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <LocationMarker />

      {zones.map((zone) => {
        const prediction = getPredictionForTime(zone.predictions, selectedTime);
        const color = getColorByAvailability(prediction.availabilityScore);

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
                  <strong>Predicted Availability:</strong> {Math.round(prediction.availabilityScore * 100)}%
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Capacity:</strong> ~{zone.estimatedCapacity} spots
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
