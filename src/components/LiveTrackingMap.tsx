import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, User } from 'lucide-react';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { Card } from './ui/card';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const providerIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/>
      <path d="m8 12 2 2 4-4" stroke="white" stroke-width="2"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const customerIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

interface LiveTrackingMapProps {
  customerLat: number;
  customerLng: number;
  providerLat?: number | null;
  providerLng?: number | null;
  customerName?: string;
  providerName?: string;
  showETA?: boolean;
}

function MapUpdater({ customerLat, customerLng, providerLat, providerLng }: { 
  customerLat: number; 
  customerLng: number;
  providerLat?: number | null;
  providerLng?: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (providerLat && providerLng) {
      // Fit bounds to show both customer and provider
      const bounds = [
        [customerLat, customerLng],
        [providerLat, providerLng]
      ];
      map.fitBounds(bounds as any, { padding: [50, 50] });
    } else {
      // Center on customer
      map.setView([customerLat, customerLng], 13);
    }
  }, [map, customerLat, customerLng, providerLat, providerLng]);

  return null;
}

export function LiveTrackingMap({
  customerLat,
  customerLng,
  providerLat,
  providerLng,
  customerName = "Customer",
  providerName = "Provider",
  showETA = true
}: LiveTrackingMapProps) {
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (providerLat && providerLng) {
      const dist = calculateDistance(customerLat, customerLng, providerLat, providerLng);
      setDistance(dist);

      // Calculate ETA assuming average speed of 40 km/h in city traffic
      const averageSpeed = 40; // km/h
      const timeInHours = dist / averageSpeed;
      const timeInMinutes = Math.round(timeInHours * 60);
      
      if (timeInMinutes < 1) {
        setEta('Less than 1 minute');
      } else if (timeInMinutes === 1) {
        setEta('1 minute');
      } else if (timeInMinutes < 60) {
        setEta(`${timeInMinutes} minutes`);
      } else {
        const hours = Math.floor(timeInMinutes / 60);
        const mins = timeInMinutes % 60;
        setEta(`${hours}h ${mins}m`);
      }
    } else {
      setDistance(null);
      setEta(null);
    }
  }, [customerLat, customerLng, providerLat, providerLng]);

  return (
    <div className="space-y-4">
      {showETA && distance !== null && eta && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Provider En Route</p>
                <p className="text-xs text-muted-foreground">Distance: {formatDistance(distance)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{eta}</p>
              <p className="text-xs text-muted-foreground">Estimated arrival</p>
            </div>
          </div>
        </Card>
      )}

      <div className="rounded-lg overflow-hidden border shadow-lg" style={{ height: '400px' }}>
        <MapContainer
          center={[customerLat, customerLng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <Marker position={[customerLat, customerLng]} icon={customerIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{customerName}</p>
                <p className="text-xs text-muted-foreground">Customer Location</p>
              </div>
            </Popup>
          </Marker>

          {providerLat && providerLng && (
            <Marker position={[providerLat, providerLng]} icon={providerIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{providerName}</p>
                  <p className="text-xs text-muted-foreground">Provider Location</p>
                  {distance && <p className="text-xs mt-1">{formatDistance(distance)} away</p>}
                </div>
              </Popup>
            </Marker>
          )}

          <MapUpdater 
            customerLat={customerLat} 
            customerLng={customerLng}
            providerLat={providerLat}
            providerLng={providerLng}
          />
        </MapContainer>
      </div>

      {!providerLat && !providerLng && (
        <Card className="p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground text-center">
            Waiting for provider to start journey...
          </p>
        </Card>
      )}
    </div>
  );
}
