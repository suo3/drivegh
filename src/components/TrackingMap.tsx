import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface TrackingMapProps {
  customerLocation?: { lat: number; lng: number };
  providerLocation?: { lat: number; lng: number };
  customerName?: string;
  providerName?: string;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  customerLocation,
  providerLocation,
  customerName = 'Your Location',
  providerName = 'Provider Location',
}) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  // Debug mount/unmount to isolate crashes
  useEffect(() => {
    console.log('[TrackingMap] mount', { customerLocation, providerLocation });
    return () => console.log('[TrackingMap] unmount');
  }, [customerLocation, providerLocation]);

  // Default to a central location if no coordinates provided
  const defaultCenter: [number, number] = [25.276987, 55.296249]; // Dubai
  const center: [number, number] = customerLocation
    ? [customerLocation.lat, customerLocation.lng]
    : providerLocation
    ? [providerLocation.lat, providerLocation.lng]
    : defaultCenter;

  if (!isClient) {
    return <div className="w-full h-[300px] rounded-lg bg-muted" />;
  }

  return (
    <div className="w-full h-[300px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
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
