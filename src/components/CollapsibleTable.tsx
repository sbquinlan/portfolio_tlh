import React, { useMemo, useState } from 'react';

import {
  IKeyable,
  TableColumn,
  SortableTableHeader,
  TSortableTableChildProps,
  TSortableTableRowProps,
  SortInfo,
} from './SortableTable';
import Chevy from './Chevy';

export type TCollapsibleTableRowProps<TRow extends IKeyable> = {
  fragmentComponent: React.FC<TSortableTableRowProps<TRow>>
} & TSortableTableRowProps<TRow>;
export function CollapsibleTableRow<TRow extends IKeyable>({
  row,
  cols,
  fragmentComponent,
  children,
}: TCollapsibleTableRowProps<TRow> & React.PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const RowFragment = fragmentComponent;
  const first_row = (
    <tr key={row.key}>
      <td className="w-6">
        <Chevy
          open={open}
          onClick={() => setOpen((o) => !o)}
          enabled={children !== undefined}
        />
      </td>
      <RowFragment cols={cols} row={row} />
    </tr>
  );
  const second_row = children 
    ? (
      <tr key={`${row.key}_collapsible`}>
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
    )
    : null;
  return (
    <React.Fragment>
      {first_row}
      {second_row}
    </React.Fragment>
  );
}

export type TCollapsibleNestedChildProps<TRow extends IKeyable> = {
  row: TRow,
}
export type TCollapsibleTableBodyProps<TRow extends IKeyable> = {
  fragmentComponent: React.FC<TSortableTableRowProps<TRow>>
  nestedComponent: React.FC<TCollapsibleNestedChildProps<TRow>>
} & TSortableTableChildProps<TRow>
export function CollapsibleTableBody<TRow extends IKeyable>({
  rows,
  cols,
  fragmentComponent,
  nestedComponent
}: TCollapsibleTableBodyProps<TRow>) {
  const NestedComponent = nestedComponent;
  return (
    <tbody>
      {rows.map((r) => (
        <CollapsibleTableRow key={r.key} row={r} cols={cols} fragmentComponent={fragmentComponent}>
          <NestedComponent row={r} />
        </CollapsibleTableRow>
      ))}
    </tbody>
  );
}

export type TCollapsibleTableProps<TRow extends IKeyable> = {
  fragmentComponent: React.FC<TSortableTableRowProps<TRow>>,
  nestedComponent: React.FC<TCollapsibleNestedChildProps<TRow>>,
  footerComponent?: React.FC<TSortableTableChildProps<TRow>>,
} & TSortableTableChildProps<TRow> & React.TableHTMLAttributes<HTMLTableElement>
export function CollapsibleTable<TRow extends IKeyable>({
  rows,
  cols,

  fragmentComponent,
  nestedComponent,
  footerComponent,
  ... rest
}: TCollapsibleTableProps<TRow>) {
  const [sort, setSort] = useState<SortInfo<TRow>>([1, undefined]);
  const [sort_dir, sort_col] = sort;
  const sorted = rows.sort(
    (a, b) => sort_dir * (sort_col?.sort(a, b) ?? 0)
  )
  const cols_for_header = useMemo(() => {
    const new_cols = cols.slice();
    // add header for the chevy cell
    new_cols.unshift(
      new TableColumn(' ', () => '')
    );
    return new_cols;
  }, [cols])

  const FooterComponent = footerComponent;
  return (
    <table className="w-full table-auto" { ... rest }>
      <SortableTableHeader
        className='border-b border-black'
        cols={cols_for_header}
        sort={sort}
        setSort={setSort}
      />
      <CollapsibleTableBody 
        cols={cols} 
        rows={sorted}  
        fragmentComponent={fragmentComponent}
        nestedComponent={nestedComponent}
      />
      {FooterComponent ? <FooterComponent cols={cols} rows={rows} /> : null}
    </table>
  )
}
