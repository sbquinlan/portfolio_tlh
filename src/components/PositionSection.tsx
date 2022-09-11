import { useMemo } from 'react';

import {
  CustomColumn,
  ValueColumn,
} from './SortableTable';
import { CollapsibleTable } from './CollapsibleTable';
import { DisplayTargetState } from '../types/display';
import { AccountPosition } from '../types/portfolio';
import AccountUpload from './AccountUpload';
import formatDollas from '../lib/formatDollas';

export class MoneyColumn<TRow extends { key: string }> extends ValueColumn<
  TRow,
  number
> {
  constructor(
    header: string,
    getValue: (r: TRow) => number,
    headerClassname: string = '',
    rowClassname: string = ''
  ) {
    super(header, '', getValue, (a, b) => b - a, headerClassname, rowClassname);
  }

  renderCell(r: TRow, props: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
      <td
        className={this.rowClassname}
        {...props}
        key={`${this.header}_${r.key}`}
      >
        {formatDollas(this.getValue(r))}
      </td>
    );
  }

  renderFooter(
    rs: TRow[],
    props?: React.TdHTMLAttributes<HTMLTableCellElement>
  ) {
    return (
      <td {...props} key={this.header}>
        {formatDollas(
          rs.map((r) => this.getValue(r)).reduce((acc, n) => acc + n, 0)
        )}
      </td>
    );
  }
}

type TProps = {
  positions: DisplayTargetState[];
  setPositions: (p: Map<string, AccountPosition>) => void;
};
function PositionSection({ positions, setPositions }: TProps) {
  const cols = useMemo(
    () => [
      new ValueColumn<DisplayTargetState, string>(
        'Name',
        'Total',
        (r) => r.name,
        (a, b) => (a as string).localeCompare(b),
        '',
        'max-w-0 overflow-hidden whitespace-nowrap text-left'
      ),
      new MoneyColumn<DisplayTargetState>(
        'Value',
        (r) => r.value,
        '',
        'text-center text-sm w-24'
      ),
      new MoneyColumn<DisplayTargetState>(
        'Target',
        (_) => 0,
        '',
        'text-center text-sm w-24'
      ),
      new MoneyColumn<DisplayTargetState>(
        'Uplots',
        (r) => r.uplots,
        '',
        'text-center text-sm w-24'
      ),
      new MoneyColumn<DisplayTargetState>(
        'Downlots',
        (r) => r.downlots,
        '',
        'text-center text-sm w-24'
      ),
      new MoneyColumn<DisplayTargetState>(
        'Net',
        (r) => r.uplots + r.downlots,
        '',
        'text-center text-sm w-24'
      ),
    ],
    []
  );
  const nestedCols = useMemo(
    () => [
      new ValueColumn<AccountPosition, string>(
        'Symbol',
        'Total',
        (r) => r.ticker,
        (a, b) => (a as string).localeCompare(b),
        '',
        'max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium pl-2'
      ),
      new MoneyColumn<AccountPosition>(
        'Value',
        (r) => r.value,
        '',
        'text-center text-xs w-24'
      ),
      // placeholder for "target" which doesn't exist here
      new CustomColumn(
        () => <th />,
        () => <td className="text-center text-xs w-24">--</td>
      ),
      new MoneyColumn<AccountPosition>(
        'Uplots',
        (r) => r.uplots,
        '',
        'text-center text-xs w-24'
      ),
      new MoneyColumn<AccountPosition>(
        'Downlots',
        (r) => r.downlots,
        '',
        'text-center text-xs w-24'
      ),
      new MoneyColumn<AccountPosition>(
        'Net',
        (r) => r.uplots + r.downlots,
        '',
        'text-center text-xs w-24'
      ),
    ],
    []
  );
  return (
    <div>
      <div className="flex flex-row items-center py-2 px-4">
        <h1 className="flex-1 text-lg font-bold">Portfolio</h1>
        <AccountUpload onChange={(p) => setPositions(p)} />
      </div>
      <CollapsibleTable
        rows={positions}
        cols={cols}
        nestedRows={(r) => r.holdings}
        nestedCols={nestedCols}
        footer={
          <tfoot>
            <tr className="border-t-2">
              <td />
              {cols.map((c) =>
                c.renderFooter(positions, {
                  className: 'text-center text-sm font-semibold',
                })
              )}
            </tr>
          </tfoot>
        }
      />
    </div>
  );
}
export default PositionSection;
