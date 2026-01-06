import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance } from '@/lib/distance';

interface Provider {
  provider_id: string;
  full_name: string;
  current_lat: number;
  current_lng: number;
  distance_km: number;
  avg_rating: number;
  is_available: boolean;
}

interface ProviderSelectionMapProps {
  customerLat: number;
  customerLng: number;
  providers: Provider[];
  selectedProviderId: string | null;
  onProviderSelect: (providerId: string) => void;
  isSearching?: boolean;
}

// Customer location icon (pulsing red dot)
const customerIcon = new DivIcon({
  className: 'customer-marker',
  html: `
    <div class="relative">
      <div class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" style="width: 24px; height: 24px;"></div>
      <div class="relative bg-red-500 rounded-full border-4 border-white shadow-lg" style="width: 24px; height: 24px;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Provider icon (car/vehicle style)
const createProviderIcon = (isSelected: boolean, isAvailable: boolean) => new DivIcon({
  className: 'provider-marker',
  html: `
    <div class="relative transition-transform ${isSelected ? 'scale-125' : ''}" style="width: 40px; height: 40px;">
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="${isSelected ? 'bg-primary' : isAvailable ? 'bg-blue-600' : 'bg-gray-400'} rounded-full p-2 shadow-lg border-2 border-white transition-all ${isSelected ? 'ring-4 ring-primary/30' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c-.1.2-.1.4-.1.6v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapBoundsUpdater({ customerLat, customerLng, providers }: {
  customerLat: number;
  customerLng: number;
  providers: Provider[];
}) {
  const map = useMap();

  useEffect(() => {
    if (providers.length > 0) {
      const points: [number, number][] = [
        [customerLat, customerLng],
        ...providers.map(p => [p.current_lat, p.current_lng] as [number, number])
      ];
      map.fitBounds(points, { padding: [50, 50], maxZoom: 14 });
    } else {
      map.setView([customerLat, customerLng], 13);
    }
  }, [map, customerLat, customerLng, providers]);

  return null;
}

export function ProviderSelectionMap({
  customerLat,
  customerLng,
  providers,
  selectedProviderId,
  onProviderSelect,
  isSearching = false,
}: ProviderSelectionMapProps) {
  return (
    <div className="relative rounded-xl overflow-hidden border shadow-lg" style={{ height: '200px' }}>
      {/* Searching overlay */}
      {isSearching && (
        <div className="absolute inset-0 z-[1000] bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary/30 rounded-full"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-foreground">Finding providers...</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[customerLat, customerLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Search radius circle */}
        <Circle
          center={[customerLat, customerLng]}
          radius={5000}
          pathOptions={{
            color: 'hsl(var(--primary))',
            fillColor: 'hsl(var(--primary))',
            fillOpacity: 0.05,
            weight: 1,
            dashArray: '5, 5',
          }}
        />

        {/* Customer marker */}
        <Marker position={[customerLat, customerLng]} icon={customerIcon}>
          <Popup>
            <div className="text-center p-1">
              <p className="font-semibold text-sm">Your Location</p>
            </div>
          </Popup>
        </Marker>

        {/* Provider markers */}
        {providers.map((provider) => (
          <Marker
            key={provider.provider_id}
            position={[provider.current_lat, provider.current_lng]}
            icon={createProviderIcon(
              selectedProviderId === provider.provider_id,
              provider.is_available
            )}
            eventHandlers={{
              click: () => onProviderSelect(provider.provider_id),
            }}
          >
            <Popup>
              <div className="text-center p-1 min-w-[120px]">
                <p className="font-semibold text-sm">{provider.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(provider.distance_km)} away
                </p>
                {provider.avg_rating > 0 && (
                  <p className="text-xs text-amber-600">
                    ⭐ {provider.avg_rating.toFixed(1)}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <MapBoundsUpdater
          customerLat={customerLat}
          customerLng={customerLng}
          providers={providers}
        />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs flex items-center gap-3 border shadow-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span>Providers</span>
        </div>
      </div>
    </div>
  );
}
