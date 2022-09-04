import { IKeyableRow } from '../components/SortableTable';

// From the lots on the account
export interface AccountPosition extends IKeyableRow {
  ticker: string;
  value: number;
  uplots: number;
  downlots: number;
}
