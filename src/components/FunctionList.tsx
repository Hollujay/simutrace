import type { ParsedFunction } from '../lib/types';

interface FunctionListProps {
  functions: ParsedFunction[];
  selectedName: string | null;
  onSelect: (name: string) => void;
}

export function FunctionList({ functions, selectedName, onSelect }: FunctionListProps) {
  if (functions.length === 0) {
    return <p className="text-sm text-slate-400">No callable functions found in this contract.</p>;
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-slate-300">Functions</h2>
      <div className="flex flex-wrap gap-2">
        {functions.map((fn) => (
          <button
            key={fn.name}
            className={`rounded border px-3 py-1.5 text-sm font-mono ${
              selectedName === fn.name
                ? 'border-emerald-500 bg-emerald-900/40 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
            }`}
            onClick={() => onSelect(fn.name)}
          >
            {fn.name}
          </button>
        ))}
      </div>
    </div>
  );
}
