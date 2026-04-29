import React from "react";

export default function DetailListCard({ title, count, empty, children }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm">{title}</h3>
        <span className="font-mono text-xs text-stone-500">{count}</span>
      </div>
      <div>
        {React.Children.count(children) > 0 ? (
          children
        ) : (
          <div className="p-4 text-xs text-stone-400 italic text-center">{empty}</div>
        )}
      </div>
    </div>
  );
}
