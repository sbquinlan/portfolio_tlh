import format_dollas from '../lib/format_dollas';
import {
  MoneyColumn,
  NumberColumn,
  SortableTable,
  StringColumn,
  TSortableTableChildProps,
} from '../ui/SortableTable';

export type Trade = {
  key: string;
  order: 'buy' | 'sell';
  ticker: string;
  value: number;
  gain: number;
  loss: number;
};

const COLUMNS = [
  new StringColumn<Trade>('Buy / Sell', (r) => r.order),
  new StringColumn<Trade>('Ticker', (r) => r.ticker),
  new MoneyColumn<Trade>('Value', (r) => r.value),
  new MoneyColumn<Trade>('Profit', (r) => r.gain),
  new MoneyColumn<Trade>('Loss', (r) => r.loss),
];

function TradeTableBody({ rows, cols }: TSortableTableChildProps<Trade>) {
  return (
    <tbody>
      {rows.map((r) => (
        <tr
          key={r.key}
          className={r.order === 'buy' ? 'bg-green-200' : 'bg-red-200'}
        >
          {cols.map((c) => (
            <td key={c.key} className="text-center text-xs w-24">
              {c.getFormattedValue(r)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function TradeTableFooter({ rows, cols }: TSortableTableChildProps<Trade>) {
  return (
    <tfoot>
      <tr className="bg-gray-200">
        {cols.map((c) => (
          <td key={c.key} className="text-center text-sm font-semibold">
            {c instanceof NumberColumn
              ? format_dollas(
                  rows.reduce((sum, row) => sum + c.getValue(row), 0)
                )
              : '--'}
          </td>
        ))}
      </tr>
    </tfoot>
  );
}

type TProps = { trades: Trade[] };
function TradeTable({ trades }: TProps) {
  if (!trades.length) return null;
  return (
    <SortableTable
      className="w-full table-auto border border-black"
      rows={trades}
      cols={COLUMNS}
      bodyComponent={TradeTableBody}
      footerComponent={TradeTableFooter}
    />
  );
}

export default TradeTable;
