import React, { ReactNode, useState } from 'react';

import {
  IKeyable,
  TableColumn,
  SortableTableHeader,
  SortableTable,
  CustomColumn,
} from './SortableTable';
import Chevy from './Chevy';

export type TCollapsibleTableRowProps<TRow extends IKeyable> = {
  data: TRow;
  cols: TableColumn<TRow>[];
};
export function CollapsibleTableRow<TRow extends IKeyable>({
  data,
  cols,
  children,
}: TCollapsibleTableRowProps<TRow> & React.PropsWithChildren) {
  const [open, setOpen] = useState(false);
  return (
    <React.Fragment>
      <tr key={data.key}>
        <td className="w-6">
          <Chevy
            open={open}
            onClick={() => setOpen((o) => !o)}
            enabled={children !== undefined}
          />
        </td>
        {cols.map((c) => c.renderCell(data))}
      </tr>
      <tr key={`${data.key}_collapsible`}>
        <td colSpan={cols.length + 1} className="p-0">
          <div
            className={`ease-out duration-400 transition-all overflow-y-auto max-h-60 ${
              open ? '' : 'h-0'
            }`}
          >
            {children}
          </div>
        </td>
      </tr>
    </React.Fragment>
  );
}

export type TCollapsibleTableProps<
  TRow extends IKeyable,
  TNestedRow extends IKeyable
> = {
  cols: TableColumn<TRow>[];
  rows: TRow[];

  nestedCols: TableColumn<TNestedRow>[];
  nestedRows: (row: TRow) => TNestedRow[];

  footer?: ReactNode;
};
export function CollapsibleTable<
  TRow extends IKeyable,
  TNestedRow extends IKeyable
>({
  rows,
  cols,
  nestedRows,
  nestedCols,
  footer,
}: TCollapsibleTableProps<TRow, TNestedRow>) {
  const [sorter, setSorter] = useState(() => (a: TRow, b: TRow) => 0);
  cols = cols.slice();
  // add header for the chevy cell
  cols.unshift(
    new CustomColumn(
      () => <th key={0} />,
      () => undefined
    )
  );

  return (
    <table className="w-full max-w-full table-auto border border-gray-500">
      <SortableTableHeader
        className="bg-gray-300 text-sm select-none"
        cols={cols}
        onSortChange={(s) => setSorter(() => s)}
      />
      <tbody>
        {rows.sort(sorter).map((r) => {
          const nested = nestedRows(r);
          return (
            <CollapsibleTableRow key={r.key} data={r} cols={cols}>
              {nested.length ? (
                <SortableTable rows={nested} cols={nestedCols} />
              ) : undefined}
            </CollapsibleTableRow>
          );
        })}
      </tbody>
      {footer}
    </table>
  );
}
