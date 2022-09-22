import React, { ReactNode, SetStateAction, useState } from 'react';
import { Down, Up } from './icons';
import formatDollas from '../lib/format_dollas';

export interface IKeyable { key: string };
export class TableColumn<TRow extends IKeyable, TValue extends ReactNode> implements IKeyable {
  constructor(
    public readonly label: string,
    public readonly getValue: (r: TRow) => TValue,
  ) {}
  
  get key(): string {
    return this.label;
  }

  getFormattedValue(r: TRow): ReactNode {
    return this.getValue(r);
  }
}

export class SortableColumn<TRow extends IKeyable, TValue extends string | number>
  extends TableColumn<TRow, TValue>
{
  constructor(
    label: string,
    getValue: (r: TRow) => TValue,
    public readonly sort: (a: TRow, b: TRow) => number
  ) {
    super(label, getValue);
  }
}

export class NumberColumn<TRow extends IKeyable> extends SortableColumn<TRow, number> {
  constructor(
    label: string,
    getValue: (r: TRow) => number,
  ) {
    super(
      label, 
      getValue, 
      (a: TRow, b: TRow) => getValue(b) - getValue(a)
    )
  }
}
export class MoneyColumn<TRow extends IKeyable> extends NumberColumn<TRow> {
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

export class StringColumn<TRow extends IKeyable> extends SortableColumn<TRow, string> {
  constructor(
    label: string,
    getValue: (r: TRow) => string,
  ) {
    super(
      label, 
      getValue, 
      (a: TRow, b: TRow) => getValue(a).localeCompare(getValue(b))
    )
  }
}

export function TableHeader({
  children,
  ...rest
}: React.PropsWithChildren & React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead {...rest}>
      <tr>{children}</tr>
    </thead>
  );
}

export type SortInfo<TRow extends IKeyable> = [1 | -1, SortableColumn<TRow, any> | undefined];
type TSortableColumnHeaderProps<TRow extends IKeyable> = {
  col: TableColumn<TRow, any>,
  direction: 1 | -1 | undefined,
  setSort: (s: [1 | -1, SortableColumn<TRow, any>]) => void,
} & React.ThHTMLAttributes<HTMLTableCellElement>
export function SortableColumnHeader<TRow extends IKeyable>({
  col,
  direction,
  setSort,
  ... props
}: TSortableColumnHeaderProps<TRow>) {
  if (!(col instanceof SortableColumn)) {
    return <th {... props} key={col.key}>{col.label}</th>;
  }
  const sort_handler = () => { setSort([direction === 1 ? -1 : 1, col]) };
  return (
    <th {...props} onClick={sort_handler} key={col.key}>
      {col.label}
      {direction === 1 ? (
        <Down className="inline-block w-5 h-5" />
      ) : direction === -1 ? (
        <Up className="inline-block w-5 h-5" />
      ) : undefined}
    </th>
  )
}


export type TSortableHeaderProps<TRow extends IKeyable> = {
  cols: TableColumn<TRow, any>[];
  sort: SortInfo<TRow>,
  setSort: React.Dispatch<SetStateAction<SortInfo<TRow>>>
} & React.HTMLAttributes<HTMLTableSectionElement>
export function SortableTableHeader<TRow extends IKeyable>({
  cols,
  sort,
  setSort,
  ...rest
}: TSortableHeaderProps<TRow> & React.HTMLAttributes<HTMLTableSectionElement>) {
  const [sdir, scol] = sort;
  return (
    <TableHeader {...rest}>
      {cols.map(col => (
        <SortableColumnHeader 
          key={col.key}
          col={col}
          direction={scol === col ? sdir : undefined}
          setSort={setSort}
        />
      ))}
    </TableHeader>
  );
}
export type TSortableTableRowProps<TRow extends IKeyable> = {
  row: TRow;
  cols: TableColumn<TRow, any>[];
}
export type TSortableTableChildProps<TRow extends IKeyable> = {
  rows: TRow[];
  cols: TableColumn<TRow, any>[];
}
export type TSortableTableProps<TRow extends IKeyable> = {
  bodyComponent: React.FC<TSortableTableChildProps<TRow>>,
  footerComponent?: React.FC<TSortableTableChildProps<TRow>>,
} & TSortableTableChildProps<TRow> & React.TableHTMLAttributes<HTMLTableElement>
export function SortableTable<TRow extends IKeyable>({
  rows,
  cols,

  bodyComponent,
  footerComponent,
  ... rest
}: TSortableTableProps<TRow>) {
  const [sort, setSort] = useState<SortInfo<TRow>>([1, undefined]);
  const [sort_dir, sort_col] = sort;
  const sorted = rows.sort(
    (a, b) => sort_dir * (sort_col?.sort(a, b) ?? 0)
  )
  
  const BodyComponent = bodyComponent;
  const FooterComponent = footerComponent;
  return (
    <table className="w-full table-auto" { ... rest }>
      <SortableTableHeader
        className="border-b border-black cursor-pointer text-xs"
        cols={cols}
        sort={sort}
        setSort={setSort}
      />
      <BodyComponent cols={cols} rows={sorted} />
      {FooterComponent ? <FooterComponent cols={cols} rows={rows} /> : null}
    </table>
  )
}
