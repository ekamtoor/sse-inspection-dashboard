import { useCallback, useEffect, useState } from "react";

// Persists state to localStorage. Survives page refresh per device.
// Replace internals with Supabase / Firebase / your backend for cross-device sync.

export function useStoredState(key, seed) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      // localStorage unavailable / parse failed — fall through to seed
    }
    return seed;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // out of quota or disabled — silent fail
    }
  }, [key, val]);

  const update = useCallback((nv) => {
    setVal((prev) => (typeof nv === "function" ? nv(prev) : nv));
  }, []);

  return [val, update];
}
