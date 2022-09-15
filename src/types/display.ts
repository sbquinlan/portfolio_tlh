import { TargetPosition } from './targets';
import { AccountPosition } from './portfolio';
import { IKeyable } from '../lib/SortableTable';

// Pairing of a target and the current
export class DisplayTargetState implements IKeyable {
  constructor(
    public readonly target: TargetPosition,
    public readonly holdings: AccountPosition[]
  ) {}

  public get key(): string {
    return this.target.key;
  }
}
