import React, { ReactNode } from 'react';

import {
  IKeyable,
  TableColumn,
  StringColumn,
  NumberColumn,
  TSortableTableChildProps,
  TSortableTableRowProps,
  SortableTable
} from '../lib/SortableTable';
import { DisplayTargetState } from '../types/display';
import { AccountPosition } from '../types/portfolio';
import formatDollas from '../lib/formatDollas';
import { CollapsibleTable, TCollapsibleNestedChildProps } from '../lib/CollapsibleTable';
class MoneyColumn<TRow extends IKeyable> extends NumberColumn<TRow> {
  constructor(
    label: string,
    getValue: (r: TRow) => number,
  ) {
    super(label, getValue);
  }

  getFormattedValue(r: TRow): ReactNode {
    return formatDollas(this.getValue(r)); 
  }
}

const TARGET_COLUMNS = [
  new StringColumn<DisplayTargetState>(
    'Name',
    (r) => r.name,
  ),
  new MoneyColumn<DisplayTargetState>(
    'Value',
    (r) => r.value,
  ),
  new MoneyColumn<DisplayTargetState>(
    'Target',
    (_) => 0,
  ),
  new MoneyColumn<DisplayTargetState>(
    'Uplots',
    (r) => r.uplots,
  ),
  new MoneyColumn<DisplayTargetState>(
    'Downlots',
    (r) => r.downlots,
  ),
  new MoneyColumn<DisplayTargetState>(
    'Net',
    (r) => r.uplots + r.downlots,
  ),
];
const NESTED_COLUMNS = [
  new StringColumn<AccountPosition>(
    'Symbol',
    (r) => r.ticker,
  ),
  new MoneyColumn<AccountPosition>(
    'Value',
    (r) => r.value,
  ),
  // placeholder for "target" which doesn't exist here
  new TableColumn(
    'Target',
    () => '--'
  ),
  new MoneyColumn<AccountPosition>(
    'Uplots',
    (r) => r.uplots,
  ),
  new MoneyColumn<AccountPosition>(
    'Downlots',
    (r) => r.downlots,
  ),
  new MoneyColumn<AccountPosition>(
    'Net',
    (r) => r.uplots + r.downlots,
  ),
]

function TargetTableRowFragment({
  row,
  cols,
}: TSortableTableRowProps<DisplayTargetState>) {
  return (
    <React.Fragment>
      {cols.map(c => (
        <td key={c.key} className={c.label === 'Name' ? 'max-w-0 truncate text-left' : 'text-center text-sm w-24'}>
          {c.getFormattedValue(row)}
        </td>
      ))}
    </React.Fragment>
  );
}

function TargetTableFooter({
  rows,
  cols
}: TSortableTableChildProps<DisplayTargetState>) {
  return (
    <tfoot>
      <tr className="border-t-2">
        <td key='chevy' />
        {cols.map(c => (
          c.label === 'Name' 
          ? (
            <td key={c.key} className='text-center text-sm font-semibold'>
              Total
            </td>
          ) 
          : (
            <td key={c.key} className='text-center text-sm font-semibold'>
              {c instanceof NumberColumn ? formatDollas(rows.reduce((sum, row) => sum + c.getValue(row), 0)) : '--'}
            </td>
          )
        ))}
      </tr>
  </tfoot>
  )
}

function PositionTableBody({
  rows,
  cols,
}: TSortableTableChildProps<AccountPosition>) {
  return (
    <tbody>
      {rows.map(r => (
        <tr key={r.key}>
          {cols.map(c => (
            <td key={c.key} className={c.label === 'Symbol' ? 'max-w-0 truncate text-sm font-medium pl-2' : 'text-center text-xs w-24'}>
              {c.getFormattedValue(r)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

function NestedPositionTable({
  row
}: TCollapsibleNestedChildProps<DisplayTargetState>) {
  return (
    <SortableTable
      rows={row.holdings}
      cols={NESTED_COLUMNS}
      bodyComponent={PositionTableBody}
    />
  )
}

type TProps = {
  positions: DisplayTargetState[];
};
function PositionTable({ positions }: TProps) {  
  return (
    <CollapsibleTable
      className="table-auto w-full border border-black"
      rows={positions}
      cols={TARGET_COLUMNS}
      fragmentComponent={TargetTableRowFragment}
      nestedComponent={NestedPositionTable}
      footerComponent={TargetTableFooter}
    />
  );
}
export default PositionTable;

