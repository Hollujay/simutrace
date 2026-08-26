import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
  Account,
} from '@stellar/stellar-sdk';

// Used by both the web app and the CLI as a stand-in source account when
// simulating a call. Simulation does not require a funded or even real
// account, so this constant is shared rather than reintroduced per caller.
export const DEFAULT_SOURCE_ACCOUNT = 'GA5ZUBXDEWOKYZ3TKS27BX6ZZ4ZSSSDKDTKHSRVOMRTRZ257JUQBGLZA';

export async function simulateCall(
  server: rpc.Server,
  contractId: string,
  functionName: string,
  args: xdr.ScVal[],
  sourceAccountId: string,
  networkPassphrase: string = Networks.TESTNET,
) {
  const contract = new Contract(contractId);
  let sourceAccount: Account;
  try {
    sourceAccount = await server.getAccount(sourceAccountId);
  } catch {
    sourceAccount = new Account(sourceAccountId, '0');
  }

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();

  return server.simulateTransaction(tx);
}
