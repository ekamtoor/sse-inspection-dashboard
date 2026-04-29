import { useState } from "react";
import { Shield, Mail, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase.js";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-amber-400 rounded flex items-center justify-center">
            <Shield className="w-5 h-5 text-stone-900" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-semibold text-lg leading-none">Vanguard</div>
            <div className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">
              Pre-Inspection
            </div>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          {status === "sent" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="font-display text-lg font-semibold mb-2">Check your email</h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                We sent a sign-in link to <span className="font-medium">{email}</span>. Open it on
                this device to log in. The link is valid for 60 minutes.
              </p>
              <button
                onClick={() => {
                  setStatus("idle");
                  setEmail("");
                }}
                className="text-xs text-stone-500 hover:text-stone-900 mt-6"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 className="font-display text-lg font-semibold mb-1">Sign in</h2>
              <p className="text-sm text-stone-500 mb-5">
                Enter your email and we'll send a one-time sign-in link.
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
                    Sending link…
                  </>
                ) : (
                  "Send sign-in link"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-[11px] text-stone-400 text-center mt-6 leading-relaxed">
          Seven Star Energy LLC · Internal use only
        </p>
      </div>
    </div>
  );
}
