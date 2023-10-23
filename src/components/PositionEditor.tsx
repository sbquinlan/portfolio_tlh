import { useState } from 'react';
import { useAppDispatch } from '../data/store';
import { fromFlexQuery } from '../data/positions/positions';

type TProps = {};

export default function PositionEditor({}: TProps) {
  const dispatch = useAppDispatch();
  const [token, setToken] = useState('');
  const [query_id, setQueryId] = useState('');

  return (
    <div className="w-full text-sm">
      <input
        className="w-full form-input mt-0 mb-2 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        type="text"
        placeholder="Token"
        value={token}
        onChange={(e) => {
          setToken(e.target.value);
        }}
      />
      <input
        className="w-full form-input mt-0 mb-2 px-2 py-1 border-0 border-b-2 focus-within:border-blue-600 focus:ring-0 cursor-text"
        type="text"
        placeholder="Query ID"
        value={query_id}
        onChange={(e) => {
          setQueryId(e.target.value);
        }}
      />
      <button
        className="h-8 w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-1 mb-2 rounded"
        disabled={!token && !query_id}
        onClick={() => {
          if (!token && !query_id) {
            return;
          }
          dispatch(fromFlexQuery({ token, query_id }));
        }}
      >
        Load
      </button>
      <button
        className="h-8 w-full bg-slate-500 hover:bg-blue-700 text-white font-semibold py-1 px-1 mb-2 rounded"
        onClick={() => {
          // @ts-ignore intentionally not passing any arguments
          dispatch(fromFlexQuery());
        }}
      >
        Clear
      </button>
    </div>
  );
}
