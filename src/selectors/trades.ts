import { TargetPositionAggregation, joinTargetsToPositions } from '../selectors/display';
import { group_by, sum_entries, sum } from '../lib/aggregate';

import type { AccountPosition, AssetType } from '../data/positions/positions';
import type { Fund } from '../data/funds';
import { RootState } from '../data/store';
import { createSelector } from '@reduxjs/toolkit';
import { selectCash, selectFunds, selectPositions, selectPrices, selectTargets } from './basic';

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
  instruments: { ticker: string, isin?: string }[],
  weight: number,
  value: number,
}

/**
 * This will create all the sell orders as asked to based on the losses
 * and returning both the sell orders and the updated targets less the sold shares.
 */
type SellConfig = { loss_threshold: number, close_all: Set<string> }
function make_sell_trades(
  positions: AccountPosition[],
  prices: Record<string, number>,
  { loss_threshold, close_all }: SellConfig
): Trade[] {
  loss_threshold = loss_threshold / 100;
  const action = ACTION_TYPE.SELL;
  return positions.map(pos => {
    const sell_all = close_all.has(pos.ticker);
    if (sell_all) {
      return {
        key: `${action}${pos.key}`,
        action,
        account: pos.account,
        type: pos.type,
        symbol: pos.ticker,
        quantity: pos.quantity,
        limit: prices[pos.isin] ?? NaN, 
        value: pos.value,
        gain: pos.gain,
        loss: pos.loss,
      };
    }
    if (pos.loss < 0 && (-pos.loss / pos.loss_value) >= loss_threshold) {
      return {
        key: `${action}${pos.key}`,
        action,
        account: pos.account,
        type: pos.type,
        symbol: pos.ticker,
        quantity: pos.loss_quantity,
        limit: prices[pos.isin] ?? NaN, 
        value: pos.loss_value,
        gain: 0,
        loss: pos.loss,
      };
    }
    
    return null;
  }).filter((t): t is Trade => !!t);
}

function apply_trades(
  positions: AccountPosition[],
  trades: Trade[],
): AccountPosition[] {
  const indexed_trades = Object.fromEntries(trades.map(t => [t.symbol, t]))
  return positions.map(pos => {
    if (pos.ticker in indexed_trades) {
      const trade = indexed_trades[pos.ticker];
      return ({
        ... pos,
        quantity: pos.quantity - trade.quantity,
        value: pos.value - trade.value,
        loss: pos.loss - trade.loss,
        // the following stuff isn't accurate or great, 
        // but it's annoying to update properly 
        loss_value: 0,
        lt_loss: 0,
        lt_loss_value: 0,
        st_loss: 0,
        st_loss_value: 0,
      });
    }
    return pos;
  })
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
        if (!t.target.direct || !(t.target.direct in funds)) {
          return [{
            instruments: t.target.tickers,
            weight: t.target.weight,
            value: sum(t.positions, ({ value }) => value),
          }]
        }
      
        const direct_targets = Object.values(funds[t.target.direct].holdings)
        // index the positions for the look up
        const positions_lookup = Object.fromEntries(t.positions.map(p => [p.isin, p]))

        // The positions that have been added here that aren't one of the directly indexed 
        // targets are the ones that need to be sold and direclty indexed. Like when you pair SCHG 
        // VTI in a target but directly index VTI. 

        // So it's basically saying the "ideal" target would be if you sold all the positions that
        // are already in this bucket and redistributed them to the direct targets. I think the 
        // reason it does it is for the rebalance calculation.
        
        // If you start direct indexing but have a large holding of SCHG, then how do you account 
        // for that in the rebalance calculation? You can't just sell it all and buy the holdings 
        // of VTI. So you pretend that the value of SCHG is distributed.
        const direct_isins = new Set(direct_targets.map(({ isin }) => isin))
        const redistribute = Object.values(positions_lookup)
          .filter(({ isin }) => !direct_isins.has(isin))
          .reduce((sum, pos) => sum + pos.value, 0)
        
        return direct_targets.map(
          ({ isin, ticker, weight }) => {
            const pos = positions_lookup[isin];
            return {
              instruments: [{ isin, ticker }],
              weight: t.target.weight * weight,
              value: (pos?.value ?? 0) + (redistribute * weight)
            }
          }
        )
      }
    )
    .reduce<Record<string, FlattenedTargetPosition>>(
      group_by(
        // this is where a bug is, if two targets use the same ticker in the primaries
        // then this won't dedup them, but it's hard to do anything else. Like you'd 
        // have to create a new target that is the combination of the two or something.
        p => p.instruments.map(({ ticker }) => ticker).join(':'),
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
 * This is the part that figures out what target to use as the basis for the rebalance. 
 * It finds the target that is lagging behind the most, targets that balance point first.
 * This assumes that that point is the common demoninator of sorts where all positions 
 * can be in balance. From that point on it will just use the defined weights to invest.
 * 
 * The downside is that if one target is massively out of sorts then the rebalance point 
 * will be very far away from the current value of the portfolio. You could feasibly target 
 * other things.
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
): FlattenedTargetPosition[] {
  const cleansed = adjusted_targets
    // remove wash sales and low weight targets
    .map(
      ({ instruments, ... rest }) => ({
        instruments: instruments.filter(
          ({ ticker }) => !wash_sale_tickers.has(ticker)
        ),
        ... rest
      })
    )
    .filter(({ instruments, weight }) => instruments.length && weight > min_weight)
  const mag = sum(cleansed, ({ weight }) => weight);
  return cleansed.map(({ weight, ... rest }) => ({
    weight: normalize ? weight / mag : weight,
    ... rest
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
): Trade[] {
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
    const { ticker, isin } = instruments[0];
    const price = (isin ? prices[isin] : NaN) ?? NaN
    return { 
      key: `${action}${ticker}`,
      symbol: ticker,
      action,
      // TODO: use lookup for primary targets
      // I don't know what this TODO means. is it about 'type'?
      type: 'STK',
      account,
      limit: price,
      quantity: Math.floor(total_value / price),
      gain: 0,
      loss: 0,
      value: isNaN(price) ? -total_value : -price * Math.floor(total_value / price)
    };
  })
  .filter(({ value }) => value < 0);
}

export const selectTradesWhereConfigs = createSelector(
  [
    selectCash,
    selectFunds,
    selectPrices,
    selectPositions,
    selectTargets,
    (_: RootState, sell_config: SellConfig, ___: any) => sell_config,
    (_: RootState, ___: any, buy_config: BuyConfig) => buy_config,
  ],
  (cash, funds, prices, positions, targets, sell_config, { wash_sale, normalize }) => {
    // First we harvest losses and sell what we're asked to sell
    const starting_positions = Object.values(positions);
    const total = starting_positions.reduce((sum, { value }) => sum + value, 0) + cash;
    const sell_trades = make_sell_trades(starting_positions, prices, sell_config);

    // Now we apply those trades to the existing positions
    const updated_positions = apply_trades(starting_positions, sell_trades);
    
    // Join and flatten the positions with the targets
    const flattened = flatten_targets(
      joinTargetsToPositions(targets, funds, updated_positions), 
      funds
    );

    // Filter out wash sales that we can't balance and weights that are too low
    const filtered = filter_targets(
      flattened, 
      new Set(wash_sale.concat(sell_trades.map((l) => l.symbol))),
      normalize,
      // $1 equivalent is the minimum
      1 / total,
    );
  
    // Now we find the lagging target and figure out what the total value of the portfolio should be
    // if we invested enough to bring it up the lagging target + how much you have to invest.
    const { start_total, target_total } = find_target_amounts(filtered);
    const total_liquid = sum(sell_trades, ({ value }) => value) + cash;  

    // Just figure out what account to use for the orders
    // ideally "account" is some global thing from ibkr instead of parsed out of the positions data
    const accounts = Object.values(positions).reduce<Set<string>>(
      (all_accounts, { account }) => all_accounts.add(account),
      new Set(),
    );

    // Now figure out what buy orders we can do
    const buy_orders = make_buy_trades(
      filtered,
      prices,
      // TODO: this sucks, but I think its the only reasonable option
      [... accounts][0],
      start_total,
      target_total,
      total_liquid,
    );
      
    return [...sell_trades, ...buy_orders].sort(
      ({ value: a_val }, { value: b_val }) => b_val - a_val
    );
  }
)