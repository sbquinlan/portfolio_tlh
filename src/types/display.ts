import { TargetFundPosition, TargetMultiPosition, TargetPosition, TargetSimplePosition } from "./targets";
import { AccountPosition } from "./portfolio";
import { IKeyableRow } from "../components/SortableTable";

// Pairing of a target and the current
export class DisplayTargetState implements IKeyableRow {
  constructor(
    public readonly target: TargetPosition,
    public readonly holdings: AccountPosition[],
  ) {}

  public get key(): string {
    return this.symbol;
  }

  public get symbol(): string {
    if (this.target instanceof TargetMultiPosition) {
      return this.target.tickers.join(', ')
    } else if (
      this.target instanceof TargetSimplePosition
    ) {
      return this.target.ticker;
    } else if (
      this.target instanceof TargetFundPosition
    ) {
      return this.target.fund.ticker;
    }
    return '';
  }

  public get name(): string {
    if (this.target instanceof TargetFundPosition) {
      return this.target.fund.name;
    } else if (this.target instanceof TargetSimplePosition) {
      return this.target.name;
    }
    return '';
  }

  public get value(): number {
    return this.holdings.reduce((acc, next) => acc + next.value, 0)
  }

  public get uplots(): number {
    return this.holdings.reduce((acc, next) => acc + next.uplots, 0)
  }

  public get downlots(): number {
    return this.holdings.reduce((acc, next) => acc + next.downlots, 0);
  }
}

