import { rpc as SorobanRpc, Networks } from '@stellar/stellar-sdk';

export function getServer(rpcUrl: string): SorobanRpc.Server {
  return new SorobanRpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
}

export const NETWORKS = {
  testnet: 'https://soroban-testnet.stellar.org',
} as const;

// There is no single official public RPC endpoint for mainnet the way there
// is for testnet, so callers must supply their own provider URL for mainnet.
// This only maps a network name to the network passphrase a transaction must
// be built with, which is fixed and safe to hardcode.
export const NETWORK_PASSPHRASES = {
  testnet: Networks.TESTNET,
  mainnet: Networks.PUBLIC,
} as const;
