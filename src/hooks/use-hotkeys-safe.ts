import { useHotkeys as useHotkeysOriginal } from 'react-hotkeys-hook';

export const useHotkeys = (keys: string, callback: (event: KeyboardEvent) => void, options: any = {}) => {
  return useHotkeysOriginal(keys, callback, options);
};
