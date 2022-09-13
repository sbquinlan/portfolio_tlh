import { IKeyable } from '../lib/SortableTable';

// From the lots on the account
export interface AccountPosition extends IKeyable {
  ticker: string;
  value: number;
  uplots: number;
  downlots: number;
}
