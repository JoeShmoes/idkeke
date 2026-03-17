'use client';

import { useCallback } from 'react';

export const useSound = () => {
  const playSound = useCallback((soundName: 'good' | 'overdue' | 'welcome' | 'reminder') => {
    try {
      const fileNameMap = {
        good: 'Good.mp3',
        overdue: 'Overdue.mp3',
        welcome: 'Welcome.mp3',
        reminder: 'Reminder.mp3'
      };
      
      const audio = new Audio(`/sounds/${fileNameMap[soundName]}`);
      audio.volume = 0.3; // Set volume to 30%
      audio.play().catch(() => {
        // Silently fail if audio can't play (user interaction required, etc.)
      });
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 5000); // Increased timeout to allow longer sounds to play
    } catch (error) {
      // Silently fail
    }
  }, []);

  return { playSound };
};