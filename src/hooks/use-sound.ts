'use client';

import { useCallback, useRef, useEffect } from 'react';

// Use a singleton for AudioContext to avoid multiple instances
let audioCtx: AudioContext | null = null;

const getAudioCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const useSound = () => {
  const bufferCache = useRef<Record<string, AudioBuffer>>({});
  const fileNameMap = {
    good: 'good.mp3',
    overdue: 'overdue.mp3',
    welcome: 'welcome.mp3',
    reminder: 'reminder.mp3',
    notification: 'good.mp3',
    generations: 'generations.mp3'
  };

  useEffect(() => {
    const ctx = getAudioCtx();
    if (!ctx) return;

    // Preload sounds
    const sounds = ['good.mp3', 'overdue.mp3', 'welcome.mp3', 'reminder.mp3', 'generations.mp3'];
    sounds.forEach(async (file) => {
      if (bufferCache.current[file]) return;
      
      try {
        const response = await fetch(`/sounds/${file}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        bufferCache.current[file] = audioBuffer;
      } catch (error) {
        console.warn(`Failed to preload sound: ${file}`, error);
      }
    });

    const handleInteraction = () => {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          console.log('[Sound] AudioContext resumed successfully');
          // Play a silent buffer to "unlock" audio on mobile (especially iOS Safari)
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        }).catch(err => {
          console.error('[Sound] Failed to resume AudioContext:', err);
        });
      } else {
        // Already running, just do the silent play to be safe
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
      
      // Remove listeners after first interaction
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const playSound = useCallback(async (soundName: keyof typeof fileNameMap) => {
    const ctx = getAudioCtx();
    if (!ctx) return;

    // console.log(`[Sound] Attempting to play: ${soundName}`);

    // Resume context if it's suspended (browsers auto-suspend AudioContext)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e);
      }
    }

    const fileName = fileNameMap[soundName];
    let buffer = bufferCache.current[fileName];

    if (!buffer) {
      try {
        const response = await fetch(`/sounds/${fileName}`);
        const arrayBuffer = await response.arrayBuffer();
        buffer = await ctx.decodeAudioData(arrayBuffer);
        bufferCache.current[fileName] = buffer;
      } catch (error) {
        console.error(`Failed to play sound: ${fileName}`, error);
        return;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Create a gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5; // Default volume

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start(0);
  }, []);

  return { playSound };
};