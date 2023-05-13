import { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../data/store';
import { fromFile, fromFlexQuery } from '../data/positions';
import { updateCash } from '../data/cash';

type TProps = { };

export default function PositionEditor({ }: TProps) {
  const dispatch = useAppDispatch();
  const cash = useAppSelector(({ cash }) => cash.value);
  const [cash_string, setCashString] = useState<string>(cash.toFixed(2));

  const input_ref = useRef<HTMLInputElement>(null);
  return (
    <div className="w-full text-sm">
      <input
        className="w-full form-input mt-0 mb-2 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        type="text"
        placeholder="Cash"
        value={cash_string}
        onChange={(e) => {
          setCashString(e.target.value)
          const value_as_number = parseFloat(e.target.value)
          if (!isNaN(value_as_number)) {
            dispatch(updateCash(value_as_number))
          }
        }}
      />
      <span className="flex-grow">
        <input
          ref={input_ref}
          className="hidden"
          type="file"
          accept="csv"
          onChange={(e) => {
            dispatch(fromFile(e.target.files?.length ? e.target.files![0] : undefined));
          }}
        />
        <button
          className="h-8 w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-1 mb-2 rounded"
          onClick={() => {
            input_ref.current?.click();
          }}
        >
          Upload
        </button>
      </span>
      <button
        className="h-8 w-full bg-slate-500 hover:bg-blue-700 text-white font-semibold py-1 px-1 mb-2 rounded"
        onClick={() => {
          dispatch(fromFile(undefined));
        }}
      >
        Clear
      </button>
      
    </div>
  );
}
