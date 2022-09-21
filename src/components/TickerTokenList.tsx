import React from "react";
import { Xmark } from "../ui/icons";
import { TTokenListProps } from "../ui/Tokenizer";

const TickerTokenList = React.forwardRef<HTMLButtonElement | null, TTokenListProps<string>>(
  ({ elements, onRemove }, ref) => {
    return (
      <span className="">
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

export default TickerTokenList