import { DisplayTargetState } from './display';
import { AccountPosition } from './positions';
import { TargetPosition } from './targets';

export type Trade = {
  key: string;
  order: 'buy' | 'sell';
  ticker: string;
  value: number;
  gain: number;
  loss: number;
};

export const ERROR_TICKER = '<ERROR>';
export function calculate_trades(
  targets: DisplayTargetState[],
  offset_gains: AccountPosition[],
  wash_sale: string[]
) {
  const adjusted_values = targets
    .filter((t) => t.target.weight > 0)
    .map<[TargetPosition, number]>((t) => [
      t.target,
      t.holdings.reduce((sum, p) => sum + p.value - p.lossvalue, 0),
    ]);

  const t_adj = adjusted_values.reduce((sum, [_, amt]) => sum + amt, 0);
  const t_max = adjusted_values
    .map(([t, _]) => (t.weight ? t_adj / t.weight : 0))
    .reduce((max, t) => Math.max(max, t), 0);
  const catchup_amount = t_max - t_adj;

  const sell_orders = Object.values(
    [
      ...targets
        .flatMap((t) => t.holdings)
        .filter((p) => p.loss < 0)
        .map<Trade>((l) => ({
          ...l,
          key: `sell${l.key}`,
          order: 'sell',
          value: l.lossvalue,
          gain: 0,
        })),
      ...offset_gains.map<Trade>((l) => ({
        ...l,
        key: `sell${l.key}`,
        order: 'sell',
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

  const buy_orders = adjusted_values
    .map<[TargetPosition, number]>(([t, v]) => [
      t,
      catchup_amount > 0 ? (t_max * t.weight - v) / catchup_amount : 0,
    ])
    .map<Trade>(([t, p]) => {
      const filtered_tickers = t.tickers.filter(
        (ticker) => !~sell_tickers.indexOf(ticker)
      );
      const picked_ticker =
        filtered_tickers.length > 0 ? filtered_tickers[0] : ERROR_TICKER;

      return {
        key: t.key,
        order: 'buy',
        ticker: picked_ticker,
        gain: 0,
        loss: 0,
        value:
          -1 *
          (Math.min(catchup_amount, total_liquid) * p +
            Math.max(0, total_liquid - catchup_amount) * t.weight),
      };
    })
    .filter(({ value }) => value < 0);
  return [...sell_orders, ...buy_orders].sort(
    ({ value: a_val }, { value: b_val }) => b_val - a_val
  );
}
