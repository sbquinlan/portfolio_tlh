import React, { useCallback, useMemo, useState } from 'react';
import { TargetPosition } from '../types/targets';
import TargetRow from './TargetRow';
import { TargetEditor } from './TargetEditor';

type TProps = {
  targets: TargetPosition[],
  setTargets: React.Dispatch<React.SetStateAction<TargetPosition[]>>,
};
function TargetSection({ targets, setTargets }: TProps) {
  const [selected, setSelected] = useState<TargetPosition | undefined>(undefined);
  const onDeleteTarget = useCallback(
    (d: TargetPosition) => { setTargets(ts => ts.filter(t => t !== d)) },
    [setTargets],
  );
  const onAddTarget = useCallback(
    (a: TargetPosition) => { setTargets(ts => ts.concat([a])) },
    [setTargets]
  );
  return (
    <div>
      <div className="flex flex-row items-center py-2 px-4">
        <h1 className="flex-1 text-lg font-bold">Targets</h1>
      </div>
      <TargetEditor target={selected} addTarget={onAddTarget} />
      <ul className="border border-gray-500">
        {targets.map((p) => (
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
