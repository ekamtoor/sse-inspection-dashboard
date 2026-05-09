import { useState } from "react";
import { Shield, Mail, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase.js";
import { getBranding } from "../../lib/branding.js";

export default function LoginScreen() {
  const branding = getBranding();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);

  async function sendCode(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("idle");
      return;
    }
    setStep("code");
    setStatus("idle");
  }

  async function verifyCode(e) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setStatus("verifying");
    setErrorMsg(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: trimmed,
      type: "email",
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("idle");
      return;
    }
    // Auth state change listener in App.jsx will pick up the session.
  }

  function reset() {
    setStep("email");
    setCode("");
    setErrorMsg(null);
    setStatus("idle");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-amber-400 rounded flex items-center justify-center">
            <Shield className="w-5 h-5 text-stone-900" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-semibold text-lg leading-none">{branding.appName}</div>
            <div className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">
              {branding.appEyebrow}
            </div>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          {step === "email" ? (
            <form onSubmit={sendCode}>
              <h2 className="font-display text-lg font-semibold mb-1">Sign in</h2>
              <p className="text-sm text-stone-500 mb-5">
                Enter your email and we'll send a one-time code.
              </p>
              <label className="block">
                <span className="text-xs font-medium text-stone-600 uppercase tracking-wide">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                />
              </label>

              {errorMsg && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !email.trim()}
                className="mt-5 w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-sm font-medium px-4 py-2.5 rounded-md flex items-center justify-center gap-2"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending code…
                  </>
                ) : (
                  "Send code"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode}>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="font-display text-lg font-semibold mb-1 text-center">
                Check your email
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed text-center mb-5">
                We sent a sign-in code to{" "}
                <span className="font-medium">{email}</span>. Enter it below — or just tap the link
                in the email if it opens in this browser.
              </p>
              <label className="block">
                <span className="text-xs font-medium text-stone-600 uppercase tracking-wide">
                  Sign-in code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  required
                  autoFocus
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="12345678"
                  className="mt-1 w-full border border-stone-300 rounded-md px-3 py-2 text-center text-lg tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                />
              </label>

              {errorMsg && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "verifying" || code.length < 6 || code.length > 8}
                className="mt-5 w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-sm font-medium px-4 py-2.5 rounded-md flex items-center justify-center gap-2"
              >
                {status === "verifying" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify and sign in"
                )}
              </button>

              <button
                type="button"
                onClick={reset}
                className="block mx-auto text-xs text-stone-500 hover:text-stone-900 mt-4"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <div className="mt-7 flex flex-col items-center gap-2">
          {branding.parentLogoUrl && (
            <img
              src={branding.parentLogoUrl}
              alt={branding.parentLogoAlt || branding.parentName}
              className="h-16 w-auto object-contain opacity-90"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
          <p className="text-[11px] text-stone-400 leading-relaxed">Internal use only</p>
        </div>
      </div>
    </div>
  );
}
