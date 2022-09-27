import React, { useRef } from 'react';

type TProps = {
  onChange: (file?: File) => void;
};

export default function PositionEditor({ onChange }: TProps) {
  async function _onChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.files![0]);
  }
  const input_ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-row items-stretch justify-evenly justify-items-stretch text-sm gap-2 h-8 mb-2">
      <button
        className="flex-grow bg-slate-500 hover:bg-blue-700 text-white font-semibold py-1 px-1 rounded"
        onClick={() => { onChange() }}
      >
        Clear
      </button>
      <span className="flex-grow">
        <input
          ref={input_ref}
          className="hidden"
          type="file"
          accept="csv"
          onChange={_onChange}
        />
        <button
          className="h-full w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-1 rounded"
          onClick={() => {
            input_ref.current?.click();
          }}
        >
          Upload
        </button>
      </span>
    </div>
    
  );
}
