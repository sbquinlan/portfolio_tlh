import { useAppDispatch } from '../data/store';
import PositionEditor from './PositionEditor';
import PositionTable from './PositionTable';
import { fromFile } from '../data/positions';
import SectionCard from './SectionCard';

type TProps = {};
function PositionSection({}: TProps) {
  const dispatch = useAppDispatch();
  return (
    <SectionCard
      title="Positions"
      controls={<PositionEditor onChange={(p) => dispatch(fromFile(p))} />}
    >
      <PositionTable />
    </SectionCard>
  );
}
export default PositionSection;
