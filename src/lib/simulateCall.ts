import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
  Account,
} from '@stellar/stellar-sdk';

export async function simulateCall(
  server: rpc.Server,
  contractId: string,
  functionName: string,
  args: xdr.ScVal[],
  sourceAccountId: string,
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
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();

  return server.simulateTransaction(tx);
}
