import { TargetPositionAggregation } from './display';

export type Trade = {
  key: string;
  order: 'buy' | 'sell' | 'wash';
  ticker: string;
  value: number;
  gain: number;
  loss: number;
};


function combine_trades(acc: Record<string, Trade>, trade: Trade) {
  return {
    ...acc,
    [trade.key]:
      trade.key in acc
        ? {
            ...trade,
            value: acc[trade.key].value + trade.value,
            gain: acc[trade.key].gain + trade.gain,
            loss: acc[trade.key].loss + trade.loss,
          }
        : trade,
  };
}

export function get_sell_trades(
  targets: TargetPositionAggregation[],
  offset_gains: Set<string>,
) {
  return Object.values(
    targets
      .flatMap((t) => t.positions)
      .filter((p) => p.loss < -500 || offset_gains.has(p.ticker))
      .map<Trade>((p) => {
        const sell_all = offset_gains.has(p.ticker);
        return {
          key: `sell${p.key}`,
          ticker: p.ticker,
          order: 'sell',
          value: sell_all ? p.value : p.lossvalue,
          gain: sell_all ? p.gain : 0,
          loss: p.loss,
        }
      })
      .reduce<Record<string, Trade>>(combine_trades, {})
  );
}

export function get_adjusted_portfolio(
  targets: TargetPositionAggregation[],
  offset_gains: Set<string>,
) {
  return targets
    .map<[TargetPositionAggregation, number]>((t) => [
      t,
      t.positions.reduce(
        (sum, p) => offset_gains.has(p.ticker) ? sum : sum + p.gainvalue, 
        0
      ),
    ]);
}

export function calculate_trades(
  targets: TargetPositionAggregation[],
  offset_gains: Set<string>,
  wash_sale: string[]
) {
  /**
   * This just sells all loses and requested positions
   */
  const sell_orders = get_sell_trades(targets, offset_gains);
  const sell_tickers = new Set(wash_sale.concat(sell_orders.map((l) => l.ticker)));
  
  /**
   * This is the part that figures out what balance to target
   */
  const adj_values = get_adjusted_portfolio(targets, offset_gains);

  // the sum of all adjusted values
  const adj_total = adj_values.filter(([t, _]) => t.target.weight > 0)
    .reduce((sum, [_, amt]) => sum + amt, 0);
  // find the max ratio between target weight and current weight 
  const max_total = adj_values.filter(([t, _]) => t.target.weight > 0)
    .map(([t, amt]) => (amt / t.target.weight))
    .reduce((max, t) => Math.max(max, t), 0);
  // distance in value between current and next balanced position
  const total_liquid = sell_orders.reduce((sum, p) => sum + p.value, 0);
  const catchup_liquid = Math.min(total_liquid, max_total - adj_total)
  const normal_liquid = total_liquid - catchup_liquid

  /**
   * This just calculates the buys based on the above and warns about 
   * buys that it can't make.
   */
  const buy_orders = adj_values
    .flatMap<Trade>(([dt, v]) => {
      // max_total * weight is what this dt should be at, subtract v to see what the diff is
      const catchup_value = (max_total * dt.target.weight) - v
      const normal_value = normal_liquid * dt.target.weight;
      if (dt.directTargets?.length) {
        // only use first 500 so might not be out of 100
        const dt_weight_total = dt.directTargets.reduce((sum, { weight }) => sum + weight, 0);
        return dt.directTargets.map(
          ({ ticker, weight }) => ({
            key: `buy${ticker}`,
            ticker,
            order: sell_tickers.has(ticker) ? 'wash' : 'buy',
            gain: 0,
            loss: 0,
            value: -(weight / dt_weight_total) * (catchup_value + normal_value)
          })
        );
      }

      const filtered = dt.target.tickers.filter(
        (t) => !sell_tickers.has(t)
      );
      const ticker = filtered.length ? filtered[0] : dt.target.tickers.join(', ');
      return [{ 
        key: `buy${ticker}`,
        ticker,
        order: filtered.length ? 'buy' : 'wash', 
        gain: 0,
        loss: 0,
        value: -(catchup_value + normal_value)
      }];
    })
    .filter(({ value }) => value < 0)
    .reduce<Record<string, Trade>>(combine_trades, {})
  return [...sell_orders, ...Object.values(buy_orders)].sort(
    ({ value: a_val }, { value: b_val }) => b_val - a_val
  );
}
