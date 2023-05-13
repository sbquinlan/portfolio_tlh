import { TargetPositionAggregation } from '../selectors/display';
import { group_by, sum_entries, sum } from '../lib/aggregate';

import type { AssetType } from '../data/positions';
import type { Fund } from '../data/funds';
import { RootState } from '../data/store';
import { createSelector } from '@reduxjs/toolkit';
import { selectCash, selectFunds, selectPrices } from './basic';

export const ACTION_TYPE: { [k: string]: 'BUY' | 'SELL' } = { 
  BUY: 'BUY',
  SELL: 'SELL',
}
export type Trade = {
  key: string;
  action: 'BUY' | 'SELL';
  account: string;
  type: AssetType;
  symbol: string;
  quantity: number;
  limit: number;
  value: number;
  gain: number;
  loss: number;
};

interface FlattenedTargetPosition {
  instruments: { symbol: string, isin?: string }[],
  weight: number,
  value: number,
}

/**
 * This will create all the sell orders as asked to based on the losses
 * and returning both the sell orders and the updated targets less the sold shares.
 */
type SellConfig = { loss_threshold: number, close_all: Set<string> }
function sell_and_update(
  targets: TargetPositionAggregation[],
  prices: Record<string, number>,
  { loss_threshold, close_all }: SellConfig
) {
  loss_threshold = loss_threshold / 100;
  const action = ACTION_TYPE.SELL;
  const trades: Trade[] = [];
  const updated = [];
  for (const target of targets) {
    const new_positions = [];
    for (const pos of target.positions) {
      const sell_all = close_all.has(pos.ticker);
      if (
        !(pos.loss < 0 && (-pos.loss / pos.loss_value) >= loss_threshold) &&
        !sell_all  
      ) {
        continue;
      }

      trades.push({
        key: `${action}${pos.key}`,
        action,
        account: pos.account,
        type: pos.type,
        symbol: pos.ticker,
        quantity: sell_all ? pos.quantity : pos.loss_quantity,
        limit: prices[pos.isin] ?? NaN, 
        value: sell_all ? pos.value : pos.loss_value,
        gain: sell_all ? pos.gain : 0,
        loss: pos.loss,
      });
      
      if (sell_all) {
        continue;
      }
      new_positions.push({
        ... pos,
        quantity: pos.quantity * (pos.gain_value / pos.value),
        value: pos.gain_value,
        loss: 0,
        loss_value: 0,
        lt_loss: 0,
        lt_loss_value: 0,
        st_loss: 0,
        st_loss_value: 0,
      })
    }
    updated.push({
      ... target,
      positions: new_positions,
    });
  }
  return {
    sell_orders: Object.values(
      trades.reduce<Record<string, Trade>>(
        group_by(
          t => t.key,
          (existing, { key, action, symbol, type, account, limit, ... sum_these }) => ({
            ... (existing ?? { key, action, account, type, symbol, limit }),
            ... sum_entries(sum_these, existing)
          })
        ),
        {}
      )
    ),
    updated
  };
}

/**
 * This flattens the direct targets and primary targets into objects that only have value 
 * and weight for the rest for the rebalance calculation.
 */
function flatten_targets(
  targets: TargetPositionAggregation[],
  funds: Record<string, Fund>,
) {
  return Object.values(
    targets.flatMap<FlattenedTargetPosition>(
      t => {
        if (t.target.direct && t.target.direct in funds) {
          const direct_targets = Object.values(funds[t.target.direct].holdings)
          // index the positions for the look up
          const positions_lookup = Object.fromEntries(t.positions.map(p => [p.isin, p]))

          // the intention here is to flatten other primary tickers in a direct indexed target
          // into the direct tickers by weight so that the portfolio balance is correctly applied
          // this requires knowing that certain tickers will be sold or won't be sold
          const direct_isins = new Set(direct_targets.map(({ isin }) => isin))
          const sell_only = Object.values(positions_lookup)
            .filter(({ isin }) => !direct_isins.has(isin))
            .reduce((sum, pos) => sum + pos.value, 0)
          
          return direct_targets.map(
            ({ isin, ticker, weight }) => {
              const pos = positions_lookup[isin];
              return {
                instruments: [{ isin, symbol: ticker }],
                weight: t.target.weight * weight,
                value: (pos?.value ?? 0) + (sell_only * weight)
              }
            }
          )
        }
        return [{
          // TODO: use ISIN for primary targets
          instruments: t.target.tickers.map(symbol => ({ symbol, isin: undefined })),
          weight: t.target.weight,
          value: sum(t.positions, ({ value }) => value),
        }]
      }
    )
    .reduce<Record<string, FlattenedTargetPosition>>(
      group_by(
        // this is where a bug is, if two targets use the same ticker in the primaries
        // then this won't dedup them, but it's hard to do.
        p => p.instruments.map(({ symbol }) => symbol).join(':'),
        (existing, { instruments, ... sum_these }) => ({
          ... (existing ?? { instruments }),
          ... sum_entries(sum_these, existing),
        })
      ), 
      {}
    )
  );
}

/**
 * This is the part that figures out what balance to target. It basically figures out
 * what target is lagging the most, targets that balance point first. This assumes that 
 * that point is the common demoninator of sorts where all positions can be in balance.
 * From that point on it will just use the defined weights to invest.
 */
function find_target_amounts(
  flattened_targets: FlattenedTargetPosition[],
) {
  let start_total = 0;
  let target_total = 0;
  for (const { weight, value } of flattened_targets) {
    if (weight <= 0) continue;

    start_total += value;
    target_total = Math.max(target_total, value / weight)
  }
  return { start_total, target_total }
}
 
/**
 * This removes all the wash sales from the targets and re-normalizes
 * the weights as a unit vector.
 */
function filter_targets(
  adjusted_targets: FlattenedTargetPosition[],
  wash_sale_tickers: Set<string>,
  normalize: boolean,
  min_weight: number,
) {
  // remove really small weights
  const cleansed = adjusted_targets.filter(({ weight }) => weight > min_weight)
  // remove wash sales
    .filter(
      ({ instruments }) => instruments.map(({ symbol }) => symbol)
        .filter(t => !wash_sale_tickers.has(t)).length
    )
  const mag = sum(cleansed, ({ weight }) => weight);
  return cleansed.map(({ instruments, weight, value }) => ({ 
    instruments: instruments.filter(({ symbol: t }) => !wash_sale_tickers.has(t)),
    weight: normalize ? weight / mag : weight,
    value,
  }));
}

/**
 * This just creates the Trade based on the position, intermediate target, and 
 * available liquid cash.
 */
type BuyConfig = { wash_sale: string[], normalize: boolean }
function make_buy_trades(
  targets: FlattenedTargetPosition[],
  prices: Record<string, number>,
  account: string,
  start_total: number,
  target_total: number,
  total_liquid: number,
) {
  const catchup_liquid = Math.max(0, Math.min(target_total - start_total, total_liquid))
  const normal_liquid = total_liquid - catchup_liquid
  
  const action = ACTION_TYPE.BUY;
  return targets.map<Trade>(({ instruments, weight, value }) => {
    // max_total * weight is what this dt should be at, subtract value to see what the diff is
    // max that with zero when value is ahead of target, min that with available liquid
    const subtarget_total = Math.max(0, (target_total * weight) - value);
    const catchup_value = catchup_liquid * (subtarget_total / target_total);
    const normal_value = normal_liquid * weight;
    const total_value = catchup_value + normal_value;
    const { symbol, isin } = instruments[0];
    const price = (isin ? prices[isin] : NaN) ?? NaN
    return { 
      key: `${action}${symbol}`,
      symbol,
      action,
      // TODO: use lookup for primary targets
      type: 'STK',
      account,
      limit: price,
      quantity: Math.floor(total_value / price),
      gain: 0,
      loss: 0,
      value: price === NaN ? -total_value : -price * Math.floor(total_value / price)
    };
  })
  .filter(({ value }) => value < 0);
}

export const selectTradesWhereConfigs = createSelector(
  [
    selectCash,
    selectFunds,
    selectPrices,
    (_: RootState, targets: TargetPositionAggregation[], __: any, ___: any) => targets,
    (_: RootState, __: any, sell_config: SellConfig, ___: any) => sell_config,
    (_: RootState, __: any, ___: any, buy_config: BuyConfig) => buy_config,
  ],
  (cash, funds, prices, targets, sell_config, { wash_sale, normalize }) => {
    const { sell_orders, updated } = sell_and_update(targets, prices, sell_config);
    const flattened = flatten_targets(updated, funds)
  
    const { start_total, target_total } = find_target_amounts(flattened);
    const total_liquid = sum(sell_orders, ({ value }) => value) + cash;  
    const accounts = new Set(
      targets.reduce<string[]>(
        (all_accounts, target) => {
          const pos_accounts = target.positions.reduce<string[]>(
            (sub_accounts, pos) => [... sub_accounts, pos.account],
            [],
          );
          return [... all_accounts, ... pos_accounts];
        },
        [],
      ).flat()
    );
    const buy_orders = make_buy_trades(
      filter_targets(
        flattened, 
        new Set(wash_sale.concat(sell_orders.map((l) => l.symbol))),
        normalize,
        1 / (start_total + total_liquid)
      ),
      prices,
      // TODO: this sucks
      [... accounts][0],
      start_total,
      target_total,
      total_liquid,
    );
      
    return [...sell_orders, ...buy_orders].sort(
      ({ value: a_val }, { value: b_val }) => b_val - a_val
    );
  }
)