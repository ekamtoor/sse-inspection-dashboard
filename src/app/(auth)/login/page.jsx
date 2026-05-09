"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginScreen from "@/components/auth/LoginScreen.jsx";
import { supabase } from "@/lib/supabase/client.js";

// /login — wraps the existing magic-link / OTP login screen.
//
// Hypeify integration: replace LoginScreen with a redirect to Hypeify's
// shared login page, and on return, hydrate the Supabase session via the
// auth shim in lib/auth/hypeify.js. The Outpost UI doesn't change.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If a session already exists, kick to /dashboard.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (next) router.replace("/dashboard");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return <LoginScreen />;
}
