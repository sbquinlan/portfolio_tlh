import React, { useRef } from 'react';
import { TTypeaheadProps, Typeahead } from './Typeahead';

export type TTokenListProps<TDataElement> = {
  elements: TDataElement[];
  onRemove: (r: TDataElement) => void;
} & React.RefAttributes<HTMLButtonElement | null>;

export type TTokenizerProps<TTypeaheadData, TTokenData> = {
  tokensComponent: React.FC<TTokenListProps<TTokenData>>;
  tokens: TTokenData[];
  onRemoveToken: (t: TTokenData) => void;
} & TTypeaheadProps<TTypeaheadData>;
export function Tokenizer<TTypeaheadData, TTokenData>({
  className,
  tokensComponent,
  value,
  tokens,
  onRemoveToken,
  ...rest
}: TTokenizerProps<TTypeaheadData, TTokenData>) {
  const token_ref = useRef<HTMLButtonElement>(null);
  const TokenList = tokensComponent;
  return (
    <div className={`${className} flex flex-row`}>
      <TokenList ref={token_ref} elements={tokens} onRemove={onRemoveToken} />
      <div className="flex-1">
        <Typeahead
          {...rest}
          value={value}
          className="w-full border-none appearance-none bg-transparent p-0 text-base focus:outline-none focus:ring-0"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Backspace' && !value && token_ref.current) {
              token_ref.current.focus();
              e.preventDefault();
            }
          }}
        />
      </div>
    </div>
  );
}
