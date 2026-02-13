import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, TrendingDown, Gauge } from 'lucide-react';
import { formatDistance } from '@/lib/distance';
import { Card } from './ui/card';
import { useProviderETA } from '@/hooks/useProviderETA';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Calculate bearing between two points (in degrees)
const calculateBearing = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(toLng - fromLng);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);

  const x = Math.sin(dLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = toDeg(Math.atan2(x, y));
  return (bearing + 360) % 360; // Normalize to 0-360
};

// Create provider icon - animated car when moving, static marker when stopped
const createProviderIcon = (isMoving: boolean, rotation: number = 0) => {
  if (isMoving) {
    // Animated moving car icon with rotation
    return new DivIcon({
      html: `
        <div style="position: relative; width: 50px; height: 50px;">
          <style>
            @keyframes pulse-ring {
              0% { transform: scale(0.8); opacity: 0.8; }
              100% { transform: scale(2.2); opacity: 0; }
            }
            @keyframes car-bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-2px); }
            }
            .pulse-ring-1 { animation: pulse-ring 1.5s ease-out infinite; }
            .pulse-ring-2 { animation: pulse-ring 1.5s ease-out 0.5s infinite; }
            .car-animate { animation: car-bounce 0.5s ease-in-out infinite; }
          </style>
          <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
            <!-- Pulse rings (don't rotate) -->
            <circle class="pulse-ring-1" cx="25" cy="25" r="12" fill="#3b82f6" opacity="0.4"/>
            <circle class="pulse-ring-2" cx="25" cy="25" r="12" fill="#3b82f6" opacity="0.3"/>
            <!-- Car body (rotated to face direction) -->
            <g class="car-animate" transform="rotate(${rotation - 90}, 25, 25)">
              <!-- Car base -->
              <rect x="12" y="19" width="26" height="12" rx="3" fill="#3b82f6" stroke="white" stroke-width="1.5"/>
              <!-- Car top -->
              <path d="M16 19 L19 11 L31 11 L34 19" fill="#3b82f6" stroke="white" stroke-width="1.5"/>
              <!-- Windows -->
              <path d="M18 18 L20 12 L25 12 L25 18 Z" fill="#60a5fa"/>
              <path d="M26 18 L26 12 L30 12 L32 18 Z" fill="#60a5fa"/>
              <!-- Front headlights (right side - direction of travel) -->
              <rect x="36" y="22" width="3" height="3" rx="1" fill="#fbbf24"/>
              <!-- Rear lights -->
              <rect x="11" y="22" width="3" height="3" rx="1" fill="#ef4444"/>
              <!-- Wheels -->
              <circle cx="18" cy="31" r="3.5" fill="#1e293b" stroke="white" stroke-width="1"/>
              <circle cx="32" cy="31" r="3.5" fill="#1e293b" stroke="white" stroke-width="1"/>
              <circle cx="18" cy="31" r="1.5" fill="#94a3b8"/>
              <circle cx="32" cy="31" r="1.5" fill="#94a3b8"/>
            </g>
          </svg>
        </div>
      `,
      className: 'provider-car-icon',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });
  }

  // Static marker when not moving
  return new DivIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="12" fill="#3b82f6" stroke="white" stroke-width="2"/>
        <path d="M14 20l4 4 8-8" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    className: 'provider-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

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

// Format ETA for display
const formatETA = (minutes: number | null): string => {
  if (minutes === null) return 'Calculating...';
  if (minutes < 1) return 'Less than 1 minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

export function LiveTrackingMap({
  customerLat,
  customerLng,
  providerLat,
  providerLng,
  customerName = "Customer",
  providerName = "Provider",
  showETA = true
}: LiveTrackingMapProps) {
  // Track provider position history for trail effect
  const [positionHistory, setPositionHistory] = useState<[number, number][]>([]);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const MAX_TRAIL_POINTS = 15;

  // Use the dynamic ETA hook for real-time updates
  const { distance, speed, eta } = useProviderETA({
    providerLat,
    providerLng,
    customerLat,
    customerLng,
  });

  // Update position history when provider moves
  useEffect(() => {
    if (providerLat && providerLng) {
      const lastPos = lastPositionRef.current;
      // Only add point if position changed significantly (> 0.0001 degrees ~ 11m)
      if (!lastPos ||
        Math.abs(lastPos.lat - providerLat) > 0.0001 ||
        Math.abs(lastPos.lng - providerLng) > 0.0001) {
        lastPositionRef.current = { lat: providerLat, lng: providerLng };
        setPositionHistory(prev => {
          const newHistory = [...prev, [providerLat, providerLng] as [number, number]];
          // Keep only the last MAX_TRAIL_POINTS
          return newHistory.slice(-MAX_TRAIL_POINTS);
        });
      }
    }
  }, [providerLat, providerLng]);

  // Calculate bearing from provider to customer for car rotation
  const bearing = useMemo(() => {
    if (providerLat && providerLng) {
      return calculateBearing(providerLat, providerLng, customerLat, customerLng);
    }
    return 0;
  }, [providerLat, providerLng, customerLat, customerLng]);

  // Create provider icon with pulsing animation when moving
  const isMoving = speed !== null && speed > 0;
  const providerIcon = useMemo(() => createProviderIcon(isMoving, bearing), [isMoving, bearing]);

  return (
    <div className="space-y-4">
      {showETA && distance !== null && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Provider En Route</p>
                <p className="text-xs text-muted-foreground">Distance: {formatDistance(distance)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatETA(eta)}</p>
              <p className="text-xs text-muted-foreground">Estimated arrival</p>
            </div>
          </div>
          {speed !== null && (
            <div className="mt-3 pt-3 border-t border-primary/10 flex items-center gap-2 text-xs text-muted-foreground">
              <Gauge className="h-3.5 w-3.5" />
              <span>Current speed: {Math.round(speed)} km/h</span>
              {eta !== null && eta < 5 && (
                <span className="ml-auto flex items-center gap-1 text-primary font-medium">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Almost there!
                </span>
              )}
            </div>
          )}
        </Card>
      )}

      <div className="rounded-lg overflow-hidden border shadow-lg" style={{ height: '400px' }}>
        <MapContainer
          center={[customerLat, customerLng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          attributionControl={false}
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
            <>
              {/* Trail effect showing recent path */}
              {positionHistory.length >= 2 && positionHistory.map((pos, index) => {
                if (index === 0) return null;
                const prevPos = positionHistory[index - 1];
                const opacity = 0.15 + (index / positionHistory.length) * 0.4;
                const weight = 2 + (index / positionHistory.length) * 2;
                return (
                  <Polyline
                    key={`trail-${index}`}
                    positions={[prevPos, pos]}
                    pathOptions={{
                      color: '#3b82f6',
                      weight: weight,
                      opacity: opacity,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                );
              })}

              {/* Animated dotted route line between provider and customer */}
              <Polyline
                positions={[
                  [providerLat, providerLng],
                  [customerLat, customerLng]
                ]}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 3,
                  opacity: 0.8,
                  dashArray: '12, 8',
                  lineCap: 'round',
                  className: 'animated-route-line'
                }}
              />
              <Marker position={[providerLat, providerLng]} icon={providerIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">{providerName}</p>
                    <p className="text-xs text-muted-foreground">Provider Location</p>
                    {distance && <p className="text-xs mt-1">{formatDistance(distance)} away</p>}
                  </div>
                </Popup>
              </Marker>
            </>
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
