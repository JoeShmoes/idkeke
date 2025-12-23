'use client';

import { useCallback } from 'react';

export const useSound = () => {
  const playSound = useCallback((soundName: 'good' | 'overdue' | 'welcome') => {
    try {
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = 0.3; // Set volume to 30%
      audio.play().catch(() => {
        // Silently fail if audio can't play (user interaction required, etc.)
      });
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 2000);
    } catch (error) {
      // Silently fail
    }
  }, []);

  return { playSound };
};