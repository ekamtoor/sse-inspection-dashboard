export default function Field({ label, children, required, error }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {error && <span className="text-red-500 normal-case ml-2 font-normal">{error}</span>}
      </label>
      {children}
    </div>
  );
}
