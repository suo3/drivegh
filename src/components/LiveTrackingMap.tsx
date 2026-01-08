import { useEffect, useState, useMemo } from 'react';
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

// Create provider icon - animated car when moving, static marker when stopped
const createProviderIcon = (isMoving: boolean) => {
  if (isMoving) {
    // Animated moving car icon
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
            <!-- Pulse rings -->
            <circle class="pulse-ring-1" cx="25" cy="25" r="12" fill="#3b82f6" opacity="0.4"/>
            <circle class="pulse-ring-2" cx="25" cy="25" r="12" fill="#3b82f6" opacity="0.3"/>
            <!-- Car body -->
            <g class="car-animate">
              <!-- Shadow -->
              <ellipse cx="25" cy="38" rx="10" ry="3" fill="rgba(0,0,0,0.2)"/>
              <!-- Car base -->
              <rect x="12" y="22" width="26" height="12" rx="3" fill="#3b82f6" stroke="white" stroke-width="1.5"/>
              <!-- Car top -->
              <path d="M16 22 L19 14 L31 14 L34 22" fill="#3b82f6" stroke="white" stroke-width="1.5"/>
              <!-- Windows -->
              <path d="M18 21 L20 15 L25 15 L25 21 Z" fill="#60a5fa"/>
              <path d="M26 21 L26 15 L30 15 L32 21 Z" fill="#60a5fa"/>
              <!-- Headlights -->
              <rect x="35" y="25" width="3" height="3" rx="1" fill="#fbbf24"/>
              <rect x="12" y="25" width="3" height="3" rx="1" fill="#fbbf24"/>
              <!-- Wheels -->
              <circle cx="18" cy="34" r="4" fill="#1e293b" stroke="white" stroke-width="1"/>
              <circle cx="32" cy="34" r="4" fill="#1e293b" stroke="white" stroke-width="1"/>
              <circle cx="18" cy="34" r="1.5" fill="#94a3b8"/>
              <circle cx="32" cy="34" r="1.5" fill="#94a3b8"/>
            </g>
          </svg>
        </div>
      `,
      className: 'provider-car-icon',
      iconSize: [50, 50],
      iconAnchor: [25, 35],
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
  // Use the dynamic ETA hook for real-time updates
  const { distance, speed, eta } = useProviderETA({
    providerLat,
    providerLng,
    customerLat,
    customerLng,
  });

  // Create provider icon with pulsing animation when moving
  const isMoving = speed !== null && speed > 0;
  const providerIcon = useMemo(() => createProviderIcon(isMoving), [isMoving]);

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
