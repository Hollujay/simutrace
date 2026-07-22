import { contract, rpc, xdr } from '@stellar/stellar-sdk';
import type { ParsedFunction } from './types';

function specTypeToStringShort(type: xdr.ScSpecTypeDef): string {
  const kind = type.switch();
  switch (kind) {
    case xdr.ScSpecType.scSpecTypeOption(): {
      const inner = type.option();
      return `option<${specTypeToStringShort(inner)}>`;
    }
    case xdr.ScSpecType.scSpecTypeResult(): {
      const result = type.result();
      return `result<${specTypeToStringShort(result.okType())}, ${specTypeToStringShort(result.errorType())}>`;
    }
    case xdr.ScSpecType.scSpecTypeVec():
      return `vec<${specTypeToStringShort(type.vec())}>`;
    case xdr.ScSpecType.scSpecTypeMap():
      return `map<${specTypeToStringShort(type.map().keyType())}, ${specTypeToStringShort(type.map().valueType())}>`;
    case xdr.ScSpecType.scSpecTypeTuple():
      return `tuple<${type.tuple().length}>`;
    case xdr.ScSpecType.scSpecTypeBytesN():
      return `bytes${type.bytesN()}`;
    case xdr.ScSpecType.scSpecTypeUdt():
      return type.udt().toString();
    default:
      return kind.name;
  }
}

function specTypeToString(type: xdr.ScSpecTypeDef): string {
  const kind = type.switch();
  switch (kind) {
    case xdr.ScSpecType.scSpecTypeOption():
      return `option<${specTypeToString(type.option())}>`;
    case xdr.ScSpecType.scSpecTypeResult(): {
      const r = type.result();
      return `result<${specTypeToString(r.okType())}, ${specTypeToString(r.errorType())}>`;
    }
    case xdr.ScSpecType.scSpecTypeVec():
      return `vec<${specTypeToString(type.vec())}>`;
    case xdr.ScSpecType.scSpecTypeMap():
      return `map<${specTypeToString(type.map().keyType())}, ${specTypeToString(type.map().valueType())}>`;
    case xdr.ScSpecType.scSpecTypeTuple():
      return `tuple<${type.tuple().map((t) => specTypeToString(t)).join(', ')}>`;
    case xdr.ScSpecType.scSpecTypeBytesN():
      return `bytes${type.bytesN()}`;
    case xdr.ScSpecType.scSpecTypeUdt():
      return type.udt().toString();
    default:
      return kind.name;
  }
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
    const msg = err instanceof Error ? err.message : String(err);
    throw { kind: 'rpc-unreachable' as const, url: server.serverURL.toString(), likelyCors: false };
  }

  let spec: contract.Spec;
  try {
    spec = contract.Spec.fromWasm(wasmBuffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('Could not obtain contract spec') ||
      msg.includes('contractspecv0')
    ) {
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
        type: specTypeToStringShort(input.type()),
      })),
      outputs: fn.outputs().map((output) => ({
        type: specTypeToString(output),
      })),
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw { kind: 'malformed-spec' as const, contractId, reason: msg };
  }
}
