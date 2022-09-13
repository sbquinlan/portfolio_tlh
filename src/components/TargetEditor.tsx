import React, { useCallback, useMemo, useState } from 'react';
import { TargetPosition } from '../types/targets';
import { Xmark } from '../lib/icons';
import { Tokenizer, TTokenListProps } from '../lib/Tokenizer';
import { TTypeaheadListProps } from '../lib/Typeahead';

const TokenList = React.forwardRef<HTMLButtonElement | null, TTokenListProps<string>>(
  ({ elements, onRemove }, ref) => {
    return (
      <span className="inline">
        {elements.map((elm, i) => {
          return (
            <button
              ref={i === elements.length - 1 ? ref : undefined}
              aria-label={elm}
              key={elm}
              className="cursor-pointer border border-blue-500 bg-blue-300 pl-1 py-0.5 mr-1 text-sm focus:outline-none focus:text-white focus:bg-blue-500"
              type="button"
              role="button"
              onKeyDown={(e) => { if (e.key === 'Backspace') onRemove(elm) }}
            >
              <span>{elm}</span>
              <Xmark className="inline-block align-middle h-4 w-4" onClick={() => onRemove(elm)} />
            </button>
          )
        })}
      </span>
    )
  }
);

function TypeaheadList({ 
  'aria-label': label,
  open,
  options,
  highlighted,
  onSelectOption,
}: TTypeaheadListProps<string>) {
  if (!open) return null
  return (
    <ul 
      id={`${label.toLowerCase()}-list`} 
      tabIndex={-1}
      role="listbox"
      onMouseDown={(e) => { e.preventDefault(); }}
      aria-label={label} 
      aria-activedescendant={highlighted === null ? undefined : `${label}-list-${highlighted}`}
      className="absolute z-50 mt-1 w-56 max-h-56 py-1 leading-6 bg-white shadow-lg overflow-auto focus:outline-none"
    >
      {options.map((o, i) => (
        <li 
          id={`${label.toLowerCase()}-list-${i}`}
          key={`${label.toLowerCase()}-list-${i}`}
          role="option" 
          aria-selected={highlighted === i ? 'true' : 'false'}
          onClick={() => onSelectOption(o)}
          className={[
            (highlighted === i ? "text-white bg-blue-500" : "text-gray-700"),
            "cursor-default select-none hover:bg-blue-200 relative text-sm py-2 pl-3 pr-9"
          ].join(' ')}
        >
          <span className="block truncate">
            {o}
          </span>
        </li>
      ))}
    </ul>
  )
}

function min_edit_distance(a: string, b: string, min: number = 2): number {
  a = a.toLocaleUpperCase(); b = b.toLocaleUpperCase();
  const table = new Array(a.length + 1).fill(0).map(_ => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) {
    for (let j = 0; j <= b.length; j++) {
      table[i][j] = (
        i == 0 || j == 0 ? i + j : (
        a[i] == b[j] ? table[i-1][j-1] : 
        1 + Math.min(table[i-1][j], table[i][j-1], table[i-1][j-1]))
      );
    }
  }
  return table[a.length][b.length];
}

function score(search: string, option: string): number {
  if (option.startsWith(search)) return 0;
  if (~option.indexOf(search)) return 1;
  return min_edit_distance(search, option);
}

type TTargetEditorProps = {
  addTarget: (t: TargetPosition) => void,
  target: TargetPosition | undefined,
};
export function TargetEditor({ target, addTarget }: TTargetEditorProps) {
  const TICKERS = ['SCHG', 'VCITX', 'VIG', 'SCHD', 'VEA', 'SCHF', 'IEMG', 'VWO', 'VB', 'F', 'AAL'];
  const [symbolSearch, setSymbolSearch] = useState('');
  const [symbols, setSymbols] = useState<string[]>(target?.tickers ?? []);
  const [name, setName] = useState(target?.name ?? '');
  const [weight, setWeight] = useState(target?.weight ?? 0);

  const onSymbolSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { 
    setSymbolSearch(e.target.value) 
  }, []);
  const onTokens = useCallback((tokens: React.SetStateAction<string[]>) => { 
    setSymbolSearch('');
    setSymbols(tokens);
  }, []);
  const onNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);
  const onWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(e.target.valueAsNumber)
  }, []);

  const onSave = useCallback(
    () => {
      addTarget(new TargetPosition(symbols, name, weight))
    }, 
    [symbols, name, weight, addTarget]
  );
  
  const options = useMemo(() => {
    if (symbolSearch.length == 0) return [];
    return TICKERS
      // keep it unique
      .filter(t => !~symbols.indexOf(t))
      // score
      .map(t => [t, score(symbolSearch, t)] as [string, number])
      // filter
      .filter(([_, s]) => s < 3)
      // sort
      .sort(([_, a], [__, b]) => a - b)
      // unscore
      .map(([t, _]) => t);
  }, [symbolSearch])

  return (
    <div className='flex flex-row items-stretch gap-4 h-10 w-full mb-2 text-sm'>
      <Tokenizer
        aria-label="tickers"
        placeholder="Ticker(s)"
        className="flex-grow form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus:ring-0 cursor-text"
        options={options}
        value={symbolSearch}
        onChange={onSymbolSearchChange}
        tokens={symbols}
        onTokensChange={onTokens}
        listComponent={TypeaheadList}
        tokensComponent={TokenList}
      />
      <input className='flex-grow form-input mt-0 mb-1 px-2 py-1 border-0 border-b-2 focus:ring-0 cursor-text' 
        type="text" 
        placeholder='Name' 
        value={name}
        onChange={onNameChange}
      />
      <span className='flex flex-row items-center'>
        <input 
          className=''
          type="range" 
          min={0} max={100} 
          value={weight} 
          onChange={onWeightChange} 
        />
        <span className='px-2 py-1 text-lg'>{weight}%</span>
      </span>
      <button 
        className='bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded' 
        onClick={onSave}
      >
        Save
      </button>
    </div>
  )
}