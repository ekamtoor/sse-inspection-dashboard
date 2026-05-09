// (auth) route group — bare layout, no chrome. Hosts /login and any
// future password-reset / verify flows.
export default function AuthLayout({ children }) {
  return <div className="min-h-[100dvh] bg-stone-50">{children}</div>;
}
