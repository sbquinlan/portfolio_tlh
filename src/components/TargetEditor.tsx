import { useEffect, useMemo, useState } from 'react';
import { TargetPosition } from '../data/targets';
import { Tokenizer } from '../ui/Tokenizer';
import { rank_options } from '../lib/string_search';
import TickerTypeaheadList from './TickerTypeaheadList';
import TickerTokenList from './TickerTokenList';
import { Fund } from '../data/funds';

type TTargetEditorProps = {
  target: TargetPosition | undefined;
  funds: Record<string, Fund>;
  saveTarget: (t: Omit<TargetPosition, 'key'>) => void;
  clearTarget: () => void;
};
export function TargetEditor({
  target: selected,
  funds,
  saveTarget,
  clearTarget,
}: TTargetEditorProps) {
  const [symbol_search, setSymbolSearch] = useState('');
  const [direct_index, setDirectIndex] = useState('');
  const [target_draft, setTargetDraft] = useState<Omit<TargetPosition, 'key'>>(
    selected ?? { weight: 0, name: '', tickers: [] }
  );

  useEffect(() => {
    setTargetDraft(selected ?? { weight: 0, name: '', tickers: [] });
  }, [selected]);

  const symbol_options = useMemo(() => {
    if (symbol_search.length == 0) return [];
    return rank_options(
      symbol_search.toUpperCase(),
      Object.values(funds),
      target_draft.tickers.map(({ ticker }) => ticker) ?? [],
      ({ ticker }) => ticker
    );
  }, [symbol_search, target_draft.tickers]);

  const indexable_funds = useMemo(() => {
    return target_draft.tickers
      .filter(({ isin }) => isin && isin in funds)
      .map(({ isin }) => funds[isin!]);
  }, [target_draft.tickers]);

  const direct_index_options = useMemo(() => {
    if (direct_index.length === 0) return [];
    return rank_options(
      direct_index.toUpperCase(),
      indexable_funds,
      [],
      ({ ticker }) => ticker
    );
  }, [direct_index, target_draft.tickers]);

  const display_weight = Math.round((target_draft.weight ?? 0) * 100);
  return (
    <div className="flex-shrink-0 w-full text-sm mb-2">
      <input
        className="w-full form-input mt-0 mb-2 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        type="text"
        placeholder="Name"
        value={target_draft.name}
        onChange={(e) =>
          setTargetDraft({ ...target_draft, name: e.target.value })
        }
      />
      <Tokenizer
        className="form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        aria-label="tickers"
        placeholder="Ticker(s)"
        options={symbol_options}
        value={symbol_search}
        onChange={(e) => {
          setSymbolSearch(e.target.value);
        }}
        tokens={target_draft.tickers.map(({ ticker }) => ticker) ?? []}
        onSelectOption={({ ticker, isin }: Fund) => {
          setTargetDraft((draft) => ({
            ...draft,
            tickers: draft.tickers.concat([{ ticker, isin }]),
          }));
          setSymbolSearch('');
        }}
        onSelectCustom={(custom) => {
          setTargetDraft((draft) => ({
            ...draft,
            tickers: [
              ...new Set(draft.tickers.concat([{ ticker: custom }])).values(),
            ],
          }));
          setSymbolSearch('');
        }}
        onRemoveToken={(ticker: string) => {
          setTargetDraft((draft) => ({
            ...draft,
            tickers: draft.tickers.filter(({ ticker: t }) => t !== ticker),
          }));
        }}
        listComponent={TickerTypeaheadList}
        tokensComponent={TickerTokenList}
      />
      <Tokenizer
        className="form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        aria-label="direct_index"
        placeholder="Direct Index"
        disabled={
          indexable_funds.length === 0 ||
          Boolean(target_draft.direct && target_draft.direct in funds)
        }
        options={direct_index_options}
        value={direct_index}
        onChange={(e) => {
          setDirectIndex(e.target.value);
        }}
        tokens={
          target_draft.direct && target_draft.direct in funds
            ? [funds[target_draft.direct].ticker]
            : []
        }
        onSelectOption={(option: Fund) => {
          setTargetDraft((draft) => ({
            ...draft,
            direct: option.isin,
          }));
          setDirectIndex('');
        }}
        onRemoveToken={(_) => {
          setTargetDraft((draft) => ({
            ...draft,
            direct: undefined,
          }));
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
          value={display_weight}
          onChange={(e) =>
            setTargetDraft({
              ...target_draft,
              weight: e.target.valueAsNumber / 100,
            })
          }
        />
        <span className="w-10 text-lg">{display_weight}%</span>
      </span>
      <div className="flex flex-row items-stretch justify-evenly justify-items-stretch gap-2 h-8">
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
