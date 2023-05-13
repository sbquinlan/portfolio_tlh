import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { rank_options } from '../lib/string_search';
import { Tokenizer } from '../ui/Tokenizer';
import TickerTokenList from './TickerTokenList';
import TickerTypeaheadList from './TickerTypeaheadList';

type TProps = {
  allTickers: string[];

  washSale: string[];
  setWashSale: Dispatch<SetStateAction<string[]>>;

  offsetGains: string[];
  setOffsetGains: Dispatch<SetStateAction<string[]>>;

  lossThreshold: number;
  setLossThreshold: Dispatch<SetStateAction<number>>;

  onExport: () => void;
};
function TradeEditor({
  allTickers,

  washSale,
  setWashSale,

  offsetGains,
  setOffsetGains,

  lossThreshold,
  setLossThreshold,

  onExport
}: TProps) {
  const [wash_sale_search, setWashSaleSearch] = useState('');
  const wash_sale_options = useMemo(
    () =>
      rank_options(
        wash_sale_search.toUpperCase(),
        allTickers,
        washSale,
        (t) => t
      ),
    [washSale, wash_sale_search, allTickers]
  );

  const [offset_gains_search, setOffsetGainsSearch] = useState('');
  const offset_gains_options = useMemo(
    () =>
      rank_options(
        offset_gains_search.toUpperCase(),
        allTickers,
        offsetGains,
        (t) => t
      ),
    [offsetGains, offset_gains_search, allTickers]
  );

  return (
    <div className="w-full text-sm mb-2">
      <Tokenizer
        aria-label="Wash Sale"
        placeholder="Previously Sold"
        className="form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        options={wash_sale_options}
        value={wash_sale_search}
        onChange={(e) => setWashSaleSearch(e.target.value)}
        tokens={washSale}
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
      <Tokenizer
        aria-label="Close Position"
        placeholder="Close Position"
        className="form-input mt-0 mb-2 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        options={offset_gains_options}
        value={offset_gains_search}
        onChange={(e) => setOffsetGainsSearch(e.target.value)}
        tokens={offsetGains}
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
      <span className="flex flex-row gap-2 px-2 py-0.5 mb-2 items-center">
        <span className="py-1 text-slate-500 text-base">Weight</span>
        <input
          className="flex-grow"
          type="range"
          min={0}
          max={100}
          value={lossThreshold}
          onChange={(e) =>
            setLossThreshold(e.target.valueAsNumber)
          }
        />
        <span className="w-10 text-lg">{lossThreshold}%</span>
      </span>
      <button
        className="h-8 w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-1 mb-2 rounded"
      >
        Generate
      </button>
      <button
        className="h-8 w-full bg-slate-500 hover:bg-blue-700 text-white font-semibold py-1 px-1 mb-2 rounded"
        onClick={onExport}
      >
        Export
      </button>
    </div>
  );
}
export default TradeEditor;
