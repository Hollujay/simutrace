import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
} from '@stellar/stellar-sdk';

export async function simulateCall(
  server: rpc.Server,
  contractId: string,
  functionName: string,
  args: xdr.ScVal[],
  sourceAccountId: string,
) {
  const contract = new Contract(contractId);
  let sourceAccount;
  try {
    sourceAccount = await server.getAccount(sourceAccountId);
  } catch {
    sourceAccount = {
      accountId: () => sourceAccountId,
      sequenceNumber: () => '0',
      sequenceNumberToXDR: () => xdr.SequenceNumber.fromXDR('0', 'number'),
      incrementSequenceNumber: () => {},
    } as unknown as ReturnType<typeof rpc.Server.prototype.getAccount>;
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
