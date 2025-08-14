// src/components/MapComponent.jsx
'use client';

import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Helper Functions ---

/**
 * Takes a probability score (0.0 to 1.0) and returns a color.
 * Green = high availability, Yellow = medium, Red = low.
 * @param {number} score - The availability score.
 * @returns {string} A hex color code.
 */
const getColorByAvailability = (score) => {
  if (score > 0.7) return '#4CAF50'; // Green
  if (score > 0.3) return '#FFC107'; // Yellow
  return '#F44336'; // Red
};

/**
 * Finds the prediction closest to the selected time from the zone's predictions array.
 * @param {Array} predictions - The array of prediction objects from the DB.
 * @param {Date} selectedTime - The time selected by the user.
 * @returns {object} The closest prediction object or a default.
 */
const getPredictionForTime = (predictions, selectedTime) => {
  // If no time is selected, default to the current time to prevent errors.
  const timeToCompare = selectedTime || new Date();

  if (!predictions || predictions.length === 0) {
    return { availabilityScore: 0.5, timestamp: timeToCompare }; // Default to medium if no data
  }

  // Find the prediction with the minimum time difference
  return predictions.reduce((closest, current) => {
    const closestDiff = Math.abs(new Date(closest.timestamp).getTime() - timeToCompare.getTime());
    const currentDiff = Math.abs(new Date(current.timestamp).getTime() - timeToCompare.getTime());
    return currentDiff < closestDiff ? current : closest;
  });
};

// --- Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


const MapComponent = ({ zones, selectedTime }) => {
  const position = [18.5204, 73.8567]; // Pune

  return (
    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {zones.map((zone) => {
        // For each zone, find the right prediction and get its color
        const prediction = getPredictionForTime(zone.predictions, selectedTime);
        const color = getColorByAvailability(prediction.availabilityScore);

        return (
          <Polygon
            key={zone.zoneId}
            positions={zone.area.coordinates[0].map(coord => [coord[1], coord[0]])} // Swap lng/lat for Leaflet
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
