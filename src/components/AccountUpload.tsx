import Papa from 'papaparse';
import React from 'react';

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
        const float_value = parseFloat(value)
        acc[ticker] = {
          key: ticker,
          ticker,
          value: float_value + (prev?.value || 0),
          gain:  Math.max(0, float_pnl) + (prev?.gain || 0),
          gainvalue: (float_pnl >= 0 ? float_value : 0) + (prev?.gainvalue || 0),
          loss:  Math.min(0, float_pnl) + (prev?.loss || 0),
          lossvalue: (float_pnl < 0 ? float_value : 0) + (prev?.lossvalue || 0),
        }
        return acc;
      },
      {}
    );
    onChange(positions);
  }
  return (
    <input
      className="block text-sm file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-gray-300 hover:file:bg-gray-200"
      type="file"
      accept="csv"
      onChange={_onChange}
    />
  );
}
