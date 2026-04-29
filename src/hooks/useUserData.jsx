import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { SEED_SITES, SEED_SCHEDULED, SEED_ISSUES, SEED_CORPORATE } from "../data/seed.js";

const KEYS = [
  "sites",
  "scheduled",
  "issues",
  "reports",
  "corporate",
  "internal_audits",
  "active_inspection",
  "active_internal",
  "view",
];

const SEEDS = {
  sites: SEED_SITES,
  scheduled: SEED_SCHEDULED,
  issues: SEED_ISSUES,
  reports: [],
  corporate: SEED_CORPORATE,
  internal_audits: [],
  active_inspection: null,
  active_internal: null,
  view: "dashboard",
};

// Photos are blob URLs (URL.createObjectURL) that don't survive a refresh — and
// pushing them to Postgres just bloats the row with dead pointers. Strip them
// from the in-progress walkthroughs before persisting; cross-device photo sync
// is a separate Supabase Storage feature.
function stripPhotos(value) {
  if (!value) return value;
  return { ...value, photos: {} };
}

const WRITE_TRANSFORMS = {
  active_inspection: stripPhotos,
  active_internal: stripPhotos,
};

const DataContext = createContext(null);

export function DataProvider({ user, children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const latestRef = useRef(null);
  const writeTimerRef = useRef(null);
  const lastSentTokenRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    (async () => {
      const { data: row, error: readErr } = await supabase
        .from("user_data")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (readErr) {
        setError(readErr.message);
        return;
      }

      if (row) {
        const loaded = {};
        for (const k of KEYS) loaded[k] = row[k] ?? SEEDS[k];
        latestRef.current = loaded;
        setData(loaded);
        return;
      }

      const seed = { ...SEEDS };
      const { error: insertErr } = await supabase
        .from("user_data")
        .insert({ user_id: user.id, ...seed });
      if (cancelled) return;
      if (insertErr && insertErr.code !== "23505") {
        setError(insertErr.message);
        return;
      }
      latestRef.current = seed;
      setData(seed);
    })();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`user_data:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_data",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new?.sync_token === lastSentTokenRef.current) return;
          const next = {};
          for (const k of KEYS) next[k] = payload.new?.[k] ?? SEEDS[k];

          // Photos are device-local. If the in-progress walkthrough still
          // matches the same id locally, keep our captured photos rather than
          // letting the cross-device echo wipe them.
          const localActive = latestRef.current?.active_inspection;
          if (
            next.active_inspection &&
            localActive &&
            next.active_inspection.id === localActive.id &&
            localActive.photos
          ) {
            next.active_inspection = { ...next.active_inspection, photos: localActive.photos };
          }
          const localOps = latestRef.current?.active_internal;
          if (
            next.active_internal &&
            localOps &&
            next.active_internal.id === localOps.id &&
            localOps.photos
          ) {
            next.active_internal = { ...next.active_internal, photos: localOps.photos };
          }

          latestRef.current = next;
          setData(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  useEffect(
    () => () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    },
    []
  );

  const setKey = useCallback(
    (key, valueOrUpdater) => {
      setData((prev) => {
        if (!prev) return prev;
        const nextVal =
          typeof valueOrUpdater === "function" ? valueOrUpdater(prev[key]) : valueOrUpdater;
        const next = { ...prev, [key]: nextVal };
        latestRef.current = next;

        if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
        writeTimerRef.current = setTimeout(async () => {
          const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          lastSentTokenRef.current = token;
          const payload = { sync_token: token, updated_at: new Date().toISOString() };
          for (const k of KEYS) {
            const transform = WRITE_TRANSFORMS[k];
            payload[k] = transform ? transform(latestRef.current[k]) : latestRef.current[k];
          }
          const { error: writeErr } = await supabase
            .from("user_data")
            .update(payload)
            .eq("user_id", user.id);
          if (writeErr) setError(writeErr.message);
        }, 500);

        return next;
      });
    },
    [user.id]
  );

  return (
    <DataContext.Provider value={{ data, setKey, error }}>{children}</DataContext.Provider>
  );
}

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDataContext must be used inside <DataProvider>");
  return ctx;
}

export function useUserDataKey(key) {
  const { data, setKey } = useDataContext();
  const setter = useCallback((v) => setKey(key, v), [key, setKey]);
  return [data?.[key], setter];
}
