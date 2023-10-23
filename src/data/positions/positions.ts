import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { IKeyable } from '../../ui/SortableTable';
import { FlexQueryParams, fileFromFlexQuery } from './flexquery';
import { aggregatePositions, loadCSV, partitionCashAndPositions } from './csv';

// From the lots on the account
export type AssetType = 'FUND' | 'STK' | 'OPT';
export interface AccountPosition extends IKeyable {
  ticker: string;
  isin: string;
  type: AssetType;
  account: string;
  last: number;
  quantity: number;
  value: number;

  gain: number;
  gain_value: number;
  gain_quantity: number;
  loss: number;
  loss_value: number;
  loss_quantity: number;

  st_gain: number;
  st_gain_value: number;
  st_loss: number;
  st_loss_value: number;

  lt_gain: number;
  lt_gain_value: number;
  lt_loss: number;
  lt_loss_value: number;
}

async function parseRows(
  file?: Blob
): Promise<Pick<PositionState, 'cash' | 'positions'>> {
  if (!file) return { cash: 0, positions: {} };

  const rows = await loadCSV(file);
  const { cash, positions } = partitionCashAndPositions(rows);
  return {
    cash,
    positions: aggregatePositions(positions),
  };
}

export const fromFlexQuery = createAsyncThunk(
  'positions/fromFlexQuery',
  async (args?: FlexQueryParams) => {
    if (!args) return { cash: 0, positions: {} };

    const file = await fileFromFlexQuery(args);
    return await parseRows(file);
  }
);

export interface PositionState {
  error: Error | undefined;
  pending: boolean;
  cash: number;
  positions: Record<string, AccountPosition>;
}

const INITIAL_STATE: PositionState = {
  pending: true,
  error: undefined,
  cash: 0,
  positions: {},
};

export const positionSlice = createSlice({
  name: 'positions',
  initialState: INITIAL_STATE,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fromFlexQuery.rejected, (state, { error }) => {
      console.log(error);
      Object.assign(state, {
        pending: false,
        error: error,
      });
    });
    builder.addCase(fromFlexQuery.pending, (state, _) => {
      Object.assign(state, INITIAL_STATE);
    });
    builder.addCase(fromFlexQuery.fulfilled, (state, { payload }) => {
      Object.assign(state, {
        pending: false,
        ...payload,
      });
    });
  },
});

export default positionSlice.reducer;
