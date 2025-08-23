import { useCallback } from 'react';

interface CacheOptions {
  duration?: number; // milliseconds
  key: string;
}

interface CacheData<T> {
  data: T;
  timestamp: number;
}

export function useCache() {
  const getCachedData = useCallback(<T>(key: string, duration: number): T | null => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp }: CacheData<T> = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp < duration) {
        return data;
      }
      
      localStorage.removeItem(key);
      return null;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }, []);

  const setCachedData = useCallback(<T>(key: string, data: T): void => {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const clearCache = useCallback((key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const clearAllCache = useCallback((): void => {
    try {
      localStorage.clear();
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    clearAllCache
  };
}