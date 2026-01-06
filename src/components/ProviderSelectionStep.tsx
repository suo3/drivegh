import { useState, useEffect } from 'react';
import { Loader2, MapPin, AlertCircle, Users, Zap } from 'lucide-react';
import { useNearbyProviders } from '@/hooks/useNearbyProviders';
import { ProviderCard } from '@/components/ProviderCard';
import { ProviderSelectionMap } from '@/components/ProviderSelectionMap';
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

  // No GPS coordinates - show message and let user proceed
  if (!customerLat || !customerLng) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Alert className="bg-primary/5 border-primary/20">
          <MapPin className="h-4 w-4 text-primary" />
          <AlertDescription>
            Location not available. Submit your request and we'll assign a provider automatically.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        <ProviderSelectionMap
          customerLat={customerLat}
          customerLng={customerLng}
          providers={[]}
          selectedProviderId={null}
          onProviderSelect={() => {}}
          isSearching={true}
        />
        <div className="flex items-center gap-2 justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Finding nearby providers...</span>
        </div>
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

  // No nearby providers - show simple message and let user proceed
  if (!hasNearbyProviders) {
    return (
      <div className="space-y-4 animate-fade-in">
        <ProviderSelectionMap
          customerLat={customerLat}
          customerLng={customerLng}
          providers={[]}
          selectedProviderId={null}
          onProviderSelect={() => {}}
          isSearching={false}
        />
        
        <Alert className="bg-primary/5 border-primary/20">
          <Zap className="h-4 w-4 text-primary" />
          <AlertDescription>
            No providers nearby right now. Submit your request and we'll assign one automatically.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show nearby providers for selection
  return (
    <div className="space-y-3 animate-fade-in">
      <ProviderSelectionMap
        customerLat={customerLat}
        customerLng={customerLng}
        providers={providers}
        selectedProviderId={selectedProviderId}
        onProviderSelect={(id) => onProviderSelect(id)}
      />
      
      <Label className="text-sm font-bold flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        Choose a Provider ({providers.length} nearby)
      </Label>
      <p className="text-xs text-muted-foreground">
        Tap a provider on the map or select from the list below
      </p>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
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
