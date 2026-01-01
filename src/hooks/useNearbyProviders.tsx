import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NearbyProvider {
  provider_id: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  years_experience: number;
  is_available: boolean;
  current_lat: number;
  current_lng: number;
  distance_km: number;
  avg_rating: number;
  total_reviews: number;
}

interface UseNearbyProvidersProps {
  customerLat: number | null;
  customerLng: number | null;
  radiusKm?: number;
  enabled?: boolean;
}

export function useNearbyProviders({
  customerLat,
  customerLng,
  radiusKm = 5,
  enabled = true,
}: UseNearbyProvidersProps) {
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [closestProvider, setClosestProvider] = useState<{ provider_id: string; full_name: string; distance_km: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || customerLat === null || customerLng === null) {
      setProviders([]);
      setClosestProvider(null);
      return;
    }

    const fetchProviders = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch nearby providers within radius
        const { data: nearbyData, error: nearbyError } = await supabase.rpc(
          'find_nearby_providers',
          {
            customer_lat: customerLat,
            customer_lng: customerLng,
            radius_km: radiusKm,
          }
        );

        if (nearbyError) {
          console.error('Error fetching nearby providers:', nearbyError);
          setError('Failed to find nearby providers');
        } else {
          setProviders(nearbyData || []);
        }

        // If no nearby providers, find the closest one anywhere
        if (!nearbyData || nearbyData.length === 0) {
          const { data: closestData, error: closestError } = await supabase.rpc(
            'find_closest_provider',
            {
              customer_lat: customerLat,
              customer_lng: customerLng,
            }
          );

          if (closestError) {
            console.error('Error fetching closest provider:', closestError);
          } else if (closestData && closestData.length > 0) {
            setClosestProvider(closestData[0]);
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [customerLat, customerLng, radiusKm, enabled]);

  return {
    providers,
    closestProvider,
    hasNearbyProviders: providers.length > 0,
    loading,
    error,
    refetch: () => {
      if (customerLat !== null && customerLng !== null) {
        setLoading(true);
        // Trigger refetch by updating state
      }
    },
  };
}
