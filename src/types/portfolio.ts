import { IKeyable } from '../lib/SortableTable';

// From the lots on the account
export interface AccountPosition extends IKeyable {
  ticker: string;
  value: number;
  gain: number;
  gainvalue: number;
  loss: number;
  lossvalue: number;
}
