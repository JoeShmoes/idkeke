import React, { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onNewEvent: () => void;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
  onToday: () => void;
  onViewChange: (view: 'day' | 'week' | 'month') => void;
  onClosePanel: () => void;
}

export default function KeyboardShortcuts({
  onNewEvent,
  onNavigateNext,
  onNavigatePrev,
  onToday,
  onViewChange,
  onClosePanel,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
          return;
        }
      }

      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNewEvent();
      }

      if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNavigateNext();
      }
      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNavigatePrev();
      }

      if (e.key === 't' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onToday();
      }

      if (e.key === '1') {
        e.preventDefault();
        onViewChange('day');
      }
      if (e.key === '2') {
        e.preventDefault();
        onViewChange('week');
      }
      if (e.key === '3') {
        e.preventDefault();
        onViewChange('month');
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClosePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewEvent, onNavigateNext, onNavigatePrev, onToday, onViewChange, onClosePanel]);

  return null;
}

