import Link from "next/link";
import {
  Shield,
  ClipboardCheck,
  AlertTriangle,
  Archive,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  FileSignature,
  RotateCw,
  ListChecks,
} from "lucide-react";

// =====================================================================
// Outpost — public landing page (server component)
// =====================================================================
// Lives at `/`. Anyone can see this, no auth required. The CTA points to
// /login until Hypeify Claude Code wires the marketing surface to the
// shared Hypeify identity / sign-up flow.

export const metadata = {
  title: "Outpost · Operations for multi-location teams",
  description:
    "Outpost is the operations platform for any company that runs multiple locations. Inspections, tasks, documents, and recurring reporting in one place. A Hypeify product.",
};

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-stone-50 text-stone-900">
      <Header />
      <Hero />
      <Modules />
      <WhitelabelStrip />
      <FAQ />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-stone-900 rounded flex items-center justify-center">
            <Shield className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-semibold text-base leading-none">Outpost</div>
            <div className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">
              by Hypeify
            </div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-sm text-stone-600">
          <a href="#modules" className="hover:text-stone-900">Modules</a>
          <a href="#whitelabel" className="hover:text-stone-900">White-label</a>
          <a href="#faq" className="hover:text-stone-900">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm font-medium px-3 py-2 rounded-md text-stone-700 hover:text-stone-900"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium px-3 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-1.5"
          >
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-12 md:pt-24 pb-16 md:pb-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> A Hypeify product
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1.05] mt-6">
            Operations for teams that{" "}
            <span className="italic font-normal text-stone-500">run real places.</span>
          </h1>
          <p className="text-lg md:text-xl text-stone-600 mt-6 leading-relaxed max-w-2xl">
            Outpost handles the work that doesn&apos;t fit in a CRM and shouldn&apos;t live in spreadsheets:
            site inspections, follow-up tasks, documents, recurring reports. White-labeled per
            tenant — your team sees your brand, your fields, your workflows.
          </p>
          <div className="flex items-center gap-3 mt-8 flex-wrap">
            <Link
              href="/login"
              className="bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm md:text-base px-5 py-3 rounded-md flex items-center gap-2"
            >
              Sign in to your workspace <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#modules"
              className="text-sm md:text-base font-medium px-5 py-3 rounded-md border border-stone-300 text-stone-700 hover:bg-white"
            >
              See what&apos;s inside
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-stone-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Configurable per tenant
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mobile-first inspections
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Audit log on every change
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

const MODULES = [
  {
    icon: ClipboardCheck,
    title: "Inspections",
    body:
      "Run brand-aware walk-throughs from any phone. Pass / fail / N/A on every item, photos and notes per item, automatic scoring with critical-section and zero-tolerance rules, PDF report at the end.",
  },
  {
    icon: AlertTriangle,
    title: "Issue tracker",
    body:
      "Failed inspection items become issues with photos and comments attached. Status timeline (Open → In Progress → Resolved) with timestamps, file attachments, manual entries.",
  },
  {
    icon: Archive,
    title: "Documents",
    body:
      "Per-location vault with tenant-defined categories. Upload corporate inspections, permits, audits — anything you want filed by category and pulled up later.",
  },
  {
    icon: ListChecks,
    title: "Schedule",
    body:
      "Plan and assign upcoming inspections, edit in place, resume in-progress walks across devices.",
  },
  {
    icon: ImagePlus,
    title: "Photo capture",
    body:
      "Compressed on-device before upload, server-side storage, click-to-enlarge lightbox in reports, embedded in PDFs with click-through to the full-size image.",
  },
  {
    icon: RotateCw,
    title: "Recurring surveys",
    body:
      "Generic surveys module — competitor price checks, daily condition reports, anything cadenced. Two-way: HQ reviews submissions and responds back to the submitter.",
    soon: true,
  },
];

function Modules() {
  return (
    <section id="modules" className="bg-white border-y border-stone-200">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">
            Modules
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-3">
            One platform, configured to your team
          </h2>
          <p className="text-stone-600 mt-4 leading-relaxed">
            Every module is tenant-configurable. Your sidebar, your forms, your role names,
            your categories. Everything Outpost would otherwise hard-code lives as data.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-10">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="bg-white border border-stone-200 rounded-xl p-5 md:p-6 relative"
              >
                <div className="w-10 h-10 bg-stone-100 rounded-md flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-stone-700" strokeWidth={2} />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{m.title}</h3>
                  {m.soon && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-600 mt-2 leading-relaxed">{m.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhitelabelStrip() {
  return (
    <section id="whitelabel" className="bg-stone-900 text-stone-100">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
            White-label
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-3">
            Your brand on top, the same engine underneath.
          </h2>
          <p className="text-stone-300 mt-4 leading-relaxed">
            Outpost ships as one product but renders as your product. Logo, colors, app name,
            sidebar items, location field schema, role names, inspection rubrics, document
            categories — every customer-facing piece lives in tenant config, not in code.
          </p>
          <p className="text-stone-400 mt-4 leading-relaxed text-sm">
            Tenant #1 is Seven Star Energy LLC, a Midwest fuel distributor. The same codebase
            handles a QSR chain&apos;s health inspections, an HVAC company&apos;s permit log, or a
            property manager&apos;s amenity check-ins — with a different config row.
          </p>
        </div>
        <div className="bg-stone-800 border border-stone-700 rounded-xl p-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-400 font-medium mb-4">
            <FileSignature className="w-3.5 h-3.5" /> Sample tenant config
          </div>
          <pre className="text-xs text-stone-200 font-mono leading-relaxed overflow-x-auto">
{`{
  "tenantId": "sse",
  "branding": {
    "appName": "Vanguard",
    "parentName": "Seven Star Energy"
  },
  "navigation": [
    { "id": "inspection", "label": "Inspection",
      "icon": "ClipboardCheck", "route": "/inspection" },
    { "id": "documents", "label": "Corporate Archive",
      "icon": "Archive", "route": "/documents" }
  ],
  "locationFieldSchema": {
    "fields": [
      { "id": "brand",
        "type": "select",
        "options": ["Shell","Marathon","ARCO","BP"] },
      { "id": "pumps",
        "type": "number" }
    ]
  },
  "features": {
    "inspections": true,
    "documents": true,
    "surveys": false
  }
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Is this for one industry?",
    a: "No. Outpost is built for any company running multiple locations that needs inspections, tasks, document collection, or recurring reporting. The product is configured per tenant — the same app powers a fuel distributor and a QSR chain at the same time.",
  },
  {
    q: "How is this different from a generic form-builder?",
    a: "Form-builders make forms. Outpost models the operating loop: inspections produce findings, findings open issues, issues get worked, documents accumulate against locations, recurring surveys round-trip with HQ. Each module is real, not just a form.",
  },
  {
    q: "What does Hypeify handle vs. what does Outpost handle?",
    a: "Hypeify owns identity, billing, account-level controls, and the shared login experience across every Hypeify product you use. Outpost owns the operations workflows. Sign in once on Hypeify and you land in Outpost (and any other Hypeify product) with the right tenant and role.",
  },
  {
    q: "Can I get my data out?",
    a: "Yes. Every module is exportable to CSV/JSON, and reports download as PDFs. Files attached to inspections / issues / documents are stored in your tenant's object storage; full export is part of the platform contract.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="bg-white border-t border-stone-200">
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <h2 className="font-display text-3xl md:text-4xl font-semibold">FAQ</h2>
        <div className="mt-8 space-y-6">
          {FAQS.map((f) => (
            <div key={f.q} className="border-t border-stone-200 pt-6">
              <h3 className="font-display text-lg font-semibold">{f.q}</h3>
              <p className="text-stone-600 mt-2 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-stone-50 border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-stone-900 rounded flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-semibold text-sm leading-none">Outpost</div>
            <div className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">
              by Hypeify
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs text-stone-500">
          <a href="https://hypeify.com" target="_blank" rel="noopener noreferrer" className="hover:text-stone-900">
            Hypeify
          </a>
          <Link href="/login" className="hover:text-stone-900">Sign in</Link>
          <span>© {new Date().getFullYear()} Hypeify</span>
        </div>
      </div>
    </footer>
  );
}
