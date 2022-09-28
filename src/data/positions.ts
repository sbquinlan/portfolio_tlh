import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { IKeyable } from '../ui/SortableTable';
import Papa from 'papaparse';

// From the lots on the account
export interface AccountPosition extends IKeyable {
  ticker: string;
  value: number;
  gain: number;
  gainvalue: number;
  loss: number;
  lossvalue: number;
}

function loadCSV(file?: File): Promise<Record<string, any>[]> {
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

export const fromFile = createAsyncThunk(
  'positions/fromFile',
  async (file?: File): Promise<Record<string, AccountPosition>> => {
    const rows: any[] = await loadCSV(file);
    return rows.reduce<Record<string, AccountPosition>>(
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
  }
);

export const positionSlice = createSlice({
  name: 'positions',
  initialState: {} as Record<string, AccountPosition>,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fromFile.fulfilled, (state, { payload: positions }) => {
      Object.assign(state, positions);
    });
  },
});

export default positionSlice.reducer;
