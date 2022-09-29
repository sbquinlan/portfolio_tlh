import { DisplayTargetState } from './display';
import { AccountPosition } from './positions';

export type Trade = {
  key: string;
  order: 'buy' | 'sell' | 'wash';
  ticker: string;
  value: number;
  gain: number;
  loss: number;
};

export function calculate_trades(
  targets: DisplayTargetState[],
  offset_gains: AccountPosition[],
  wash_sale: string[]
) {
  /**
   * This just sells all loses and requested positions
   */
  const sell_orders = Object.values(
    [
      ...targets
        .flatMap((t) => t.positions)
        .filter((p) => p.loss < 0)
        .map<Trade>((l) => ({
          ...l,
          key: `sell${l.key}`,
          order: 'sell',
          // the gain is zero because we're not selling any gain
          value: l.lossvalue,
          gain: 0,
        })),
      ...offset_gains
        .map<Trade>((l) => ({
          ...l,
          key: `sell${l.key}`,
          order: 'sell',
          // loss is zero b/c the above would have sold the loss
          value: l.value - l.lossvalue,
          loss: 0,
        })),
    ].reduce<Record<string, Trade>>(
      (acc, trade) => ({
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
      }),
      {}
    )
  );
  const sell_tickers = wash_sale.concat(sell_orders.map((l) => l.ticker));
  const total_liquid = sell_orders.reduce<number>((sum, p) => sum + p.value, 0);

  /**
   * This is the part that figures out what balance to target
   */
  const adjusted_values = targets
    .filter((t) => t.target.weight > 0)
    .map<[DisplayTargetState, number]>((t) => [
      t,
      t.positions.reduce((sum, p) => sum + p.value - p.lossvalue, 0),
    ]);

  // the sum of all adjusted values
  const t_adj = adjusted_values
    .reduce((sum, [_, amt]) => sum + amt, 0);
  // find the max ratio between target weight and current weight 
  const t_max = adjusted_values
    .map(([t, _]) => (t.target.weight ? t_adj / t.target.weight : 0))
    .reduce((max, t) => Math.max(max, t), 0);
  // distance in value between current and next balanced position
  const catchup_amount = t_max - t_adj;

  /**
   * This just calculates the buys based on the above and warns about 
   * buys that it can't make.
   */
  const buy_orders = adjusted_values
    .flatMap(([dt, v]) => {
      const catchup_weight = catchup_amount > 0 
        ? (t_max * dt.target.weight - v) / catchup_amount 
        : 0
      if (dt.directTargets?.length) {
        return dt.directTargets.map(
          ({ ticker, weight }) => ({
            ticker,
            order: sell_tickers.includes(ticker) ? 'wash' : 'buy',
            catchup_weight: catchup_weight * weight,
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
    .map<Trade>(({ order, ticker, catchup_weight, target_weight }) => ({
      key: `${order}${ticker}`,
      order: order as 'buy' | 'wash',
      ticker: ticker,
      gain: 0,
      loss: 0,
      value:
        -1 *
        (Math.min(catchup_amount, total_liquid) * catchup_weight +
          Math.max(0, total_liquid - catchup_amount) * target_weight),
    }))
    .filter(({ value }) => value < 0);
  return [...sell_orders, ...buy_orders].sort(
    ({ value: a_val }, { value: b_val }) => b_val - a_val
  );
}
