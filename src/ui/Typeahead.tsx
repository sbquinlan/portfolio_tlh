import { useEffect, useRef, useState } from "react";
import link_event_handlers from "./link_event_handlers";

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
  onSelectCustom: (value: string) => void,
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
  onSelectCustom,
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

  const _onFocus = link_event_handlers(
    onFocus,
    () => { setTrayState(_ => ({ highlight: 0, open: options.length > 0 })) },
  );
  const _onBlur = link_event_handlers(
    onBlur,
    () => { setTrayState(_ => ({ highlight: 0, open: false })) },
  );
  const _onKeydown = link_event_handlers(
    onKeyDown, 
    (e) => {
      switch (e.key) {
        case "Escape":
          setTrayState(_ => ({ highlight: 0, open: false }))
          break;
        case "Enter":
          if (open) {
            onSelectOption(options[highlight]);
          } else if (value) {
            onSelectCustom(value as string);
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