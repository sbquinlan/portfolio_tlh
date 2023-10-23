import Papa from 'papaparse';
import { group_by, sum_entries } from '../../lib/aggregate';
import type { AccountPosition, AssetType } from './positions';

interface IBKRLotRow {
  ISIN: string;
  ClientAccountID: string;
  Symbol: string;
  AssetClass: AssetType;
  FifoPnlUnrealized: string; // float
  MarkPrice: string; // float (basically the close)
  PositionValue: string; // float
  CostBasisPrice: string; // float
  CostBasisMoney: string; // float
  Quantity: string; // float
  HoldingPeriodDateTime: string; // "2022-10-05 14:56:18"
}

interface IBKRCashRow {
  EndingSettledCash: number;
  EndingSettledCashSecurities: number;
  EndingSettledCashCommodities: number;
}

function create_position({
  Symbol,
  ISIN,
  ClientAccountID,
  AssetClass,
  FifoPnlUnrealized,
  MarkPrice,
  PositionValue,
  Quantity,
  HoldingPeriodDateTime,
}: IBKRLotRow) {
  if (!ISIN) throw new Error(`No ISIN for ${Symbol}`);
  return {
    key: ISIN.trim().replace(' ', '.'),
    isin: ISIN,
    account: ClientAccountID,
    ticker: Symbol.trim().replace(' ', '.'),
    type: AssetClass,
    last: parseFloat(MarkPrice),
    quantity: parseFloat(Quantity),
    value: parseFloat(PositionValue),
    pnl: parseFloat(FifoPnlUnrealized),
    open: Date.parse(HoldingPeriodDateTime),
  };
}

function position_pnl(
  long_term: boolean,
  pnl: number,
  value: number,
  quantity: number
) {
  const st_or_lt = long_term ? 'lt' : 'st';
  const gain_or_loss = pnl >= 0 ? 'gain' : 'loss';
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
  };
}

export function loadCSV(file?: Blob): Promise<Array<Array<any>>> {
  if (!file) return Promise.resolve([]);

  return new Promise<any[]>((res, rej) => {
    Papa.parse(file as File, {
      complete(r, _) {
        res(r.data);
      },
      error(e: any, _: any) {
        rej(e);
      },
    });
  });
}

export function partitionCashAndPositions(rows: Array<Array<any>>) {
  let headers;
  let cash = 0;
  const positions = [];
  for (const row of rows) {
    // header row if there is none or if the row length changes
    if (!headers || headers.length !== row.length) {
      headers = row;
      continue;
    }

    // combine the row data with header labels
    const record = Object.fromEntries(
      headers.map((header: string, i: number) => [header, row[i]])
    );

    if (headers.length === 3 && headers.includes('EndingSettledCash')) {
      // should only be one row
      cash = parseFloat(record.EndingSettledCash);
    } else if (headers.length === 13 && headers.includes('Symbol')) {
      positions.push(record as IBKRLotRow);
    } else if (headers.length === 1 && headers[0] === '') {
      // ignore empty rows
    } else {
      throw new Error(`Unknown CSV headers ${JSON.stringify(row)}`);
    }
  }
  return { cash, positions };
}

export function aggregatePositions(positions: IBKRLotRow[]) {
  const year_ago: number = Date.now() - 1000 * 60 * 60 * 24 * 366;
  return positions
    .filter(({ AssetClass }) => AssetClass !== 'OPT')
    .map((record) => create_position(record))
    .reduce<Record<string, AccountPosition>>(
      group_by(
        (elm) => elm.key,
        (
          result,
          { ticker, isin, account, type, last, quantity, open, pnl, value }
        ) => ({
          ...(result || { key: isin, ticker, isin, account, type, last }),
          ...sum_entries(
            {
              ...position_pnl(open < year_ago, pnl, value, quantity),
              quantity,
              value,
            },
            result
          ),
        })
      ),
      {}
    );
}
