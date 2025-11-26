import { useRef, useCallback } from 'react';

export const useSoundAlert = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<number>(0);

  const playProximityAlert = useCallback(() => {
    // Prevent playing sound too frequently (minimum 30 seconds between alerts)
    const now = Date.now();
    if (now - lastPlayedRef.current < 30000) {
      return;
    }
    lastPlayedRef.current = now;

    try {
      // Create AudioContext if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      // Create a pleasant three-tone alert sound
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const currentTime = audioContext.currentTime;
      
      // Three ascending tones for proximity alert
      playTone(523.25, currentTime, 0.2); // C5
      playTone(659.25, currentTime + 0.25, 0.2); // E5
      playTone(783.99, currentTime + 0.5, 0.3); // G5
      
    } catch (error) {
      console.error('Error playing sound alert:', error);
    }
  }, []);

  const playArrivalAlert = useCallback(() => {
    // Prevent playing sound too frequently
    const now = Date.now();
    if (now - lastPlayedRef.current < 30000) {
      return;
    }
    lastPlayedRef.current = now;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const currentTime = audioContext.currentTime;
      
      // Four ascending tones for arrival - more celebratory
      playTone(523.25, currentTime, 0.15); // C5
      playTone(659.25, currentTime + 0.18, 0.15); // E5
      playTone(783.99, currentTime + 0.36, 0.15); // G5
      playTone(1046.50, currentTime + 0.54, 0.4); // C6
      
    } catch (error) {
      console.error('Error playing sound alert:', error);
    }
  }, []);

  return {
    playProximityAlert,
    playArrivalAlert,
  };
};
