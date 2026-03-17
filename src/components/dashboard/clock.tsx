'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../layout/app-provider';

export default function Clock() {
  const { appSettings } = useApp();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: appSettings.timeFormat === '12-hour',
    });
  };

  return (
    <span className="text-xs font-medium text-muted-foreground tabular-nums whitespace-nowrap">
      {time ? formatTime(time) : '...'}
    </span>
  );
}
