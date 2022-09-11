import { TargetPosition } from './targets';
import { AccountPosition } from './portfolio';
import { IKeyable } from '../components/SortableTable';

// Pairing of a target and the current
export class DisplayTargetState implements IKeyable {
  constructor(
    public readonly target: TargetPosition,
    public readonly holdings: AccountPosition[]
  ) {}

  public get key(): string {
    return this.symbol;
  }

  public get symbol(): string {
    return this.target.key
  }

  public get name(): string {
    return this.target.name
  }

  public get value(): number {
    return this.holdings.reduce((acc, next) => acc + next.value, 0);
  }

  public get uplots(): number {
    return this.holdings.reduce((acc, next) => acc + next.uplots, 0);
  }

  public get downlots(): number {
    return this.holdings.reduce((acc, next) => acc + next.downlots, 0);
  }
}
