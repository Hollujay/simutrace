import type { DiffEntry } from '../lib/types';

interface StorageDiffProps {
  entries: DiffEntry[];
}

function statusBadge(status: DiffEntry['status']) {
  switch (status) {
    case 'added':
      return <span className="rounded bg-emerald-900/60 px-1.5 py-0.5 text-xs text-emerald-400 font-medium">added</span>;
    case 'changed':
      return <span className="rounded bg-amber-900/60 px-1.5 py-0.5 text-xs text-amber-400 font-medium">changed</span>;
    case 'removed':
      return <span className="rounded bg-red-900/60 px-1.5 py-0.5 text-xs text-red-400 font-medium">removed</span>;
    case 'unchanged':
      return <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-500 font-medium">unchanged</span>;
  }
}

function formatValue(value: unknown): string {
  if (value === null) return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export function StorageDiff({ entries }: StorageDiffProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded border border-slate-700 bg-slate-800/50 px-4 py-3">
        <p className="text-sm text-slate-400">No storage entries were touched by this call.</p>
      </div>
    );
  }

  const changedEntries = entries.filter((e) => e.status !== 'unchanged');

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-slate-300">
        Storage Diff
        <span className="ml-2 text-xs text-slate-500">
          {changedEntries.length} changed of {entries.length} total
        </span>
      </h2>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.key}
            className={`rounded border px-4 py-3 ${
              entry.status === 'unchanged'
                ? 'border-slate-800 bg-slate-900/30'
                : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-xs text-slate-300 truncate flex-1">
                {entry.key}
              </span>
              {statusBadge(entry.status)}
            </div>
            {(entry.status === 'changed' || entry.status === 'removed') && (
              <div className="mt-1">
                <span className="text-xs text-slate-500">Before:</span>
                <pre className="mt-0.5 font-mono text-xs text-red-300 whitespace-pre-wrap">
                  {formatValue(entry.before)}
                </pre>
              </div>
            )}
            {(entry.status === 'changed' || entry.status === 'added') && (
              <div className="mt-1">
                <span className="text-xs text-slate-500">After:</span>
                <pre className="mt-0.5 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                  {formatValue(entry.after)}
                </pre>
              </div>
            )}
            {entry.status === 'unchanged' && (
              <div className="mt-1">
                <span className="text-xs text-slate-500">Value:</span>
                <pre className="mt-0.5 font-mono text-xs text-slate-400 whitespace-pre-wrap">
                  {formatValue(entry.before)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
