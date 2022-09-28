import { useAppDispatch } from '../data/store';
import PositionEditor from './PositionEditor';
import PositionTable from './PositionTable';
import { fromFile } from '../data/positions';
import SectionCard from './SectionCard';
import { DisplayTargetState } from '../data/display';

type TProps = { targets: DisplayTargetState[] };
function PositionSection({ targets }: TProps) {
  const dispatch = useAppDispatch();
  return (
    <SectionCard
      title="Positions"
      controls={<PositionEditor onChange={(p) => dispatch(fromFile(p))} />}
    >
      <PositionTable targets={targets} />
    </SectionCard>
  );
}
export default PositionSection;
