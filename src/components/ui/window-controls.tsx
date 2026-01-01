'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/components/layout/app-provider';

export default function WindowControls() {
  const [isElectron, setIsElectron] = useState(false);
  const { appSettings } = useApp();

  useEffect(() => {
    // Check if running in Electron
    if (typeof window !== 'undefined' && (window as any).electron) {
      setIsElectron(true);
    }
  }, []);

  useEffect(() => {
    if (isElectron && (window as any).electron) {
        // Update overlay color based on theme
        const isDark = appSettings.theme === 'dark' || appSettings.theme.includes('dark') || appSettings.theme === 'matrix';
        
        // Symbols should be white in dark mode, black in light mode
        const symbolColor = isDark ? '#ffffff' : '#000000';
        
        // Use transparent background so the div underneath (which matches the theme) shows through
        const backgroundColor = '#00000000'; 

        (window as any).electron.updateTitleBarOverlay({
            symbolColor: symbolColor,
            color: backgroundColor,
            height: 32
        });
    }
  }, [appSettings.theme, isElectron]);

  if (!isElectron) return null;

  return (
    <div 
      className="h-[32px] w-full bg-background flex-shrink-0 z-[9999]"
      style={{ WebkitAppRegion: 'drag' } as any}
    />
  );
}
