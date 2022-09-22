import { useAppDispatch } from '../data/store';
import AccountUpload from './AccountUpload';
import PositionTable from './PositionTable';
import { loadPositions } from '../data/portfolio';
import SectionCard from './SectionCard';

type TProps = {};
function PositionSection({}: TProps) {
  const dispatch = useAppDispatch();
  return (
    <SectionCard
      title="Portfolio"
      header={<AccountUpload onChange={(p) => dispatch(loadPositions(p))} />}
    >
      <PositionTable />
    </SectionCard>
  );
}
export default PositionSection;
