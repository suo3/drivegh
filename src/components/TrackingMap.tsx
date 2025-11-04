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

    // Load react-leaflet and leaflet together and fix default marker icons
    Promise.all([import('react-leaflet'), import('leaflet')])
      .then(([rlMod, Lmod]) => {
        try {
          const L = (Lmod as any).default ?? (Lmod as any);
          // Ensure marker icons load correctly under Vite
          // See: https://github.com/Leaflet/Leaflet/issues/4968
          // and Vite asset handling with import.meta.url
          // @ts-ignore
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
            iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
            shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
          });
        } catch (e) {
          console.warn('[TrackingMap] Leaflet icon setup failed', e);
        }
        if (mounted) setRl(rlMod);
      })
      .catch((e) => {
        console.error('[TrackingMap] failed to load leaflet/react-leaflet', e);
        if (mounted) setRl(null);
      });

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
