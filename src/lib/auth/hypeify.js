"use client";

import { supabaseBrowser } from "../supabase/client.js";

// =====================================================================
// Hypeify auth shim
// =====================================================================
// Outpost is one product under the Hypeify parent brand. Every Hypeify
// product signs in through the same identity surface (a single login page,
// shared session). This file is the *contract* the rest of the Outpost UI
// codes against. Today it wraps Supabase Auth using the SSE Supabase project
// (so the existing live SSE app keeps working unchanged).
//
// Hypeify Claude Code: when you wire in real Hypeify auth, swap the bodies
// of these functions to call the Hypeify identity service. The exported
// shape (functions + return types) must stay stable — every call site in
// Outpost imports from this file and assumes the contract below.
//
// Contract:
//   getSession()                  -> { user, expires_at } | null
//   signInWithEmail(email)        -> { error?: string }
//   verifyOtp(email, code)        -> { error?: string }
//   signOut()                     -> void
//   onAuthStateChange(cb)         -> () => void   (unsubscribe)
//
// User shape Outpost expects:
//   { id: string, email: string, display_name?: string, avatar_url?: string,
//     hypeify_user_id?: string }
// Anything Hypeify-specific can ride along on the user object; Outpost only
// reads `id` and `email` for its own logic.
// =====================================================================

export async function getSession() {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function signInWithEmail(email) {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo:
        typeof window !== "undefined" ? window.location.origin : undefined,
      shouldCreateUser: true,
    },
  });
  return { error: error?.message };
}

export async function verifyOtp(email, token) {
  const supabase = supabaseBrowser();
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: "email",
  });
  return { error: error?.message };
}

export async function signOut() {
  const supabase = supabaseBrowser();
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
  const supabase = supabaseBrowser();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}
