import { TargetPosition } from './targets';
import { AccountPosition } from './positions';
import { IKeyable } from '../ui/SortableTable';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './store';
import { create } from 'domain';

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

export const selectTargets = (state: RootState) => state.targets;
export const selectPositions = (state: RootState) => state.positions;
export const selectAllTickersFromPositions = createSelector(
  [selectPositions],
  (positions) => Object.keys(positions)
);
export const selectPositionsByTicker = createSelector(
  [selectPositions, (_, tickers: string[]) => tickers],
  (positions, tickers) => tickers.map((t) => positions[t]).filter((p) => !!p)
);

const UNALLOCATED_TARGET = Object.freeze({
  key: 'unallocated',
  tickers: [],
  name: 'Unallocated Positions',
  weight: 0,
});
export const selectTargetsJoinPositions = createSelector(
  [selectTargets, selectPositions],
  (targets, positions) => {
    const display_targets: DisplayTargetState[] = Object.values(targets)
      .map((t) => new DisplayTargetState(t, []))
      .concat([new DisplayTargetState(UNALLOCATED_TARGET, [])]);

    for (const pos of Object.values(positions)) {
      let matching = display_targets.filter((dt) =>
        dt.target.tickers.includes(pos.ticker)
      );
      if (matching.length === 0) {
        matching = display_targets.filter(
          (dt) => dt.target === UNALLOCATED_TARGET
        );
      }
      if (matching.length === 1) {
        matching[0]!.holdings.push(pos);
      } else {
        const magnitude = matching.reduce<number>(
          (acc, dt) => acc + dt.target.weight,
          0
        );
        for (const dt of matching) {
          const weight = dt.target.weight / (magnitude || 1);
          dt.holdings.push({
            ...pos,
            value: pos.value * weight,
            loss: pos.loss * weight,
            lossvalue: pos.lossvalue * weight,
            gain: pos.gain * weight,
            gainvalue: pos.gainvalue * weight,
          });
        }
      }
    }
    return display_targets;
  }
);
