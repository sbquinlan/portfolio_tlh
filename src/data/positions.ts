import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Papa from 'papaparse';
import { IKeyable } from '../ui/SortableTable';
import { group_by, sum_entries } from '../lib/aggregate';
import { parse } from 'path';

// From the lots on the account
export type AssetType = 'FUND' | 'STK' | 'OPT'
export interface AccountPosition extends IKeyable {
  ticker: string;
  isin: string;
  type: AssetType;
  account: string;
  last: number;
  quantity: number;
  value: number;

  gain: number,
  gain_value: number,
  gain_quantity: number,
  loss: number,
  loss_value: number,
  loss_quantity: number,

  st_gain: number;
  st_gain_value: number;
  st_loss: number;
  st_loss_value: number;

  lt_gain: number;
  lt_gain_value: number;
  lt_loss: number;
  lt_loss_value: number;
}
interface IBKRLotRow {
  ISIN: string,
  ClientAccountID: string,
  Symbol: string,
  AssetClass: AssetType,
  FifoPnlUnrealized: string, // float
  MarkPrice: string, // float (basically the close)
  PositionValue: string, // float
  CostBasisPrice: string, // float
  CostBasisMoney: string,  // float
  Quantity: string, // float
  HoldingPeriodDateTime: string, // "2022-10-05 14:56:18"
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

function create_base_position(
  ticker: string, 
  isin: string,
  account: string,
  type: AssetType, 
  last: number,
  quantity: number, 
  value: number,
  pnl: number,
  open: number,
) {
  return {
    key: ticker,
    isin,
    account,
    ticker,
    type,
    last,
    quantity,
    value,
    pnl,
    open,
  }
}

function position_pnl(
  long_term: boolean,
  pnl: number,
  value: number,
  quantity: number,
) {
  const st_or_lt = long_term ? 'lt' : 'st'
  const gain_or_loss = pnl >= 0 ? 'gain' : 'loss'
  return {
    loss: 0,
    loss_value: 0,
    loss_quantity: 0,
    gain: 0,
    gain_value: 0,
    gain_quantity: 0,
    lt_gain: 0,
    lt_gain_value: 0,
    st_gain: 0,
    st_gain_value: 0,
    lt_loss: 0,
    lt_loss_value: 0,
    st_loss: 0,
    st_loss_value: 0,
    
    [`${gain_or_loss}_quantity`]: quantity,
    [`${gain_or_loss}`]: pnl,
    [`${gain_or_loss}_value`]: value,
    [`${st_or_lt}_${gain_or_loss}`]: pnl,
    [`${st_or_lt}_${gain_or_loss}_value`]: value,
  }
}

function parsePositionRows(rows: IBKRLotRow[]): Record<string, AccountPosition> {
  const year_ago: number = Date.now() - (1000 * 60 * 60 * 24 * 366);
  return rows.filter(({ AssetClass }) => AssetClass !== 'OPT')
    .map(
      ({ 
        Symbol, 
        ISIN,
        ClientAccountID,
        AssetClass, 
        FifoPnlUnrealized,
        MarkPrice,
        PositionValue,
        Quantity, 
        HoldingPeriodDateTime 
      }) => create_base_position(
        // TODO: use ISIN for primary targets
        Symbol.trim().replace(' ', '.'), 
        ISIN,
        ClientAccountID,
        AssetClass, 
        parseFloat(MarkPrice),
        parseFloat(Quantity),
        parseFloat(PositionValue), 
        parseFloat(FifoPnlUnrealized),
        Date.parse(HoldingPeriodDateTime)
      )
    )
    .reduce<Record<string, AccountPosition>>(
      group_by(
        elm => elm.key,
        (result, { ticker, isin, account, type, last, quantity, open, pnl, value }) => ({
          ... (result || { key: isin, ticker, isin, account, type, last }),
          ... sum_entries(
            { ... position_pnl(open < year_ago, pnl, value, quantity), quantity, value },
            result,
          )  
        })
      ),
      {}
    );
}

export const fromFile = createAsyncThunk(
  'positions/fromFile',
  async (file?: File): Promise<Record<string, AccountPosition>> => {
    const rows: IBKRLotRow[] = await loadCSV(file) as IBKRLotRow[];
    return parsePositionRows(rows);
  }
);

const ERROR_CODES = {
  '1001': 'Statement could not be generated at this time. Please try again shortly.',
  '1003': 'Statement is not available.',
  '1004': 'Statement is incomplete at this time. Please try again shortly.',
  '1005': 'Settlement data is not ready at this time. Please try again shortly.',
  '1006': 'FIFO P/L data is not ready at this time. Please try again shortly.',
  '1007': 'MTM P/L data is not ready at this time. Please try again shortly.',
  '1008': 'MTM and FIFO P/L data is not ready at this time. Please try again shortly.',
  '1009': 'The server is under heavy load. Statement could not be generated at this time. Please try again shortly.',
  '1010': 'Legacy Flex Queries are no longer supported. Please convert over to Activity Flex.',
  '1011': 'Service account is inactive.',
  '1012': 'Token has expired.',
  '1013': 'IP restriction.',
  '1014': 'Query is invalid.',
  '1015': 'Token is invalid.',
  '1016': 'Account in invalid.',
  '1017': 'Reference code is invalid.',
  '1018': 'Too many requests have been made from this token. Please try again shortly.',
  '1019': 'Statement generation in progress. Please try again shortly.',
  '1020': 'Invalid request or unable to validate request.',
  '1021': 'Statement could not be retrieved at this time. Please try again shortly. ',
}

interface FlexQueryParams {
  token: string,
  query_id: string,
}
export const fromFlexQuery = createAsyncThunk(
  'positions/fromFlexQuery',
  async ({ token, query_id }: FlexQueryParams): Promise<Record<string, AccountPosition>> => {
    const resp = await fetch(
      `https://www.interactivebrokers.com/Universal/servlet/FlexStatementService.SendRequest?t=${token}&q=${query_id}&v=3`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json;charset=UTF-8',
          // LMAO, this is from the documentation
          'User-Agent': 'Blackberry',
        },
      }
    );
    const { Status, ReferenceCode } = await resp.json();
      
    const data_resp = await fetch(
      `https://www.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement?t=${token}&q=${ReferenceCode}&v=3`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json;charset=UTF-8',
          // LMAO, this is from the documentation
          'User-Agent': 'Blackberry',
        },
      }
    );
    const data = await resp.json();
    return parsePositionRows(data);
  }
)

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
