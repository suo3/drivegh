import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseProviderAvailabilityProps {
  userId: string | undefined;
}

export function useProviderAvailability({ userId }: UseProviderAvailabilityProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Fetch initial availability state and handle inconsistent state
  useEffect(() => {
    if (!userId) return;

    const fetchAvailability = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_available, current_lat, current_lng')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        // Detect inconsistent state: available but no location
        if (data.is_available && (!data.current_lat || !data.current_lng)) {
          // Auto-fix by triggering location capture
          setIsAvailable(false); // Temporarily set to false
          setTimeout(() => {
            // This will trigger goOnline which captures location
            toast.info('Please enable location to go online');
          }, 500);
        } else {
          setIsAvailable(data.is_available);
          if (data.current_lat && data.current_lng) {
            setCurrentLocation({ lat: data.current_lat, lng: data.current_lng });
          }
        }
      }
    };

    fetchAvailability();
  }, [userId]);

  // Start watching location when available
  useEffect(() => {
    if (!isAvailable || !userId) {
      // Clear watch when going offline
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        // Update location in database
        await supabase
          .from('profiles')
          .update({
            current_lat: latitude,
            current_lng: longitude,
            location_updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    setWatchId(id);

    return () => {
      navigator.geolocation.clearWatch(id);
    };
  }, [isAvailable, userId]);

  const goOnline = useCallback(async () => {
    if (!userId) return;
    setIsUpdating(true);

    try {
      // First get current location
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          const { error } = await supabase
            .from('profiles')
            .update({
              is_available: true,
              current_lat: latitude,
              current_lng: longitude,
              location_updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (error) {
            toast.error('Failed to go online');
          } else {
            setIsAvailable(true);
            setCurrentLocation({ lat: latitude, lng: longitude });
            toast.success('You are now online and visible to customers');
          }
          setIsUpdating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Please enable location services to go online');
          setIsUpdating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (error) {
      toast.error('Failed to update availability');
      setIsUpdating(false);
    }
  }, [userId]);

  const goOffline = useCallback(async () => {
    if (!userId) return;
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_available: false,
          current_lat: null,
          current_lng: null,
          location_updated_at: null,
        })
        .eq('id', userId);

      if (error) {
        toast.error('Failed to go offline');
      } else {
        setIsAvailable(false);
        setCurrentLocation(null);
        toast.success('You are now offline');
      }
    } catch (error) {
      toast.error('Failed to update availability');
    } finally {
      setIsUpdating(false);
    }
  }, [userId]);

  const toggleAvailability = useCallback(() => {
    if (isAvailable) {
      goOffline();
    } else {
      goOnline();
    }
  }, [isAvailable, goOnline, goOffline]);

  return {
    isAvailable,
    isUpdating,
    currentLocation,
    goOnline,
    goOffline,
    toggleAvailability,
  };
}
