import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../data/store';
import { TargetPosition, removeTarget, saveTarget, CASH_TARGET_KEY } from '../data/targets';
import TargetRow from './TargetRow';
import { TargetEditor } from './TargetEditor';
import SectionCard from './SectionCard';
import { TargetPositionAggregation, UNALLOCATED_TARGET } from '../selectors/display';
import { selectFunds } from '../selectors/basic';

type TProps = {
  targets: TargetPositionAggregation[];
};

function TargetSection({ targets }: TProps) {
  const dispatch = useAppDispatch();
  const funds = useAppSelector(selectFunds);
  const [selected, setSelected] = useState<TargetPosition | undefined>(
    undefined
  );
  const leftover_allocation = Math.round(
    Math.max(0, 1 - targets.reduce((sum, t) => sum + t.target.weight, 0)) * 100,
  ) / 100;
  return (
    <SectionCard
      title="Targets"
      controls={
        <TargetEditor
          target={selected}
          funds={funds}
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
          .filter(({ target }) => target !== UNALLOCATED_TARGET)
          .map((dt) => dt.target)
          .sort((a, b) => b.weight - a.weight)
          .concat([{ key: CASH_TARGET_KEY, name: CASH_TARGET_KEY, tickers: [], weight: leftover_allocation }])
          .map((p) => (
            <TargetRow
              key={p.key}
              target={p}
              funds={funds}
              onSelectTarget={setSelected}
              onDeleteTarget={(t) => dispatch(removeTarget(t))}
            />
          ))}
      </ul>
    </SectionCard>
  );
}

export default TargetSection;
