// src/components/MapComponent.jsx
'use client'; // This directive marks this as a Client Component

import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with webpack which can happen in some setups
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapComponent = ({ zones }) => {
  // Center of Pune, India
  const position = [18.5204, 73.8567]; 
  
  // Dummy colors for now. We will make this dynamic in a later phase.
  const getColor = () => {
    return '#3388ff'; // Default blue color
  };

  return (
    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Map over the zones data passed via props */}
      {zones.map((zone) => (
        <Polygon
          key={zone.zoneId}
          // Leaflet's Polygon component expects [latitude, longitude], but GeoJSON is [longitude, latitude].
          // We map over the coordinates to swap them.
          positions={zone.area.coordinates[0].map(coord => [coord[1], coord[0]])} 
          pathOptions={{ color: getColor(), fillColor: getColor(), fillOpacity: 0.5 }}
        >
          {/* The Popup now displays more detailed information from your database schema */}
          <Popup>
            <div>
              <h3 style={{ margin: 0, fontWeight: 'bold' }}>{zone.zoneName}</h3>
              <p style={{ margin: '5px 0' }}>{zone.description}</p>
              <p style={{ margin: '5px 0' }}>
                <strong>Category:</strong> {zone.category}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Capacity:</strong> ~{zone.estimatedCapacity} spots
              </p>
            </div>
          </Popup>
        </Polygon>
      ))}

    </MapContainer>
  );
};

export default MapComponent;
