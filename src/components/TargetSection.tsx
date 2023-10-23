import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../data/store';
import {
  TargetPosition,
  removeTarget,
  saveTarget,
  CASH_TARGET_KEY,
} from '../data/targets';
import TargetRow from './TargetRow';
import { TargetEditor } from './TargetEditor';
import SectionCard from './SectionCard';
import { UNALLOCATED_TARGET } from '../selectors/display';
import { selectFunds, selectTargets } from '../selectors/basic';

type TProps = {};

function TargetSection({}: TProps) {
  const dispatch = useAppDispatch();
  const funds = useAppSelector(selectFunds);
  const targets = useAppSelector(selectTargets);
  const [selected, setSelected] = useState<TargetPosition | undefined>(
    undefined
  );

  const sorted_targets = useMemo(() => {
    const target_rows = Object.values(targets);
    const cash_target = target_rows.find(({ key }) => key === CASH_TARGET_KEY)!;
    return target_rows
      .filter(
        ({ key }) => key !== UNALLOCATED_TARGET.key && key !== CASH_TARGET_KEY
      )
      .sort((a, b) => b.weight - a.weight)
      .concat(cash_target ? [cash_target] : []);
  }, [targets]);

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
        {sorted_targets.map((p) => (
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
