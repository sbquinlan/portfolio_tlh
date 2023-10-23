import { Slice, createSlice } from '@reduxjs/toolkit';
import FUNDS from './funds.json';

// To come from the etf-holdings database
export interface FundHolding {
  ticker: string;
  isin: string;
  last: number;
  weight: number;
}
export interface Fund {
  readonly ticker: string;
  readonly isin: string;
  readonly name: string;
  readonly holdings: Record<string, FundHolding>;
}

export interface FundRow {
  readonly ticker: string;
  readonly isin: string;
  readonly name: string;
  readonly holdings: {
    ticker: string;
    isin: string;
    last: number;
    weight: number;
  }[];
}

export const fundSlice: Slice<Record<string, Fund>, {}, 'funds'> = createSlice<
  Record<string, Fund>,
  {},
  'funds'
>({
  name: 'funds',
  initialState: Object.fromEntries(
    (FUNDS as FundRow[]).map((f) => [
      f.isin,
      {
        ...f,
        holdings: Object.fromEntries(
          f.holdings.map(({ isin, ticker, weight }: any) => [
            isin,
            { ticker, isin, weight: weight / 100 },
          ])
        ),
      },
    ])
  ) as Record<string, Fund>,
  reducers: {},
});

export default fundSlice.reducer;
