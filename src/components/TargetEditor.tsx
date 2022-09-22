import { useEffect, useMemo, useState } from 'react';
import { TargetPosition } from '../data/targets';
import { Tokenizer } from '../ui/Tokenizer';
import { rank_options } from '../lib/string_search';
import TickerTypeaheadList from './TickerTypeaheadList';
import TickerTokenList from './TickerTokenList';
import TICKERS from '../funds.json';

type TTargetEditorProps = {
  target: TargetPosition | undefined;
  saveTarget: (t: Omit<TargetPosition, 'key'>) => void;
  clearTarget: () => void;
};
export function TargetEditor({
  target: selected,
  saveTarget,
  clearTarget,
}: TTargetEditorProps) {
  const [symbol_search, setSymbolSearch] = useState('');
  const [target_draft, setTargetDraft] = useState<Omit<TargetPosition, 'key'>>(
    selected ?? { weight: 0, name: '', tickers: [] }
  );

  useEffect(() => {
    setTargetDraft(selected ?? { weight: 0, name: '', tickers: [] });
  }, [selected]);

  const options = useMemo(() => {
    if (symbol_search.length == 0) return [];
    return rank_options(
      symbol_search.toUpperCase(),
      TICKERS,
      target_draft.tickers ?? [],
      (t) => t.ticker
    );
  }, [symbol_search, target_draft.tickers]);
  const display_weight = Math.round((target_draft.weight ?? 0) * 100);
  return (
    <div className="flex-shrink-0 w-full text-sm mb-2">
      <Tokenizer
        className="form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        aria-label="tickers"
        placeholder="Ticker(s)"
        options={options}
        value={symbol_search}
        onChange={(e) => {
          setSymbolSearch(e.target.value);
        }}
        tokens={target_draft.tickers ?? []}
        onSelectOption={(option: { ticker: string; name: string }) => {
          setTargetDraft((draft) => ({
            ...draft,
            tickers: draft.tickers.concat([option.ticker]),
          }));
          setSymbolSearch('');
        }}
        onSelectCustom={(custom) => {
          setTargetDraft((draft) => ({
            ...draft,
            tickers: [...new Set(draft.tickers.concat([custom])).values()],
          }));
          setSymbolSearch('');
        }}
        onRemoveToken={(ticker: string) => {
          setTargetDraft((draft) => ({
            ...draft,
            tickers: draft.tickers.filter((t) => t !== ticker),
          }));
        }}
        listComponent={TickerTypeaheadList}
        tokensComponent={TickerTokenList}
      />
      <input
        className="w-full form-input mt-0 mb-2 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        type="text"
        placeholder="Name"
        value={target_draft.name}
        onChange={(e) =>
          setTargetDraft({ ...target_draft, name: e.target.value })
        }
      />
      <div className="flex flex-row items-stretch justify-evenly justify-items-stretch gap-2 h-8">
        <span className="flex flex-row items-center">
          <input
            className=""
            type="range"
            min={0}
            max={100}
            value={display_weight}
            onChange={(e) =>
              setTargetDraft({
                ...target_draft,
                weight: e.target.valueAsNumber / 100,
              })
            }
          />
          <span className="w-10 px-2 py-1 text-lg">{display_weight}%</span>
        </span>
        <button
          className="flex-grow bg-slate-500 hover:bg-blue-700 text-white font-semibold py-1 px-1 rounded"
          onClick={() => {
            clearTarget();
            setTargetDraft({ weight: 0, name: '', tickers: [] });
          }}
        >
          Reset
        </button>
        <button
          className="flex-grow bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-1 rounded"
          onClick={() => {
            saveTarget(target_draft);
            setTargetDraft({ weight: 0, name: '', tickers: [] });
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
