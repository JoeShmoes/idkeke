import { useState, useEffect, useCallback } from 'react';

export function useSafeLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // This effect handles the initial loading of data from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !key) {
      setIsLoaded(true);
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (
          typeof parsed === 'object' && parsed !== null && 
          typeof defaultValue === 'object' && defaultValue !== null && 
          !Array.isArray(defaultValue)
        ) {
          setValue({ ...defaultValue, ...parsed });
        } else {
          setValue(parsed);
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  // This effect synchronizes the state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && key && isLoaded) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
        window.dispatchEvent(new CustomEvent('local-storage-error', { detail: { key, error } }));
      }
    }
  }, [key, value, isLoaded]);

  const setValueAndStore = useCallback((newValue: T | ((prevState: T) => T)) => {
    setValue(newValue);
  }, []);

  return [value, setValueAndStore as React.Dispatch<React.SetStateAction<T>>, isLoaded];
}
