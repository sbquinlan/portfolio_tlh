import { useAppSelector } from '../data/store';
import PositionEditor from './PositionEditor';
import PositionTable from './PositionTable';
import SectionCard from './SectionCard';
import { selectCash, selectPositions } from '../selectors/basic';
import { selectTargetsJoinPositions } from '../selectors/display';

type TProps = {};
function PositionSection({}: TProps) {
  const positions = useAppSelector(selectPositions);
  const targets = useAppSelector((state) =>
    selectTargetsJoinPositions(state, Object.values(positions))
  );
  const cash = useAppSelector(selectCash);
  return (
    <SectionCard title="Positions" controls={<PositionEditor />}>
      <PositionTable cash={cash} targets={targets} />
    </SectionCard>
  );
}
export default PositionSection;
