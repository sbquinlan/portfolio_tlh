import { useAppDispatch } from '../data/store';
import PositionEditor from './PositionEditor';
import PositionTable from './PositionTable';
import SectionCard from './SectionCard';
import { TargetPositionAggregation } from '../selectors/display';

type TProps = { targets: TargetPositionAggregation[] };
function PositionSection({ targets }: TProps) {
  const dispatch = useAppDispatch();
  return (
    <SectionCard
      title="Positions"
      controls={<PositionEditor />}
    >
      <PositionTable targets={targets} />
    </SectionCard>
  );
}
export default PositionSection;
