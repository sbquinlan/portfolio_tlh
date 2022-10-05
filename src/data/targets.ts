import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { IKeyable } from '../ui/SortableTable';
import { v4 as uuid } from 'uuid';

export interface TargetPosition extends IKeyable {
  tickers: string[];
  direct?: string;
  name: string;
  weight: number;
}

export const targetSlice = createSlice({
  name: 'targets',
  initialState: {} as Record<string, TargetPosition>,
  reducers: {
    removeTarget(state, { payload: target }: PayloadAction<TargetPosition>) {
      delete state[target.key];
    },
    saveTarget(
      state,
      {
        payload: target,
      }: PayloadAction<Omit<TargetPosition, 'key'> | TargetPosition>
    ) {
      if (!('key' in target) || !target['key']) {
        target = {  ...target , key: uuid() };
      }
      const casted = target as TargetPosition;
      state[casted.key] = casted;
    },
  },
});

export const { saveTarget, removeTarget } = targetSlice.actions;
export default targetSlice.reducer;
