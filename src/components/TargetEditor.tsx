import { useEffect, useMemo, useState } from 'react';
import { TargetPosition } from '../types/targets';
import { Tokenizer } from '../lib/Tokenizer';
import { rank_options } from '../lib/string_search';
import TickerTypeaheadList from './TickerTypeaheadList';
import TickerTokenList from './TickerTokenList';

const TICKERS = ['SCHG', 'VCITX', 'VIG', 'SCHD', 'VEA', 'SCHF', 'IEMG', 'VWO', 'VB', 'F', 'AAL'];

type TTargetEditorProps = {
  target: TargetPosition | undefined,
  saveTarget: (t: Omit<TargetPosition, 'key'>) => void,
  clearTarget: () => void,
};
export function TargetEditor({ target: selected, saveTarget, clearTarget }: TTargetEditorProps) {
  const [symbolSearch, setSymbolSearch] = useState('');
  const [target_draft, setTargetDraft] = useState<Omit<TargetPosition, 'key'>>(selected ?? { weight: 0, name: '', tickers: [] });

  useEffect(() => {
    setTargetDraft(selected ?? { weight: 0, name: '', tickers: [] });
  }, [selected])
  
  const options = useMemo(() => {
    if (symbolSearch.length == 0) return [];
    return rank_options(symbolSearch, TICKERS, target_draft.tickers ?? []);
  }, [symbolSearch, target_draft.tickers])
  const display_weight = Math.round((target_draft.weight ?? 0) * 100)
  return (
    <div className='flex flex-row items-stretch gap-4 h-10 w-full mb-2 text-sm'>
      <Tokenizer
        aria-label="tickers"
        placeholder="Ticker(s)"
        className="flex-grow form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        options={options}
        value={symbolSearch}
        onChange={e => {
          setSymbolSearch(e.target.value)
        }}
        tokens={target_draft.tickers ?? []}
        onTokensChange={state => {
          const tickers = state instanceof Function ? state(target_draft.tickers) : state;
          setTargetDraft({ ... target_draft, tickers })
          setSymbolSearch('')
        }}
        listComponent={TickerTypeaheadList}
        tokensComponent={TickerTokenList}
      />
      <input className='flex-grow form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text' 
        type="text" 
        placeholder='Name' 
        value={target_draft.name}
        onChange={e => setTargetDraft({ ... target_draft, name: e.target.value })}
      />
      <span className='flex flex-row items-center'>
        <input 
          className=''
          type="range" 
          min={0} max={100} 
          value={display_weight} 
          onChange={e => setTargetDraft({ ... target_draft, weight: (e.target.valueAsNumber / 100) })} 
        />
        <span className='w-10 px-2 py-1 text-lg'>{display_weight}%</span>
      </span>
      <button 
        className='bg-slate-500 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded' 
        onClick={() => {
          clearTarget()
          setTargetDraft({ weight: 0, name: '', tickers: [] })
        }}
      >
        Reset
      </button>
      <button 
        className='bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded' 
        onClick={() => {
          saveTarget(target_draft)
          setTargetDraft({ weight: 0, name: '', tickers: [] })
        }}
      >
        Save
      </button>
    </div>
  )
}