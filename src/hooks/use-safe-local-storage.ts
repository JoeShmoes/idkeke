
import { useState, useEffect, useCallback } from 'react';

const getScopedKey = (baseKey: string) => {
  if (typeof window === 'undefined') return null;
  const WORKSPACE_KEY_HOLDER = 'contextflow-workspace-key'; // Consider moving this to a config file
  const workspaceKey = localStorage.getItem(WORKSPACE_KEY_HOLDER);
  return workspaceKey ? `${workspaceKey}_${baseKey}` : baseKey; // Fallback to baseKey if no workspace
};

export function useSafeLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    const scopedKey = getScopedKey(key);
    if (!scopedKey) return;

    try {
      const item = window.localStorage.getItem(scopedKey);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${scopedKey}":`, error);
    }
  }, [key]);

  const setValueAndStore = useCallback((newValue: T | ((prevState: T) => T)) => {
    const scopedKey = getScopedKey(key);
    if (!scopedKey) return;

    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      window.localStorage.setItem(scopedKey, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${scopedKey}":`, error);
    }
  }, [key, value]);

  return [value, setValueAndStore as React.Dispatch<React.SetStateAction<T>>];
}
