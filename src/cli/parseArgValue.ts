import { xdr, StrKey } from '@stellar/stellar-sdk';

// Mirrors the argument conversion in src/components/CallBuilder.tsx (type name
// plus a raw string value in, an xdr.ScVal out), adapted for CLI input instead
// of form input. Kept as a separate function since the CLI receives args as
// key=value strings on the command line, not as per-field form state.
export function parseArgValue(value: string, type: string): xdr.ScVal | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    switch (type) {
      case 'u32':
        return xdr.ScVal.scvU32(Number(trimmed));
      case 'i32':
        return xdr.ScVal.scvI32(Number(trimmed));
      case 'u64':
        return xdr.ScVal.scvU64(new xdr.Uint64(trimmed));
      case 'i64':
        return xdr.ScVal.scvI64(new xdr.Int64(trimmed));
      case 'u128': {
        const parts = trimmed.split(',').map((s) => s.trim());
        const lo = new xdr.Uint64(parts[0] || '0');
        const hi = new xdr.Uint64(parts[1] || '0');
        return xdr.ScVal.scvU128(new xdr.UInt128Parts({ lo, hi }));
      }
      case 'i128': {
        const parts = trimmed.split(',').map((s) => s.trim());
        const lo = new xdr.Uint64(parts[0] || '0');
        const hi = new xdr.Int64(parts[1] || '0');
        return xdr.ScVal.scvI128(new xdr.Int128Parts({ lo, hi }));
      }
      case 'bool':
        if (trimmed === 'true') return xdr.ScVal.scvBool(true);
        if (trimmed === 'false') return xdr.ScVal.scvBool(false);
        return null;
      case 'string':
        return xdr.ScVal.scvString(trimmed);
      case 'symbol':
        return xdr.ScVal.scvSymbol(trimmed);
      case 'address': {
        if (trimmed.startsWith('C')) {
          const buf = StrKey.decodeContract(trimmed);
          return xdr.ScVal.scvAddress(
            xdr.ScAddress.scAddressTypeContract(buf as unknown as xdr.ContractId),
          );
        }
        const buf = StrKey.decodeEd25519PublicKey(trimmed);
        return xdr.ScVal.scvAddress(
          xdr.ScAddress.scAddressTypeAccount(
            xdr.PublicKey.publicKeyTypeEd25519(buf),
          ),
        );
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// Parses the CLI's `--args key=value,key2=value2` flag into a plain map.
// Does not know about contract function types; that lookup happens in
// runCheck, which has the parsed function spec available.
export function parseArgsFlag(raw: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw || !raw.trim()) return result;

  for (const pair of raw.split(',')) {
    const trimmedPair = pair.trim();
    if (!trimmedPair) continue;
    const eqIndex = trimmedPair.indexOf('=');
    if (eqIndex === -1) {
      throw new Error(`Invalid --args entry "${trimmedPair}", expected key=value`);
    }
    const key = trimmedPair.slice(0, eqIndex).trim();
    const value = trimmedPair.slice(eqIndex + 1).trim();
    result[key] = value;
  }

  return result;
}
