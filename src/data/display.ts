import { createSelector } from '@reduxjs/toolkit';
import { TargetPosition } from './targets';
import { AccountPosition } from './positions';
import { IKeyable } from '../ui/SortableTable';
import { RootState } from './store';
import { FundHolding } from './funds';

// Pairing of a target and the current
export interface TargetPositionAggregation extends IKeyable {
  target: TargetPosition,
  positions: AccountPosition[],
  directTargets?: FundHolding[],
}

export const selectFunds = (state: RootState) => state.funds;
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
  [selectTargets, selectPositions, selectFunds],
  (targets, positions, funds) => {
    const display_targets: TargetPositionAggregation[] = Object.values(targets)
      .map<TargetPositionAggregation>(target => ({ 
        key: target.key, 
        target, 
        positions: [], 
        directTargets: target.direct ? Object.values(funds[target.direct].holdings) : [],
      }))
      .concat([{ 
        key: UNALLOCATED_TARGET.key, 
        target: UNALLOCATED_TARGET, 
        positions: []
      }]);
    
    for (const pos of Object.values(positions)) {
      let matching = display_targets.map(
        dt => {
          if (dt.target.tickers.includes(pos.ticker)) {
            return [dt, dt.target.weight]
          }
          if (
            dt.target.direct && 
            dt.target.direct in funds &&
            pos.ticker in funds[dt.target.direct].holdings
          ) {
            return [dt, dt.target.weight * funds[dt.target.direct].holdings[pos.ticker].weight]
          }
          return undefined
        })
        .filter((t): t is [TargetPositionAggregation, number] => !!t);
      if (matching.length === 0) {
        matching = display_targets.filter(
          dt => dt.target === UNALLOCATED_TARGET
        ).map(dt => [dt, dt.target.weight])
      }
      if (matching.length === 1) {
        const [dt, _weight] = matching[0];
        dt.positions.push(pos);
      } else {
        const magnitude = matching.reduce<number>(
          (acc, [_, weight]) => acc + weight,
          0
        );
        for (const [dt, weight] of matching) {
          const split_weight = weight / (magnitude || 1);
          dt.positions.push({
            ...pos,
            value: pos.value * split_weight,
            loss: pos.loss * split_weight,
            lossvalue: pos.lossvalue * split_weight,
            gain: pos.gain * split_weight,
            gainvalue: pos.gainvalue * split_weight,
          });
        }
      }
    }
    return display_targets;
  }
);
