import { useCallback } from 'react';
import { CASH_TARGET_KEY, TargetPosition } from '../data/targets';
import { Xmark } from '../ui/icons';
import type { Fund } from '../data/funds';

type TProps = {
  target: TargetPosition;
  funds: Record<string, Fund>;
  onSelectTarget: (t: TargetPosition) => void;
  onDeleteTarget: (t: TargetPosition) => void;
};
function TargetRow({ target, funds, onSelectTarget, onDeleteTarget }: TProps) {
  const priv_onDelete = useCallback(
    () => onDeleteTarget(target),
    [target, onDeleteTarget]
  );
  const priv_onSelect = useCallback(
    () => onSelectTarget(target),
    [target, onSelectTarget]
  );
  const direct_fund = target.direct && target.direct in funds
    ? funds[target.direct].ticker
    : undefined;
  return (
    <li
      className={[
        "flex flex-row select-none items-center border-b border-black last:border-b-0 px-2 py-1",
        target.key === CASH_TARGET_KEY ? "bg-gray-200" : "hover:border-blue-500 hover:bg-blue-700 cursor-pointer",
      ].join(" ")}
      onClick={target.key === CASH_TARGET_KEY ? () => {} : priv_onSelect}
    >
      <div className="flex-1 truncate">
        <span className="text-sm font-semibold">{target.name}</span>
        {target.tickers.map((t) => (
          <span
            key={t}
            className={`text-sm ${
              direct_fund === t ? ' text-blue-600' : 'text-gray-500'
            } ml-1`}
          >
            {t}
          </span>
        ))}
      </div>
      <span className="text-sm font-semibold">
        {target.weight * 100}%
      </span>
      {target.key === CASH_TARGET_KEY 
      ? <span className='w-5 h-5' />
      : (
        <button aria-label="Delete" onClick={priv_onDelete}>
          <Xmark className="w-5 h-5" />
        </button>
      )}
    </li>
  );
}

export default TargetRow;
