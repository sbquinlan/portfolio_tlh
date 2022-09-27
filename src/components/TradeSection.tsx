import { useMemo, useState } from 'react';
import { AccountPosition } from '../data/positions';
import { TargetPosition } from '../data/targets';
import { useAppSelector } from '../data/store';
import TradeTable, { Trade } from './TradeTable';
import SectionCard from './SectionCard';
import TradeEditor from './TradeEditor';

function calculate_trades(
  targets: Record<string, TargetPosition>,
  positions: Record<string, AccountPosition>,
  offset_gains: string[],
  wash_sale: string[],
) {
  const sell_orders = [
    ...Object.values(positions)
      .filter((p) => p.loss < 0)
      .map<Trade>((l) => ({
        ...l,
        order: 'sell',
        value: l.lossvalue,
        gain: 0,
      })),
    // TODO: need to aggregate by ticker
    ...offset_gains
      .map((ticker) => positions[ticker]!)
      .map<Trade>((l) => ({
        ...l,
        order: 'sell',
        value: l.value - l.lossvalue,
        loss: 0,
      })),
  ];
  const sell_tickers = wash_sale.concat(sell_orders.map((l) => l.ticker));
  const total_liquid = sell_orders.reduce<number>((sum, p) => sum + p.value, 0);

  const adjusted_values = Object.values(targets)
    .filter((t) => t.weight > 0)
    // TODO: this is dangerous because it throws off the rebalance by eliminating a target
    .filter((t) => !t.tickers.every((ticker) => ~sell_tickers.indexOf(ticker)))
    .map<[TargetPosition, number]>((t) => [
      t,
      t.tickers
        .map((sym) => positions[sym])
        .filter((p): p is AccountPosition => !!p)
        .reduce((sum, p) => sum + p.value - p.lossvalue, 0),
    ]);

  const t_adj = adjusted_values.reduce((sum, [_, amt]) => sum + amt, 0);
  const t_max = adjusted_values
    .map(([t, _]) => (t.weight ? t_adj / t.weight : 0))
    .reduce((max, t) => Math.max(max, t), 0);
  const catchup_amount = t_max - t_adj;

  const buy_orders = adjusted_values
    .map<[TargetPosition, number]>(([t, v]) => [
      t,
      catchup_amount > 0 ? (t_max * t.weight - v) / catchup_amount : 0,
    ])
    .map<Trade>(([t, p]) => ({
      key: t.key,
      order: 'buy',
      ticker: t.tickers.filter((ticker) => !~sell_tickers.indexOf(ticker))[0],
      gain: 0,
      loss: 0,
      value:
        -1 *
        (Math.min(catchup_amount, total_liquid) * p +
          Math.max(0, total_liquid - catchup_amount) * t.weight),
    }))
    .filter(({ value }) => value < 0);
  return [...sell_orders, ...buy_orders].sort(
    ({ value: a_val }, { value: b_val }) => b_val - a_val
  );
}

type TProps = {};
function TradeSection({}: TProps) {
  const { targets, positions } = useAppSelector(state => state);
  const all_tickers = useMemo(
    () => Object.values(positions).reduce<string[]>(
      (list, pos) => list.concat([pos.ticker]),
      []
    ),
    [positions],
  );

  const [wash_sale, setWashSale] = useState<string[]>([]);
  const [offset_gains, setOffsetGains] = useState<string[]>([]);
  const trades = calculate_trades(targets, positions, offset_gains, wash_sale);
  return (
    <SectionCard title="Trades" controls={
      <TradeEditor 
        allTickers={all_tickers} 
        washSale={wash_sale} 
        setWashSale={setWashSale} 
        offsetGains={offset_gains}
        setOffsetGains={setOffsetGains}
      />
    }>
      <TradeTable trades={trades} />
    </SectionCard>
  );
}

export default TradeSection;
