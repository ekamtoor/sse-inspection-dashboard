"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Used by every "use client" component that
// reads or mutates Supabase state. Cookies are managed by @supabase/ssr so
// the same session is visible to server components and middleware.
//
// Hypeify integration: when Hypeify's auth lands, the URL/key here come from
// the Hypeify Supabase project, not the SSE project. The shape stays the
// same; only the env vars change.

let cached = null;

export function supabaseBrowser() {
  if (typeof window === "undefined") {
    // Calling this on the server would silently mis-handle cookies. Force
    // the caller to use lib/supabase/server.js instead.
    throw new Error(
      "supabaseBrowser() must only be called in the browser. " +
        "On the server, use getSupabaseServer() from lib/supabase/server.js."
    );
  }
  if (!cached) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Set them in .env.local for dev, and in Vercel project settings for production."
      );
    }
    cached = createBrowserClient(url, key);
  }
  return cached;
}

// Convenience export so existing call sites that imported `{ supabase }` keep
// working. Lazy proxy so we don't trigger the env check until something is
// actually accessed (which only happens client-side).
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return supabaseBrowser()[prop];
    },
  }
);
