import { ACTION_TYPE, Trade } from '../selectors/trades';
import { sum } from '../lib/aggregate';
import format_dollas from '../lib/format_dollas';
import {
  MoneyColumn,
  NumberColumn,
  SortableTable,
  StringColumn,
  TSortableTableChildProps,
} from '../ui/SortableTable';

const COLUMNS = [
  new StringColumn<Trade>('Action', (r) => r.action),
  new StringColumn<Trade>('Ticker', (r) => r.symbol),
  new StringColumn<Trade>('Quantity', (r) => r.quantity.toFixed(4)),
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
          className={
            r.action === ACTION_TYPE.BUY ? 'bg-green-200' : 'bg-red-200'
          }
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
            {c instanceof MoneyColumn
              ? format_dollas(sum(rows, (r) => c.getValue(r)))
              : c instanceof NumberColumn
              ? sum(rows, (r) => c.getValue(r))
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
