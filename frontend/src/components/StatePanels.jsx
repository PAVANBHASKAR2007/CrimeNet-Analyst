import { AlertCircle } from "lucide-react";

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="divide-y divide-ink-600">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 px-5 py-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 rounded bg-ink-600 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorPanel({ message, onRetry }) {
  return (
    <div className="border border-clay/40 bg-clay/10 rounded-lg p-6 flex flex-col items-center text-center gap-3">
      <AlertCircle size={20} className="text-clay" />
      <div className="text-paper-100 text-sm">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-clay/60 text-clay rounded hover:bg-clay/10 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="border border-ink-600 rounded-lg p-10 flex flex-col items-center text-center gap-3 bg-ink-800/30">
      {Icon && <Icon size={22} className="text-paper-500" />}
      <div className="text-paper-100 font-medium text-sm">{title}</div>
      {description && <div className="text-paper-500 text-sm max-w-sm">{description}</div>}
      {action}
    </div>
  );
}
