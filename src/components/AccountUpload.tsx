import Papa from 'papaparse';
import React from 'react';

import type { AccountPosition } from '../types/portfolio';

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

export default function AccountUpload({
  onChange,
}: {
  onChange: (p: Map<string, AccountPosition>) => void;
}) {
  async function _onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files![0];
    if (!file) {
      onChange(new Map());
      return;
    }

    const rows: any[] = await loadCSV(file);
    const positions = rows.reduce(
      (
        acc: Map<string, AccountPosition>,
        { Symbol: ticker, FifoPnlUnrealized: pnl, PositionValue: value }
      ) => {
        const prev = acc.get(ticker);
        const float_pnl = parseFloat(pnl);
        const float_value = parseFloat(value)
        return acc.set(ticker, {
          key: ticker,
          ticker,
          value: float_value + (prev?.value || 0),
          gain:  Math.max(0, float_pnl) + (prev?.gain || 0),
          gainvalue: (float_pnl >= 0 ? float_value : 0) + (prev?.gainvalue || 0),
          loss:  Math.min(0, float_pnl) + (prev?.loss || 0),
          lossvalue: (float_pnl < 0 ? float_value : 0) + (prev?.lossvalue || 0),
        });
      },
      new Map()
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
