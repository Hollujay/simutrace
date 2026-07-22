import { useState } from 'react';

interface ContractInputProps {
  onFetch: (contractId: string) => void;
  loading: boolean;
}

export function ContractInput({ onFetch, loading }: ContractInputProps) {
  const [contractId, setContractId] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contractId.trim()) return;
    onFetch(contractId.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <label className="text-sm font-medium text-slate-300">Contract ID</label>
      <input
        className="flex-1 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 font-mono"
        type="text"
        placeholder="C… or G… contract address"
        value={contractId}
        onChange={(e) => setContractId(e.target.value)}
      />
      <button
        className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        type="submit"
        disabled={loading || !contractId.trim()}
      >
        {loading ? 'Loading…' : 'Fetch'}
      </button>
    </form>
  );
}
