import React, { ReactNode, useState } from 'react';
import Chevy from './Chevy.js';
import formatDollas from '../lib/formatDollas.js';

import type { AccountPosition } from '../types/portfolio';

abstract class BaseColumn<TRow> {
  abstract renderHeader(): ReactNode;
  abstract renderCell(r: TRow): ReactNode;
}

abstract class Column<TRow, TRowValue> extends BaseColumn<TRow> {
  constructor(
    protected readonly name: string,
    protected readonly getValue: (r: TRow) => TRowValue
  ) {
    super();
  }

  public renderHeaderContents() {
    return this.name;
  }

  public renderHeader() {
    return <th>{this.renderHeaderContents()}</th>;
  }

  public renderCell(r: TRow) {
    return <tr>{this.getValue(r) as any}</tr>;
  }
}

class SortableColumn<TRow, TRowValue> extends Column<TRow, TRowValue> {
  constructor(
    name: string,
    getValue: (r: TRow) => TRowValue,
    public readonly sort: (a: TRowValue, b: TRowValue) => number
  ) {
    super(name, getValue);
  }
}

type TTableProps<TRow> = {
  cols: BaseColumn<TRow>[];
  data: TRow[];
};
function Table<TRow>(
  props: TTableProps<TRow> & React.TableHTMLAttributes<HTMLTableElement>
) {
  const { cols, data, ...rest } = props;
  return (
    <table {...rest}>
      <thead>
        <tr>
          {cols.map((c) =>
            c instanceof SortableColumn ? c.renderHeader() : c.renderHeader()
          )}
        </tr>
      </thead>
      <tbody>
        {data.map((r) => (
          <tr>{cols.map((c) => c.renderCell(r))}</tr>
        ))}
      </tbody>
    </table>
  );
}

function NestedTable({ holdings }: TProps) {
  return (
    <tr>
      <td colSpan={6}>
        <table className="table-auto">
          <thead></thead>
          <tbody>{}</tbody>
        </table>
      </td>
    </tr>
  );
}

type TProps = {
  holdings: AccountPosition[];
};
function UnallocatedRow({ holdings }: TProps) {
  const [open, setOpen] = useState(false);

  return [
    <tr>
      <td>
        <Chevy
          open={open}
          onClick={() => setOpen(!open)}
          enabled={holdings.length > 0}
        />
      </td>
      <td className="flex-1 text-xs font-semibold">Unallocated Positions</td>
      <td className="text-xs">
        {formatDollas(holdings.reduce((acc, next) => acc + next.value, 0))}
      </td>
      <td className="text-xs">NA</td>
      <td className="text-xs">
        {formatDollas(holdings.reduce((acc, next) => acc + next.uplots, 0))}
      </td>
      <td className="text-xs">
        {formatDollas(holdings.reduce((acc, next) => acc + next.downlots, 0))}
      </td>
    </tr>,
  ];
}

export default UnallocatedRow;
