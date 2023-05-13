import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export const cashSlice = createSlice({
  name: 'cash',
  initialState: { value: 0 },
  reducers: {
    updateCash(state, { payload: cash }: PayloadAction<number>) {
      state.value = cash;
    }
  },
});

export const { updateCash } = cashSlice.actions;
export default cashSlice.reducer;
