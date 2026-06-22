export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue;
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  remove(key: string): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  },
};
