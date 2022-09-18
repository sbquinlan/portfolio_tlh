import { useMemo, useState } from 'react';
import formatDollas from '../lib/formatDollas';
import { rank_options } from '../lib/string_search';
import { Tokenizer } from '../lib/Tokenizer';
import TickerTokenList from './TickerTokenList';
import TickerTypeaheadList from './TickerTypeaheadList';
import { AccountPosition } from '../types/portfolio';
import { TargetPosition } from '../types/targets';
import { useAppSelector } from '../types/store';

type TProps = {
};
function TradeSection({ }: TProps) {
  const { targets, positions } = useAppSelector(state => state);

  const [wash_sale_search, setWashSaleSearch] = useState('');
  const [wash_sale, setWashSale] = useState<string[]>([]);

  const [offset_gains_search, setOffsetGainsSearch] = useState('');
  const [offset_gains, setOffsetGains] = useState<string[]>([]);

  const {
    all_positions,
    all_tickers,
  } = useMemo(() => {
    const all_positions = Object.values(positions);
    return {
      all_positions,
      all_tickers: all_positions.reduce<string[]>(
        (list, pos) => list.concat([pos.ticker]),
        [],
      ),
    }
  }, [positions]);
  
  const sell_orders = all_positions.filter(p => p.loss < 0)
    .map(l => ({ ticker: l.ticker, value: l.lossvalue, net: l.loss }))
    .concat(
      offset_gains
        .map(ticker => positions[ticker]!)
        .map(l => ({ ticker: l.ticker, value: l.value, net: l.loss + l.gain }))
    )
  const sell_tickers = sell_orders.map(l => l.ticker)
  const total_liquid = sell_orders.reduce<number>((sum, p) => sum + p.value, 0)

  const adjusted_values = Object.values(targets)
    .filter(t => t.weight > 0)
    .filter(t => !t.tickers.every(ticker => ~sell_tickers.indexOf(ticker)))
    .map<[TargetPosition, number]>(
      t => [
        t,
        t.tickers.map(sym => positions[sym])
          .filter((p): p is AccountPosition => !!p)
          .reduce((sum, p) => sum + p.value - p.lossvalue, 0)
      ])
  
  const t_adj = adjusted_values.reduce((sum, [_, amt]) => sum + amt, 0);
  const t_max = adjusted_values.map(([t, _]) => t.weight ? t_adj / t.weight : 0)
    .reduce((max, t) => Math.max(max, t), 0);
  const catchup_amount = t_max - t_adj;
  
  const buy_trades = adjusted_values
    .map<[TargetPosition, number]>(
      ([t, v]) => [
        t,
        catchup_amount > 0 ? (t_max * t.weight - v) / catchup_amount : 0,
      ])
    .map<[string[], number]>(
      ([t, p]) => [
        t.tickers.filter(ticker => !~sell_tickers.indexOf(ticker)),
        Math.min(catchup_amount, total_liquid) * p + 
          Math.max(0, total_liquid - catchup_amount) * t.weight
      ])
    .filter(([_, amt]) => amt > 0);
  
  return (
    <div>
      <div className="flex flex-row items-center py-2 px-4">
        <h1 className="flex-1 text-lg font-bold">Trades</h1>
      </div>
      <div className='flex flex-row items-stretch gap-4 h-10 w-full mb-2 text-sm'>
        <div className='w-full'>
          <Tokenizer
            aria-label="Wash Sale"
            placeholder="Previously Sold"
            className="flex-grow form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus:ring-0 cursor-text"
            options={rank_options(wash_sale_search, all_tickers, wash_sale)}
            value={wash_sale_search}
            onChange={e => setWashSaleSearch(e.target.value)}
            tokens={wash_sale}
            onTokensChange={(t) => {
              setWashSaleSearch('')
              setWashSale(t)
            }}
            listComponent={TickerTypeaheadList}
            tokensComponent={TickerTokenList}
          />
        </div>
        <div className='w-full'>
          <Tokenizer
            aria-label="Close Position"
            placeholder="Close Position"
            className="flex-grow form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus:ring-0 cursor-text"
            options={rank_options(offset_gains_search, all_tickers, offset_gains)}
            value={offset_gains_search}
            onChange={e => setOffsetGainsSearch(e.target.value)}
            tokens={offset_gains}
            onTokensChange={(t) => {
              setOffsetGainsSearch('')
              setOffsetGains(t)
            }}
            listComponent={TickerTypeaheadList}
            tokensComponent={TickerTokenList}
          />
        </div>
      </div>
      <div>
        <h2>Sell</h2>
        <ul>
          {sell_orders.map((p) => (
            <li key={p.ticker}>
              <span>{p.ticker}</span>
              <span>{formatDollas(p.value)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Buy</h2>
        <ul>
          {buy_trades.map(([ticker, amount]) => (
            <li key={ticker.join(', ')}>
              <span>{ticker.join(', ')}</span>
              <span>{formatDollas(amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TradeSection;
