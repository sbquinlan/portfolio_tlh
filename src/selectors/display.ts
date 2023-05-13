import { createSelector } from '@reduxjs/toolkit';
import { TargetPosition } from '../data/targets';
import { AccountPosition } from '../data/positions';
import { IKeyable } from '../ui/SortableTable';
import { selectFunds, selectPositions, selectTargets } from './basic';

// Pairing of a target and the current
export interface TargetPositionAggregation extends IKeyable {
  target: TargetPosition,
  positions: AccountPosition[],
}

export const UNALLOCATED_TARGET = Object.freeze({
  key: 'unallocated',
  tickers: [],
  name: 'Unallocated Positions',
  weight: 0,
});

export const selectTargetsJoinPositions = createSelector(
  [selectTargets, selectPositions, selectFunds],
  (targets, positions, funds) => {
    const unallocated = { 
      key: UNALLOCATED_TARGET.key, 
      target: UNALLOCATED_TARGET, 
      positions: [] as AccountPosition[],
    }
    const display_targets: TargetPositionAggregation[] = Object.values(targets)
      .map<TargetPositionAggregation>(target => ({ 
        key: target.key, 
        target, 
        positions: [], 
      }))
    
    for (const pos of Object.values(positions)) {
      let matching = display_targets.map(
        dt => {
          // TODO: use ISIN for primary targets
          if (dt.target.tickers.includes(pos.ticker)) {
            return [dt, dt.target.weight]
          }
          if (
            dt.target.direct && 
            dt.target.direct in funds &&
            pos.isin in funds[dt.target.direct].holdings
          ) {
            return [dt, dt.target.weight * funds[dt.target.direct].holdings[pos.isin].weight]
          }
          return undefined
        })
        .filter((t): t is [TargetPositionAggregation, number] => !!t);
      if (matching.length <= 1) {
        const dt = matching.length ? matching[0][0] : unallocated;
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
            quantity: pos.quantity * split_weight,
            value: pos.value * split_weight,

            gain: pos.gain * split_weight,
            gain_value: pos.gain_value * split_weight,
            loss: pos.loss * split_weight,
            loss_value: pos.loss_value * split_weight,

            st_gain: pos.st_gain * split_weight,
            st_gain_value: pos.st_gain_value * split_weight,
            lt_gain: pos.lt_gain * split_weight,
            lt_gain_value: pos.lt_gain_value * split_weight,

            st_loss: pos.st_loss * split_weight,
            st_loss_value: pos.st_loss_value * split_weight,
            lt_loss: pos.lt_loss * split_weight,
            lt_loss_value: pos.lt_loss_value * split_weight,
          });
        }
      }
    }
    return display_targets.concat(unallocated);
  }
);
