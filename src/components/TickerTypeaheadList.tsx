import { TTypeaheadListProps } from '../ui/Typeahead';

export default function TickerTypeaheadList<
  TDataElement extends string | { ticker: string; name: string }
>({
  'aria-label': label,
  open,
  options,
  highlighted,
  onSelectOption,
}: TTypeaheadListProps<TDataElement>) {
  if (!open) return null;
  return (
    <ul
      id={`${label.toLowerCase()}-list`}
      tabIndex={-1}
      role="listbox"
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      aria-label={label}
      aria-activedescendant={
        highlighted === null ? undefined : `${label}-list-${highlighted}`
      }
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
            highlighted === i ? 'text-white bg-blue-500' : 'text-gray-700',
            'cursor-default select-none hover:bg-blue-200 relative text-sm py-2 pl-3 pr-9',
          ].join(' ')}
        >
          <span className="block truncate">
            {typeof o === 'string' ? o : o.ticker}
          </span>
        </li>
      ))}
    </ul>
  );
}
