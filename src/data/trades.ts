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
      .filter((p) => p.loss < 0 || offset_gains.has(p.ticker))
      .map<Trade>((p) => {
        const sell_all = offset_gains.has(p.ticker);
        return {
          key: `sell${p.key}`,
          ticker: p.ticker,
          order: 'sell',
          value: sell_all ? p.value : p.lossvalue,
          gain: sell_all ? p.gain : 0,
          loss: sell_all ? p.loss : 0,
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
    .filter((t) => t.target.weight > 0)
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

  const sell_tickers = wash_sale.concat(sell_orders.map((l) => l.ticker));
  const total_liquid = sell_orders.reduce((sum, p) => sum + p.value, 0);

  /**
   * This is the part that figures out what balance to target
   */
  const adj_values = get_adjusted_portfolio(targets, offset_gains);

  // the sum of all adjusted values
  const adj_total = adj_values
    .reduce((sum, [_, amt]) => sum + amt, 0);
  // find the max ratio between target weight and current weight 
  const max_total = adj_values.map(([t, amt]) => (amt / t.target.weight))
    .reduce((max, t) => Math.max(max, t), 0);
  // distance in value between current and next balanced position
  const catchup_amount = max_total - adj_total;
  const initial_total = targets.reduce(
    (t_sum, t) => t_sum + t.positions.reduce<number>(
      (p_sum, p) => p_sum + p.value,
      0,
    ), 
    0
  );
  console.log(total_liquid, adj_total, adj_total + total_liquid, initial_total)
  /**
   * This just calculates the buys based on the above and warns about 
   * buys that it can't make.
   */
  const buy_orders = adj_values
    .flatMap(([dt, v]) => {
      const catchup_weight = catchup_amount > 0 
        ? Math.max((max_total * dt.target.weight - v) / catchup_amount, 0)
        : 0
      if (dt.directTargets?.length) {
        // only use first 500 so might not be out of 100
        const dt_weight_total = dt.directTargets.reduce((sum, { weight }) => sum + weight, 0);
        return dt.directTargets.map(
          ({ ticker, weight }) => ({
            ticker,
            order: sell_tickers.includes(ticker) ? 'wash' : 'buy',
            catchup_weight: catchup_weight * (weight / dt_weight_total),
            target_weight:  dt.target.weight * weight,
          })
        );
      }

      const filtered = dt.target.tickers.filter(
        (t) => !sell_tickers.includes(t)
      );
      return [{ 
        ticker: filtered.length ? filtered[0] : dt.target.tickers.join(', '), 
        order: filtered.length ? 'buy' : 'wash', 
        catchup_weight, 
        target_weight: dt.target.weight 
      }];
    })
    .map<Trade>(({ order, ticker, catchup_weight, target_weight }) => {
      return ({
        key: `${order}${ticker}`,
        order: order as 'buy' | 'wash',
        ticker: ticker,
        gain: 0,
        loss: 0,
        value:
          -1 *
          (Math.min(catchup_amount, total_liquid) * catchup_weight +
            Math.max(0, total_liquid - catchup_amount) * target_weight),
      });
    })
    .filter(({ value }) => value < 0)
    .reduce<Record<string, Trade>>(combine_trades, {})
  return [...sell_orders, ...Object.values(buy_orders)].sort(
    ({ value: a_val }, { value: b_val }) => b_val - a_val
  );
}
