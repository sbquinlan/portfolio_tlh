import { createSlice } from '@reduxjs/toolkit';
import FUNDS from './funds.json'

// To come from the etf-holdings database
export interface FundHolding { ticker: string, weight: number }
export interface Fund {
  readonly ticker: string,
  readonly name: string,
  readonly holdings: Record<string, FundHolding>
}

interface FundRow {
  readonly ticker: string,
  readonly name: string,
  readonly holdings: { holding: string, weight: number }[]
}

export const fundSlice = createSlice({
  name: 'funds',
  initialState: Object.fromEntries(
    (FUNDS as FundRow[]).map(f => [
      f.ticker, 
      { 
        ... f, 
        holdings: Object.fromEntries(
          f.holdings.map(
            ({ holding, weight }: any) => [
              holding,
              { ticker: holding, weight: weight / 100 }
            ]
          )
        )
      },
    ])
  ) as Record<string, Fund>,
  reducers: { },
});

export default fundSlice.reducer;