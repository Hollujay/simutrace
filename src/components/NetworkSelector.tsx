import { useState } from 'react';
import { getServer, NETWORKS } from '../lib/rpc';
import type { rpc } from '@stellar/stellar-sdk';

export type NetworkConfig =
  | { type: 'testnet' }
  | { type: 'mainnet'; rpcUrl: string }
  | { type: 'custom'; rpcUrl: string };

interface NetworkSelectorProps {
  onNetworkChange: (server: rpc.Server, network: NetworkConfig) => void;
  initialNetwork?: NetworkConfig;
}

export function NetworkSelector({ onNetworkChange, initialNetwork }: NetworkSelectorProps) {
  const [networkType, setNetworkType] = useState<'testnet' | 'mainnet' | 'custom'>(
    initialNetwork?.type ?? 'testnet',
  );
  const [rpcUrl, setRpcUrl] = useState(
    initialNetwork?.type === 'mainnet' || initialNetwork?.type === 'custom'
      ? initialNetwork.rpcUrl
      : '',
  );

  function handleNetworkTypeChange(type: 'testnet' | 'mainnet' | 'custom') {
    setNetworkType(type);
    if (type === 'testnet') {
      const server = getServer(NETWORKS.testnet);
      onNetworkChange(server, { type: 'testnet' });
    }
  }

  function handleCustomUrl() {
    if (!rpcUrl.trim()) return;
    const server = getServer(rpcUrl.trim());
    onNetworkChange(server, {
      type: networkType as 'mainnet' | 'custom',
      rpcUrl: rpcUrl.trim(),
    });
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-slate-300">Network</label>
      <select
        className="rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100"
        value={networkType}
        onChange={(e) => handleNetworkTypeChange(e.target.value as 'testnet' | 'mainnet' | 'custom')}
      >
        <option value="testnet">Testnet</option>
        <option value="mainnet">Mainnet</option>
        <option value="custom">Custom RPC</option>
      </select>
      {(networkType === 'mainnet' || networkType === 'custom') && (
        <div className="flex items-center gap-2">
          <input
            className="w-72 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500"
            type="text"
            placeholder={
              networkType === 'mainnet'
                ? 'Enter your Mainnet RPC provider URL'
                : 'Enter custom RPC URL'
            }
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCustomUrl(); }}
          />
          <button
            className="rounded bg-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600"
            onClick={handleCustomUrl}
          >
            Connect
          </button>
        </div>
      )}
    </div>
  );
}
