import Papa from 'papaparse';
import React, { useRef } from 'react';

import type { AccountPosition } from '../data/portfolio';

function loadCSV(file?: File): Promise<any[]> {
  if (!file) return Promise.resolve([]);

  return new Promise<any[]>((res, rej) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      header: true,
      complete(r, _) {
        res(r.data);
      },
      error(e: any, _: any) {
        rej(e);
      },
    });
  });
}

type TProps = {
  onChange: (p: Record<string, AccountPosition>) => void;
};

export default function AccountUpload({ onChange }: TProps) {
  async function _onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files![0];
    if (!file) {
      onChange({});
      return;
    }

    const rows: any[] = await loadCSV(file);
    const positions = rows.reduce<Record<string, AccountPosition>>(
      (
        acc,
        { Symbol: ticker, FifoPnlUnrealized: pnl, PositionValue: value }
      ) => {
        const prev = acc[ticker];
        const float_pnl = parseFloat(pnl);
        const float_value = parseFloat(value);
        acc[ticker] = {
          key: ticker,
          ticker,
          value: float_value + (prev?.value || 0),
          gain: Math.max(0, float_pnl) + (prev?.gain || 0),
          gainvalue:
            (float_pnl >= 0 ? float_value : 0) + (prev?.gainvalue || 0),
          loss: Math.min(0, float_pnl) + (prev?.loss || 0),
          lossvalue: (float_pnl < 0 ? float_value : 0) + (prev?.lossvalue || 0),
        };
        return acc;
      },
      {}
    );
    onChange(positions);
  }
  const input_ref = useRef<HTMLInputElement>(null);
  return (
    <span>
      <input
        ref={input_ref}
        className="hidden"
        type="file"
        accept="csv"
        onChange={_onChange}
      />
      <button
        className="bg-slate-500 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-4 rounded"
        onClick={() => {
          input_ref.current?.click();
        }}
      >
        Upload
      </button>
    </span>
  );
}
