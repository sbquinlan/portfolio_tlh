import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../types/store';
import { TargetPosition, removeTarget, saveTarget } from '../types/targets';
import TargetRow from './TargetRow';
import { TargetEditor } from './TargetEditor';

type TProps = {
};
function TargetSection({}: TProps) {
  const targets = useAppSelector(({ targets }) => targets);
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<TargetPosition | undefined>(undefined);
  return (
    <div>
      <div className="flex flex-row items-center py-2 px-4">
        <h1 className="flex-1 text-lg font-bold">Targets</h1>
      </div>
      <TargetEditor 
        target={selected} 
        saveTarget={t => { 
          dispatch(saveTarget(t))
          setSelected(undefined)
        }}
        clearTarget={() => setSelected(undefined)}
      />
      <ul className="border border-gray-500">
        {Object.values(targets).map((p) => (
          <TargetRow
            key={p.key}
            target={p}
            onSelectTarget={setSelected}
            onDeleteTarget={t => dispatch(removeTarget(t))}
          />
        ))}
      </ul>
    </div>
  );
}

export default TargetSection;
