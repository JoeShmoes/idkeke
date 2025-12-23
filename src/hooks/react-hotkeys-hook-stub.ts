// Stub module for react-hotkeys-hook to prevent webpack errors
// This file is aliased in next.config.mjs so webpack can always resolve it
import { useEffect } from 'react';

type HotkeyCallback = (event?: KeyboardEvent) => void;
type HotkeyOptions = {
  enableOnFormTags?: boolean;
  enableOnContentEditable?: boolean;
  preventDefault?: boolean;
  scopes?: string[];
};

// Fallback implementation - keyboard shortcuts won't work but app won't crash
export const useHotkeys = (
  keys: string,
  callback: HotkeyCallback,
  options?: HotkeyOptions
) => {
  useEffect(() => {
    // Keyboard shortcuts disabled when react-hotkeys-hook is not installed
    // To enable shortcuts, install: npm install react-hotkeys-hook
  }, [keys, callback, options]);
};
