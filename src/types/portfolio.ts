import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import { IKeyable } from '../lib/SortableTable';

// From the lots on the account
export interface AccountPosition extends IKeyable {
  ticker: string;
  value: number;
  gain: number;
  gainvalue: number;
  loss: number;
  lossvalue: number;
}

export const positionSlice = createSlice({
  name: 'target',
  initialState: {} as Record<string, AccountPosition>,
  reducers: {
    loadPositions(state, { payload: positions }: PayloadAction<Record<string, AccountPosition>>) {
      Object.assign(state, positions);
    },
  }
})

export const { loadPositions } = positionSlice.actions;
export default positionSlice.reducer;