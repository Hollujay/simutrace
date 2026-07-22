import { rpc as SorobanRpc } from '@stellar/stellar-sdk';

export function getServer(rpcUrl: string): SorobanRpc.Server {
  return new SorobanRpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
}

export const NETWORKS = {
  testnet: 'https://soroban-testnet.stellar.org',
} as const;
