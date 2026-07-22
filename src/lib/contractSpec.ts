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
    wasmBuffer = await server.getContractWasmByContractId(contractId);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 404) {
      throw { kind: 'contract-not-found' as const, contractId };
    }
    throw { kind: 'rpc-unreachable' as const, url: server.serverURL.toString(), likelyCors: false };
  }

  let spec: contract.Spec;
  try {
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
