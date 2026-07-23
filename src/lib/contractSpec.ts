import { contract, rpc, xdr } from '@stellar/stellar-sdk';
import type { ParsedFunction } from './types';

function xdrTypeName(kind: xdr.ScSpecType): string {
  const name = kind.name;
  if (name.startsWith('scSpecType')) {
    return name.charAt(10).toLowerCase() + name.slice(11);
  }
  return name;
}

function specTypeToInner(type: xdr.ScSpecTypeDef): string {
  const kind = type.switch();
  if (kind === xdr.ScSpecType.scSpecTypeOption()) {
    return `option<${specTypeToInner(type.option().valueType())}>`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeResult()) {
    const result = type.result();
    return `result<${specTypeToInner(result.okType())}, ${specTypeToInner(result.errorType())}>`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeVec()) {
    return `vec<${specTypeToInner(type.vec().elementType())}>`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeMap()) {
    const map = type.map();
    return `map<${specTypeToInner(map.keyType())}, ${specTypeToInner(map.valueType())}>`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeTuple()) {
    return `tuple<${type.tuple().valueTypes().length}>`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeBytesN()) {
    return `bytes${type.bytesN().n()}`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeUdt()) {
    return type.udt().name().toString();
  }
  return xdrTypeName(kind);
}

function specTypeToFull(type: xdr.ScSpecTypeDef): string {
  const kind = type.switch();
  if (kind === xdr.ScSpecType.scSpecTypeOption()) {
    return `option<${specTypeToFull(type.option().valueType())}>`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeResult()) {
    const result = type.result();
    return `result<${specTypeToFull(result.okType())}, ${specTypeToFull(result.errorType())}>`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeVec()) {
    return `vec<${specTypeToFull(type.vec().elementType())}>`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeMap()) {
    const map = type.map();
    return `map<${specTypeToFull(map.keyType())}, ${specTypeToFull(map.valueType())}>`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeTuple()) {
    return `tuple<${type.tuple().valueTypes().map((t) => specTypeToFull(t)).join(', ')}>`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeBytesN()) {
    return `bytes${type.bytesN().n()}`;
  }
  if (kind === xdr.ScSpecType.scSpecTypeUdt()) {
    return type.udt().name().toString();
  }
  return xdrTypeName(kind);
}

export async function fetchContractSpec(
  server: rpc.Server,
  contractId: string,
): Promise<ParsedFunction[]> {
  let wasmBuffer: Buffer;
  try {
    console.log('fetchContractSpec: fetching wasm for contract', contractId);
    wasmBuffer = await server.getContractWasmByContractId(contractId);
    console.log('fetchContractSpec: got wasm buffer, type=%s, length=%s, isBuffer=%s',
      typeof wasmBuffer, wasmBuffer?.length, Buffer.isBuffer(wasmBuffer));
  } catch (err: unknown) {
    console.error('fetchContractSpec: error fetching contract wasm for', contractId, err);

    if (typeof err === 'object' && err !== null) {
      const obj = err as Record<string, unknown>;

      // SDK returns { code: 404, message: '...' } when the contract or its WASM
      // hash cannot be found on chain
      if (obj.code === 404) {
        throw { kind: 'contract-not-found' as const, contractId };
      }

      // SDK returns { code: 400, message: '...' } when the contract is a Stellar
      // Asset Contract (SAC), which has no WASM blob to fetch.
      if (obj.code === 400) {
        throw { kind: 'sac-not-supported' as const, contractId };
      }

      // JSON-RPC error object (HTTP 200 but the response body contained an
      // "error" field).  These have numeric codes like -32602 and a message.
      if (typeof obj.code === 'number' && typeof obj.message === 'string') {
        throw { kind: 'rpc-error' as const, code: obj.code, message: obj.message };
      }
    }

    // TypeError from parseRawLedgerEntries (missing key/xdr fields) or XDR
    // decoding failures — these are response-parsing errors, not connectivity.
    if (err instanceof TypeError) {
      console.log('fetchContractSpec: TypeError caught, err=%O, proto=%s', err, Object.getPrototypeOf(err).constructor.name);
      throw { kind: 'malformed-spec' as const, contractId, reason: err.message };
    }

    // Error instances from SDK response parsing (XDR decode, missing fields,
    // unexpected shapes) — these are not network failures.
    if (err instanceof Error) {
      console.log('fetchContractSpec: Error caught, name=%s, message=%s, stack=%s',
        err.name, err.message, err.stack?.split('\n').slice(0, 4).join('\n'));
      throw { kind: 'malformed-spec' as const, contractId, reason: err.message };
    }

    // Genuine network errors (DNS failure, timeout, CORS, etc.) — typically
    // thrown as TypeError in browsers, but we keep this as a final fallback
    // for anything that isn't an Error at all.
    throw { kind: 'rpc-unreachable' as const, url: server.serverURL.toString(), likelyCors: false };
  }

  let spec: contract.Spec;
  try {
    console.log('fetchContractSpec: calling Spec.fromWasm with wasm, length=%s, firstBytes=%s',
      wasmBuffer?.length, wasmBuffer?.slice(0, 20)?.toString('hex'));
    spec = contract.Spec.fromWasm(wasmBuffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Could not obtain contract spec') || msg.includes('contractspecv0')) {
      throw { kind: 'no-embedded-spec' as const, contractId };
    }
    throw { kind: 'malformed-spec' as const, contractId, reason: msg };
  }

  try {
    const functions = spec.funcs();
    return functions.map((fn) => ({
      name: fn.name().toString(),
      docs: fn.doc().toString() || undefined,
      inputs: fn.inputs().map((input) => ({
        name: input.name().toString(),
        type: specTypeToInner(input.type()),
      })),
      outputs: fn.outputs().map((output) => ({
        type: specTypeToFull(output),
      })),
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw { kind: 'malformed-spec' as const, contractId, reason: msg };
  }
}
