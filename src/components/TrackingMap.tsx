import React, { useEffect, useState } from 'react';
// react-leaflet is dynamically imported to avoid runtime issues
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

  // Dynamically load react-leaflet only on client to avoid runtime issues
  const [rl, setRl] = useState<any | null>(null);
  useEffect(() => {
    if (!isClient) return;
    let mounted = true;
    import('react-leaflet')
      .then((m) => {
        if (mounted) setRl(m);
      })
      .catch((e) => console.error('[TrackingMap] failed to load react-leaflet', e));
    return () => {
      mounted = false;
    };
  }, [isClient]);

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

  if (!isClient || !rl) {
    return <div className="w-full h-[300px] rounded-lg bg-muted" />;
  }

  // Destructure dynamically loaded components
  const { MapContainer: RLMapContainer, TileLayer: RLTileLayer, Marker: RLMarker, Popup: RLPopup } = rl;

  return (
    <div className="w-full h-[300px] rounded-lg overflow-hidden shadow-lg">
      <RLMapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <RLTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {customerLocation && (
          <RLMarker position={[customerLocation.lat, customerLocation.lng]}>
            <RLPopup>
              <div className="text-sm">
                <strong>{customerName}</strong>
                <br />
                Customer Location
              </div>
            </RLPopup>
          </RLMarker>
        )}

        {providerLocation && (
          <RLMarker position={[providerLocation.lat, providerLocation.lng]}>
            <RLPopup>
              <div className="text-sm">
                <strong>{providerName}</strong>
                <br />
                Provider Location
              </div>
            </RLPopup>
          </RLMarker>
        )}
      </RLMapContainer>
    </div>
  );
};
