import { useMemo, useState } from 'react';
import { rank_options } from '../lib/string_search';
import { Tokenizer, TTokenizerProps } from '../ui/Tokenizer';
import TickerTokenList from './TickerTokenList';
import TickerTypeaheadList from './TickerTypeaheadList';
import { AccountPosition } from '../data/portfolio';
import { TargetPosition } from '../data/targets';
import { useAppSelector } from '../data/store';
import TradeTable, { Trade } from './TradeTable';
import SectionCard from './SectionCard';

type TProps = {};
function TradeSection({}: TProps) {
  const { targets, positions } = useAppSelector((state) => state);
  const all_positions = Object.values(positions);
  const all_tickers = all_positions.reduce<string[]>(
    (list, pos) => list.concat([pos.ticker]),
    []
  );

  const [wash_sale_search, setWashSaleSearch] = useState('');
  const [wash_sale, setWashSale] = useState<string[]>([]);
  const wash_sale_options = useMemo(
    () =>
      rank_options(
        wash_sale_search.toUpperCase(),
        all_tickers,
        wash_sale,
        (t) => t
      ),
    [wash_sale, wash_sale_search, all_tickers]
  );

  const [offset_gains_search, setOffsetGainsSearch] = useState('');
  const [offset_gains, setOffsetGains] = useState<string[]>([]);
  const offset_gains_options = useMemo(
    () =>
      rank_options(
        offset_gains_search.toUpperCase(),
        all_tickers,
        offset_gains,
        (t) => t
      ),
    [offset_gains, offset_gains_search, all_tickers]
  );

  const sell_orders = [
    ...all_positions
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
  const sell_tickers = sell_orders.map((l) => l.ticker);
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
  const trades = [...sell_orders, ...buy_orders].sort(
    ({ value: a_val }, { value: b_val }) => b_val - a_val
  );
  return (
    <SectionCard title="Trades">
      <div className="flex flex-row items-stretch gap-4 h-10 w-full mb-2 text-sm">
        <div className="w-full">
          <Tokenizer
            aria-label="Wash Sale"
            placeholder="Previously Sold"
            className="flex-grow form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
            options={wash_sale_options}
            value={wash_sale_search}
            onChange={(e) => setWashSaleSearch(e.target.value)}
            tokens={wash_sale}
            onRemoveToken={(d) => {
              setWashSale((tickers) => tickers.filter((t) => t !== d));
            }}
            onSelectOption={(a: string) => {
              setWashSale((tickers) => tickers.concat([a]));
              setWashSaleSearch('');
            }}
            listComponent={TickerTypeaheadList}
            tokensComponent={TickerTokenList}
          />
        </div>
        <div className="w-full">
          <Tokenizer
            aria-label="Close Position"
            placeholder="Close Position"
            className="flex-grow form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
            options={offset_gains_options}
            value={offset_gains_search}
            onChange={(e) => setOffsetGainsSearch(e.target.value)}
            tokens={offset_gains}
            onRemoveToken={(d) => {
              setOffsetGains((tickers) => tickers.filter((t) => t !== d));
            }}
            onSelectOption={(a: string) => {
              setOffsetGains((tickers) => tickers.concat([a]));
              setOffsetGainsSearch('');
            }}
            listComponent={TickerTypeaheadList}
            tokensComponent={TickerTokenList}
          />
        </div>
      </div>
      <TradeTable trades={trades} />
    </SectionCard>
  );
}

export default TradeSection;
