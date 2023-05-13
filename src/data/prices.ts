import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import FUNDS from './funds.json'
import type { FundRow } from './funds';
import { fromFile } from './positions';

export const pricesSlice = createSlice({
  name: 'prices',
  initialState: Object.fromEntries(
    (FUNDS as FundRow[]).flatMap(({ holdings }) => holdings)
      .map(({ isin, last }) => [isin, last])
  ),
  reducers: {
    updatePrices(state, { payload: prices }: PayloadAction<number>) {
      Object.assign(state, prices);
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fromFile.fulfilled, (state, { payload: positions }) => {
      Object.assign(
        state, 
        Object.fromEntries(
          Object.values(positions).map(({ isin, last }) => [isin, last])
        )
      );
    });
  },
});

export const { updatePrices } = pricesSlice.actions;
export default pricesSlice.reducer;
