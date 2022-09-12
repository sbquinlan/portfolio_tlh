import { useCallback, useEffect, useRef, useState } from "react";
import { linkEventHandlers } from "./linkEventHandlers";

export type TTypeaheadListProps<TDataElement> = {
  "aria-label": string,

  open: boolean,
  highlighted: number | null,
  options: TDataElement[],
  onSelectOption: (o: TDataElement) => void,
}

export type TTypeaheadProps<TDataElement> = {
  "aria-label": string,
  listComponent: React.FC<TTypeaheadListProps<TDataElement>>,
  
  onChange: React.ChangeEventHandler<HTMLInputElement>,
  options: TDataElement[],
  onSelectOption: (d: TDataElement) => void,
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Typeahead<TDataElement>({ 
  listComponent,

  "aria-label": label,
  options,
  disabled = false,
  placeholder,
  value,

  onBlur,
  onFocus,
  onChange,
  onKeyDown,
  onSelectOption,
  ... rest
}: TTypeaheadProps<TDataElement>) {
  const input_ref = useRef<HTMLInputElement>(null);
  const [{highlight, open}, setTrayState] = useState<{open: boolean, highlight: number}>(
    { highlight: 0, open: (document.activeElement === input_ref.current && options.length > 0) }
  );
  useEffect(() => {
    setTrayState(s => ({ 
      highlight: 0, 
      open: (document.activeElement === input_ref.current && options.length > 0) 
    }));
  }, [options])

  const _onFocus = useCallback(
    linkEventHandlers(
      onFocus,
      () => { setTrayState(_ => ({ highlight: 0, open: options.length > 0 })) },
    ),
    [options]
  );
  const _onBlur = useCallback(
    linkEventHandlers(
      onBlur,
      () => { setTrayState(_ => ({ highlight: 0, open: false })) },
    ),
    []
  );
  const _onKeydown = useCallback(
    linkEventHandlers(
      onKeyDown,
      (e) => {
        switch (e.key) {
          case "Escape":
            setTrayState(_ => ({ highlight: 0, open: false }))
            break;
          case "Enter":
            if (open) {
              onSelectOption(options[highlight]);
            }
            break;
          case "ArrowDown":
            setTrayState(({ highlight, open }) => ({ 
              highlight: open ? (highlight + 1) % options.length : highlight,
              open,
            }))
            break;
          case "ArrowUp":
            setTrayState(({ highlight, open }) => ({ 
              highlight: open ? (highlight + options.length - 1) % options.length: highlight,
              open,
            }))
            break;
          default: 
            return;
        }
        e.stopPropagation();
        e.preventDefault();
      }
    ),
    [options, highlight]
  );
  
  const TypeaheadList = listComponent;
  return (
    <div className="relative">
      <input
        {... rest}
        ref={input_ref}
        type="text"
        role="combobox"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        autoComplete="off"
        aria-autocomplete="list"
        aria-label={label}
        aria-expanded={open ? "true" : "false"}
        aria-controls={`${label.toLowerCase()}-list`}
        onChange={onChange}
        onFocus={_onFocus}
        onBlur={_onBlur}
        onKeyDown={_onKeydown}
      />
      <TypeaheadList
        aria-label={label} 
        open={open}
        options={options} 
        highlighted={highlight} 
        onSelectOption={onSelectOption} 
      />
    </div>
  )
}