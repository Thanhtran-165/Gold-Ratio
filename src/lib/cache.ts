interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ServerCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const serverCache = new ServerCache();

export const clientCache = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  },

  set<T>(key: string, data: T, ttlMs: number): void {
    if (typeof window === 'undefined') return;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };

    localStorage.setItem(key, JSON.stringify(entry));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  },

  generateKey(parts: string[]): string {
    return parts.join(':');
  },
};
