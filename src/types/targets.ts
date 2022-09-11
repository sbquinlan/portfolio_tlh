import { FundHoldings } from './funds';

// "Portfolio Targets" define what the portfolio should hold.
export class TargetPosition {
  constructor(
    public readonly tickers: string[], 
    public readonly name: string,
    public readonly weight: number,
  ) {}

  public get key(): string {
    return this.tickers.join(', ');
  }
}
