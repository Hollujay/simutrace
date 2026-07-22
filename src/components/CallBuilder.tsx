import { useState, useCallback } from 'react';
import { xdr, StrKey } from '@stellar/stellar-sdk';
import type { ParsedFunction } from '../lib/types';

interface CallBuilderProps {
  fn: ParsedFunction;
  onSimulate: (args: xdr.ScVal[]) => void;
  simulating: boolean;
}

function argTypeToPlaceholder(type: string): string {
  if (type === 'address') return 'G… or C… address';
  if (type === 'string') return 'text value';
  if (type === 'symbol') return 'symbol';
  if (type === 'u32' || type === 'i32') return 'number';
  if (type === 'u64' || type === 'i64') return 'number (as string)';
  if (type === 'u128' || type === 'i128') return 'number (as string)';
  if (type === 'bool') return 'true or false';
  if (type.startsWith('option<')) return `optional ${type.slice(7, -1)}`;
  return type;
}

function parseArgValue(value: string, type: string): xdr.ScVal | null {
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
      case 'u128':
        return xdr.ScVal.scvUint128(new xdr.Uint128(trimmed));
      case 'i128':
        return xdr.ScVal.scvInt128(new xdr.Int128(trimmed));
      case 'bool':
        if (trimmed === 'true') return xdr.ScVal.scvBool(true);
        if (trimmed === 'false') return xdr.ScVal.scvBool(false);
        return null;
      case 'string':
        return xdr.ScVal.scvString(trimmed);
      case 'symbol':
        return xdr.ScVal.scvSymbol(trimmed);
      case 'address':
        if (trimmed.startsWith('C')) {
          return xdr.ScVal.scvAddress(
            xdr.ScAddress.scAddressTypeContract(StrKey.decodeContract(trimmed)),
          );
        }
        return xdr.ScVal.scvAddress(
          xdr.ScAddress.scAddressTypeAccount(StrKey.decodeEd25519PublicKey(trimmed)),
        );
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function CallBuilder({ fn, onSimulate, simulating }: CallBuilderProps) {
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleArgChange = useCallback((name: string, value: string) => {
    setArgValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  function handleSimulate() {
    const parsedArgs: xdr.ScVal[] = [];
    const newErrors: Record<string, string> = {};

    for (const input of fn.inputs) {
      const val = argValues[input.name] ?? '';
      if (!val.trim()) {
        newErrors[input.name] = `${input.name} is required`;
        continue;
      }
      const parsed = parseArgValue(val, input.type);
      if (parsed === null) {
        newErrors[input.name] = `Invalid value for ${input.type}`;
      } else {
        parsedArgs.push(parsed);
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onSimulate(parsedArgs);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">
        {fn.name}
        {fn.docs && <span className="ml-2 text-xs text-slate-500">— {fn.docs}</span>}
      </h3>

      {fn.inputs.length === 0 && (
        <p className="text-xs text-slate-400">No arguments required.</p>
      )}

      {fn.inputs.map((input) => (
        <div key={input.name}>
          <label className="block text-xs text-slate-400 mb-1">
            {input.name}
            <span className="ml-1 text-slate-600">({input.type})</span>
          </label>
          <input
            className={`w-full rounded border px-3 py-1.5 text-sm font-mono text-slate-100 bg-slate-800 ${
              errors[input.name] ? 'border-red-500' : 'border-slate-700'
            }`}
            type="text"
            placeholder={argTypeToPlaceholder(input.type)}
            value={argValues[input.name] ?? ''}
            onChange={(e) => handleArgChange(input.name, e.target.value)}
          />
          {errors[input.name] && (
            <p className="mt-0.5 text-xs text-red-400">{errors[input.name]}</p>
          )}
        </div>
      ))}

      <button
        className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        onClick={handleSimulate}
        disabled={simulating}
      >
        {simulating ? 'Simulating…' : 'Simulate'}
      </button>
    </div>
  );
}
