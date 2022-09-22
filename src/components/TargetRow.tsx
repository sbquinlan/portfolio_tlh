import { useCallback } from 'react';
import { TargetPosition } from '../data/targets';
import { Xmark } from '../ui/icons';

type TProps = {
  target: TargetPosition;
  onSelectTarget: (t: TargetPosition) => void;
  onDeleteTarget: (t: TargetPosition) => void;
};
function TargetRow({ target, onSelectTarget, onDeleteTarget }: TProps) {
  const priv_onDelete = useCallback(
    () => onDeleteTarget(target),
    [target, onDeleteTarget]
  );
  const priv_onSelect = useCallback(
    () => onSelectTarget(target),
    [target, onSelectTarget]
  );
  return (
    <li
      className="flex flex-row select-none items-center border-b border-gray-500 last:border-b-0 px-2 py-1 hover:border-blue-500 hover:bg-blue-300 cursor-pointer"
      onClick={priv_onSelect}
    >
      <div className="flex-1">
        <div className="truncate">
          <span className="text-sm font-semibold">{target.name}</span>
          <span className="text-sm text-gray-500 ml-2">
            {target.tickers.join(', ')}
          </span>
        </div>
        {/* future direct indexing control */}
      </div>
      <span className="text-sm font-semibold border-gray-500">
        {target.weight * 100}%
      </span>
      <button aria-label="Delete" onClick={priv_onDelete}>
        <Xmark className="w-5 h-5" />
      </button>
    </li>
  );
}

export default TargetRow;
