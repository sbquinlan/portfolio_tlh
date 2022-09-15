import { AccountPosition } from './portfolio';

// "Portfolio Targets" define what the portfolio should hold.
export class TargetPosition {
  constructor(
    public readonly tickers: string[], 
    public readonly name: string,
    public readonly weight: number,
    public positions: AccountPosition[] = [],
  ) {}

  public get key(): string {
    return this.name;
  }
}
