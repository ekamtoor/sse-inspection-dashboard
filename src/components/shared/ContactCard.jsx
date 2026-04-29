import { Mail, Phone } from "lucide-react";

export default function ContactCard({ label, contact }) {
  if (!contact || !contact.name) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-5">
        <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-3">{label}</div>
        <p className="text-sm text-stone-400 italic">No contact set</p>
      </div>
    );
  }
  const initials = contact.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-5">
      <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-3">{label}</div>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-mono text-sm font-semibold text-stone-700 flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{contact.name}</div>
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 mt-1">
              <Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 mt-0.5">
              <Phone className="w-3 h-3 flex-shrink-0" /> {contact.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
