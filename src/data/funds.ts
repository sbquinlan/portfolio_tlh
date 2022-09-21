import { AccountPosition } from './portfolio';

// To come from the etf-holdings database
export class FundHoldings {
  constructor(
    public readonly ticker: string,
    public readonly name: string,
    public readonly holdings: AccountPosition[]
  ) {}
}
