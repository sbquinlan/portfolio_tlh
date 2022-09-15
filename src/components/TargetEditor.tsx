import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TargetPosition } from '../types/targets';
import { Tokenizer } from '../lib/Tokenizer';
import { rank_options } from '../lib/string_search';
import TickerTypeaheadList from './TickerTypeaheadList';
import TickerTokenList from './TickerTokenList';

type TTargetEditorProps = {
  target: TargetPosition | undefined,
  saveTarget: (t: TargetPosition) => void,
  clearTarget: () => void,
};
export function TargetEditor({ target, saveTarget, clearTarget }: TTargetEditorProps) {
  const TICKERS = ['SCHG', 'VCITX', 'VIG', 'SCHD', 'VEA', 'SCHF', 'IEMG', 'VWO', 'VB', 'F', 'AAL'];
  const [symbolSearch, setSymbolSearch] = useState('');
  const [symbols, setSymbols] = useState<string[]>(target?.tickers ?? []);
  const [name, setName] = useState(target?.name ?? '');
  const [weight, setWeight] = useState(target ? target.weight * 100 : 0);

  useEffect(() => {
    setSymbols(target?.tickers ?? [])
    setName(target?.name ?? '');
    setWeight(target ? target.weight * 100 : 0);
  }, [target])
  
  const options = useMemo(() => {
    if (symbolSearch.length == 0) return [];
    return rank_options(symbolSearch, TICKERS, symbols);
  }, [symbolSearch, symbols])

  return (
    <div className='flex flex-row items-stretch gap-4 h-10 w-full mb-2 text-sm'>
      <Tokenizer
        aria-label="tickers"
        placeholder="Ticker(s)"
        className="flex-grow form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus:ring-0 cursor-text"
        options={options}
        value={symbolSearch}
        onChange={e => {
          setSymbolSearch(e.target.value)
        }}
        tokens={symbols}
        onTokensChange={tokens => {
          setSymbols(tokens)
          setSymbolSearch('')
        }}
        listComponent={TickerTypeaheadList}
        tokensComponent={TickerTokenList}
      />
      <input className='flex-grow form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus:ring-0 cursor-text' 
        type="text" 
        placeholder='Name' 
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <span className='flex flex-row items-center'>
        <input 
          className=''
          type="range" 
          min={0} max={100} 
          value={weight} 
          onChange={e => setWeight(e.target.valueAsNumber)} 
        />
        <span className='px-2 py-1 text-lg'>{weight}%</span>
      </span>
      <button 
        className='bg-slate-500 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded' 
        onClick={() => clearTarget()}
      >
        Reset
      </button>
      <button 
        className='bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded' 
        onClick={() => saveTarget(new TargetPosition(symbols, name, weight))}
      >
        Save
      </button>
    </div>
  )
}