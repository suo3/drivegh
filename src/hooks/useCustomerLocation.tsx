import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseCustomerLocationProps {
  customerId: string | null;
  isActive: boolean; // Only track when actively requesting service
}

export function useCustomerLocation({ customerId, isActive }: UseCustomerLocationProps) {
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!customerId || !isActive) {
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
        // Update location in profiles table so it's available for provider search
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            current_lat: lat,
            current_lng: lng,
            location_updated_at: new Date().toISOString(),
          })
          .eq('id', customerId);
        
        if (profileError) {
          console.error('Error updating customer location in profiles:', profileError);
        } else {
          console.log('Customer location updated in profiles:', { lat, lng, customerId });
        }
      } catch (error) {
        console.error('Error updating customer location:', error);
      }
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        lastPositionRef.current = { lat: latitude, lng: longitude };
        console.log('Customer position updated:', { latitude, longitude });
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

    // Update database every 30 seconds
    updateIntervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        updateLocation(lastPositionRef.current.lat, lastPositionRef.current.lng);
      }
    }, 30000); // Update every 30 seconds

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [customerId, isActive]);
}