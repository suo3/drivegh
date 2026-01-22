import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseProviderLocationProps {
  requestId: string | null;
  isActive: boolean; // Only track when provider is en route or in progress
}

export function useProviderLocation({ requestId, isActive }: UseProviderLocationProps) {
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!requestId || !isActive) {
      // Stop tracking if not active
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    // Function to update location in database
    const updateLocation = async (lat: number, lng: number) => {
      try {
        const { error } = await supabase
          .from('service_requests')
          .update({
            provider_lat: lat,
            provider_lng: lng,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (error) {
          console.error('Error updating provider location:', error);
        } else {
          console.log('Provider location updated:', { lat, lng });
        }
      } catch (error) {
        console.error('Error updating provider location:', error);
      }
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        lastPositionRef.current = { lat: latitude, lng: longitude };
        console.log('Provider position updated:', { latitude, longitude });
      },
      (error) => {
        console.error('Error getting location:', error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied. Please enable location access.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Update database every 10 seconds
    updateIntervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        updateLocation(lastPositionRef.current.lat, lastPositionRef.current.lng);
      }
    }, 10000); // Update every 10 seconds

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [requestId, isActive]);
}
