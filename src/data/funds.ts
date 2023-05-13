import { createSlice } from '@reduxjs/toolkit';
import FUNDS from './funds.json'

// To come from the etf-holdings database
export interface FundHolding { ticker: string, isin: string, last: number, weight: number }
export interface Fund {
  readonly ticker: string,
  readonly isin: string,
  readonly name: string,
  readonly holdings: Record<string, FundHolding>
}

export interface FundRow {
  readonly ticker: string,
  readonly isin: string,
  readonly name: string,
  readonly holdings: { holding: string, isin: string, last: number, weight: number }[]
}

export const fundSlice = createSlice<Record<string, Fund>, {}, "funds">({
  name: 'funds',
  initialState: Object.fromEntries(
    (FUNDS as FundRow[]).map(f => [
      f.isin, 
      { 
        ... f, 
        holdings: Object.fromEntries(
          f.holdings.map(
            ({ isin, holding, last, weight }: any) => [
              isin,
              { ticker: holding, isin, last, weight: weight / 100 }
            ]
          )
        )
      },
    ])
  ) as Record<string, Fund>,
  reducers: { },
});

export default fundSlice.reducer;