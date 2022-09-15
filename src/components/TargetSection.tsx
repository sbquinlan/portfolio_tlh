import React, { useCallback, useState } from 'react';
import { TargetPosition } from '../types/targets';
import TargetRow from './TargetRow';
import { TargetEditor } from './TargetEditor';

type TProps = {
  targets: Map<string, TargetPosition>,
  setTargets: React.Dispatch<React.SetStateAction<Map<string, TargetPosition>>>,
};
function TargetSection({ targets, setTargets }: TProps) {
  const [selected, setSelected] = useState<TargetPosition | undefined>(undefined);
  const onDeleteTarget = useCallback(
    (d: TargetPosition) => setTargets(ts => { 
      ts.delete(d.key)
      return ts;
    }),
    [setTargets],
  );
  const onAddTarget = useCallback(
    (a: TargetPosition) => setTargets(ts => {
      ts.set(a.key, a)
      return ts;
    }),
    [setTargets]
  );
  return (
    <div>
      <div className="flex flex-row items-center py-2 px-4">
        <h1 className="flex-1 text-lg font-bold">Targets</h1>
      </div>
      <TargetEditor 
        target={selected} 
        saveTarget={onAddTarget} 
        clearTarget={() => setSelected(undefined)}
      />
      <ul className="border border-gray-500">
        {[...targets.values()].map((p) => (
          <TargetRow
            key={p.key}
            target={p}
            onSelectTarget={setSelected}
            onDeleteTarget={onDeleteTarget}
          />
        ))}
      </ul>
    </div>
  );
}

export default TargetSection;
