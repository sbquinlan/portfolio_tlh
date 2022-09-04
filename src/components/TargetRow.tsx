import { TargetPosition } from '../types/targets';
import { Xmark } from './icons';

type TProps = {
  target: TargetPosition;
  setWeight: (n: number) => void;
  onDelete: () => void;
};
function TargetRow({ target, setWeight, onDelete }: TProps) {
  return (
    <li className="flex flex-row items-center border-b border-gray-500 last:border-b-0 px-2 py-1">
      <div className="flex-1 overflow-hidden">
        <div className="overflow-hidden whitespace-nowrap overflow-ellipsis">
          <span className="text-sm font-semibold">{target.symbol}</span>
          <span className="text-sm text-gray-500 ml-2">{target.name}</span>
        </div>
        {/* future direct indexing control */}
      </div>
      <input
        type="number"
        min={0}
        max={100}
        className="text-sm border-gray-500 px-2 py-1"
        placeholder="%"
        value={target.weight}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          setWeight(isNaN(val) ? 0 : val);
        }}
      />
      <button className="ml-2" onClick={() => onDelete()}>
        <Xmark />
      </button>
    </li>
  );
}

export default TargetRow;
