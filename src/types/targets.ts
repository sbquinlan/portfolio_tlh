import { FundHoldings } from "./funds";

// "Portfolio Targets" define what the portfolio should hold.
export interface TargetPosition {
  symbol: string;
  name: string;
  weight: number;
}

export class TargetMultiPosition implements TargetPosition {
  constructor(
    public readonly tickers: string[],
    public weight: number,
  ) {}

  public get symbol(): string {
    return this.tickers.join(', ');
  }
  public get name() {
    return '';
  }
}


abstract class TargetSinglePosition implements TargetPosition {
  abstract readonly ticker: string;
  abstract readonly name: string;
  abstract weight: number;

  public get symbol(): string {
    return this.ticker;
  }
}

export class TargetSimplePosition extends TargetSinglePosition {
  constructor(
    public readonly ticker: string,
    public readonly name: string,
    public weight: number,
  ) {
    super();
  }
}

export class TargetFundPosition extends TargetSinglePosition {
  constructor(
    public readonly fund: FundHoldings,
    public weight: number,
  ) {
    super();
  }
  public get ticker(): string {
    return this.fund.ticker;
  }
  public get name(): string {
    return this.fund.name;
  }
}