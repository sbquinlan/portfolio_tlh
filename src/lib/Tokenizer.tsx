import React, { useRef, useCallback } from "react"
import { TTypeaheadProps, Typeahead } from "./Typeahead"

export type TTokenListProps<TDataElement> = {
  elements: TDataElement[],
  onRemove: (r: TDataElement) => void,
} & React.RefAttributes<HTMLButtonElement | null>;

export type TTokenizerProps<TDataElement> = {
  tokensComponent: React.FC<TTokenListProps<TDataElement>>
  tokens: TDataElement[],
  onTokensChange: React.Dispatch<React.SetStateAction<TDataElement[]>>,
} & Omit<TTypeaheadProps<TDataElement>, 'onSelectOption'>;
export function Tokenizer<TDataElement>({
  className,
  tokensComponent,
  value,
  tokens,
  onTokensChange,
  ... rest
}: TTokenizerProps<TDataElement>) {
  const onRemove = useCallback(
    (r: TDataElement) => {
      onTokensChange(tokens => tokens.filter(t => t !== r))
    },
    [onTokensChange]
  );
  const onAdd = useCallback(
    (a: TDataElement) => {
      onTokensChange(tokens => tokens.concat([a]))
    },
    [onTokensChange]
  );
  const token_ref = useRef<HTMLButtonElement>(null);
  const onBackspace = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !value && token_ref.current) {
        token_ref.current.focus();
        e.preventDefault();
      }
    },
    [value]
  );
  const TokenList = tokensComponent;
  return (
    <div className={`${className} flex flex-row`}>
      <TokenList ref={token_ref} elements={tokens} onRemove={onRemove} />
      <div className="flex-grow">
        <Typeahead
          {... rest}
          value={value}
          className="w-full border-none appearance-none bg-transparent p-0 text-base focus:outline-none focus:ring-0"
          onSelectOption={onAdd}
          onKeyDown={onBackspace}
        />
      </div>
    </div>
  );
}