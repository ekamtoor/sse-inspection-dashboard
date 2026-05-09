import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client for route handlers, server components, and
// middleware. Reads/writes the session cookie so SSR and the browser stay
// in sync. Always create a fresh client per request — do not memoize.
export async function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        try {
          for (const c of toSet) store.set(c.name, c.value, c.options);
        } catch {
          // setAll fires from server components in some Next.js code paths
          // where cookies are read-only; ignore. Middleware handles writes.
        }
      },
    },
  });
}
