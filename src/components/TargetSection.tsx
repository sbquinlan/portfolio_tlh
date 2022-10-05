import { useState } from 'react';
import { useAppDispatch } from '../data/store';
import { TargetPosition, removeTarget, saveTarget } from '../data/targets';
import TargetRow from './TargetRow';
import { TargetEditor } from './TargetEditor';
import SectionCard from './SectionCard';
import { TargetPositionAggregation } from '../data/display';

type TProps = {
  targets: TargetPositionAggregation[];
};
function TargetSection({ targets }: TProps) {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<TargetPosition | undefined>(
    undefined
  );
  return (
    <SectionCard
      title="Targets"
      controls={
        <TargetEditor
          target={selected}
          saveTarget={(t) => {
            dispatch(saveTarget(t));
            setSelected(undefined);
          }}
          clearTarget={() => setSelected(undefined)}
        />
      }
    >
      <ul className="border border-gray-500">
        {targets
          .map((dt) => dt.target)
          .sort((a, b) => b.weight - a.weight)
          .map((p) => (
            <TargetRow
              key={p.key}
              target={p}
              onSelectTarget={setSelected}
              onDeleteTarget={(t) => dispatch(removeTarget(t))}
            />
          ))}
      </ul>
    </SectionCard>
  );
}

export default TargetSection;
