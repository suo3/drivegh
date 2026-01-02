import { useState, useEffect } from 'react';
import { Loader2, MapPin, AlertCircle, Users, Zap } from 'lucide-react';
import { useNearbyProviders } from '@/hooks/useNearbyProviders';
import { ProviderCard } from '@/components/ProviderCard';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface ProviderSelectionStepProps {
  customerLat: number | null;
  customerLng: number | null;
  selectedProviderId: string | null;
  onProviderSelect: (providerId: string | null) => void;
  onAutoAssign: (providerId: string | null) => void;
}

export function ProviderSelectionStep({
  customerLat,
  customerLng,
  selectedProviderId,
  onProviderSelect,
  onAutoAssign,
}: ProviderSelectionStepProps) {
  const { providers, closestProvider, hasNearbyProviders, loading, error } = useNearbyProviders({
    customerLat,
    customerLng,
    radiusKm: 5,
    enabled: customerLat !== null && customerLng !== null,
  });

  const [autoAssignTriggered, setAutoAssignTriggered] = useState(false);

  // Trigger auto-assign when no nearby providers
  useEffect(() => {
    if (!loading && !hasNearbyProviders && closestProvider && !autoAssignTriggered) {
      setAutoAssignTriggered(true);
      onAutoAssign(closestProvider.provider_id);
    }
  }, [loading, hasNearbyProviders, closestProvider, autoAssignTriggered, onAutoAssign]);

  if (!customerLat || !customerLng) {
    return (
      <Alert variant="destructive" className="animate-fade-in">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          GPS location is required to find nearby providers. Please go back and enable location services.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Finding nearby providers...</span>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="animate-fade-in">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No nearby providers - auto-assign mode
  if (!hasNearbyProviders) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Alert className="bg-amber-50 border-amber-200">
          <Zap className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            No providers within 5km. We'll automatically assign the closest available provider.
          </AlertDescription>
        </Alert>

        {closestProvider && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Closest Provider</span>
            </div>
            <p className="text-sm">
              <span className="font-medium">{closestProvider.full_name}</span> is{' '}
              <span className="text-primary font-semibold">
                {closestProvider.distance_km.toFixed(1)}km
              </span>{' '}
              away and will be assigned to your request.
            </p>
          </div>
        )}

        {!closestProvider && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="font-semibold text-sm">Finding Provider</span>
            </div>
            <p className="text-sm text-muted-foreground">
              We'll automatically assign the best available provider to your request.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show nearby providers for selection
  return (
    <div className="space-y-3 animate-fade-in">
      <Label className="text-sm font-bold flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        Choose a Provider ({providers.length} nearby)
      </Label>
      <p className="text-xs text-muted-foreground">
        Select a provider within 5km of your location
      </p>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.provider_id}
            provider={provider}
            isSelected={selectedProviderId === provider.provider_id}
            onSelect={onProviderSelect}
          />
        ))}
      </div>

      {!selectedProviderId && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Please select a provider to continue
        </p>
      )}
    </div>
  );
}
