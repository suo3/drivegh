import { useEffect, useState, useRef } from 'react';
import { calculateDistance } from '@/lib/distance';

interface UseProviderETAProps {
  providerLat: number | null | undefined;
  providerLng: number | null | undefined;
  customerLat: number | null | undefined;
  customerLng: number | null | undefined;
}

interface ETAData {
  distance: number | null;
  speed: number | null; // km/h
  eta: number | null; // minutes
}

export function useProviderETA({
  providerLat,
  providerLng,
  customerLat,
  customerLng,
}: UseProviderETAProps): ETAData {
  const [distance, setDistance] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  
  const previousPositionRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const speedSamplesRef = useRef<number[]>([]);

  useEffect(() => {
    if (!providerLat || !providerLng || !customerLat || !customerLng) {
      setDistance(null);
      setSpeed(null);
      setEta(null);
      return;
    }

    // Calculate current distance to customer
    const currentDistance = calculateDistance(
      customerLat,
      customerLng,
      providerLat,
      providerLng
    );
    setDistance(currentDistance);

    const now = Date.now();

    // Calculate speed based on movement
    if (previousPositionRef.current) {
      const { lat: prevLat, lng: prevLng, timestamp: prevTime } = previousPositionRef.current;
      
      // Calculate distance moved
      const distanceMoved = calculateDistance(prevLat, prevLng, providerLat, providerLng);
      
      // Calculate time elapsed in hours
      const timeElapsed = (now - prevTime) / (1000 * 60 * 60);
      
      // Only update speed if provider has moved significantly and time elapsed is reasonable
      if (distanceMoved > 0.01 && timeElapsed > 0 && timeElapsed < 0.05) { // More than 10m moved, less than 3 minutes elapsed
        const currentSpeed = distanceMoved / timeElapsed; // km/h
        
        // Add to samples (keep last 10 samples for smoothing)
        speedSamplesRef.current.push(currentSpeed);
        if (speedSamplesRef.current.length > 10) {
          speedSamplesRef.current.shift();
        }
        
        // Calculate average speed from samples
        const avgSpeed = speedSamplesRef.current.reduce((sum, s) => sum + s, 0) / speedSamplesRef.current.length;
        setSpeed(avgSpeed);
        
        // Calculate ETA in minutes
        if (avgSpeed > 0) {
          const etaMinutes = (currentDistance / avgSpeed) * 60;
          setEta(etaMinutes);
        }
      }
    } else if (speedSamplesRef.current.length === 0) {
      // If we don't have speed data yet, use a default speed of 40 km/h for initial estimate
      const defaultSpeed = 40;
      setSpeed(defaultSpeed);
      const etaMinutes = (currentDistance / defaultSpeed) * 60;
      setEta(etaMinutes);
    }

    // Update previous position
    previousPositionRef.current = {
      lat: providerLat,
      lng: providerLng,
      timestamp: now,
    };
  }, [providerLat, providerLng, customerLat, customerLng]);

  return { distance, speed, eta };
}
