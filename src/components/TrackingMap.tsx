import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TrackingMapProps {
  customerLocation?: { lat: number; lng: number };
  providerLocation?: { lat: number; lng: number };
  customerName?: string;
  providerName?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  
  return null;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  customerLocation,
  providerLocation,
  customerName = 'Your Location',
  providerName = 'Provider Location',
}) => {
  // Default to a central location if no coordinates provided
  const defaultCenter: [number, number] = [25.276987, 55.296249]; // Dubai
  const center: [number, number] = customerLocation 
    ? [customerLocation.lat, customerLocation.lng]
    : providerLocation 
    ? [providerLocation.lat, providerLocation.lng]
    : defaultCenter;

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <MapUpdater center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {customerLocation && (
          <Marker position={[customerLocation.lat, customerLocation.lng]}>
            <Popup>
              <div className="text-sm">
                <strong>{customerName}</strong>
                <br />
                Customer Location
              </div>
            </Popup>
          </Marker>
        )}
        
        {providerLocation && (
          <Marker position={[providerLocation.lat, providerLocation.lng]}>
            <Popup>
              <div className="text-sm">
                <strong>{providerName}</strong>
                <br />
                Provider Location
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
