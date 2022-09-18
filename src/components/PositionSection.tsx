import { useAppDispatch } from '../types/store';
import AccountUpload from './AccountUpload';
import PositionTable from './PositionTable';
import { loadPositions } from '../types/portfolio'

type TProps = {
};
function PositionSection({ }: TProps) {  
  
  const dispatch = useAppDispatch();
  return (
    <div>
      <div className="flex flex-row items-center py-2 px-4">
        <h1 className="flex-1 text-lg font-bold">Portfolio</h1>
        <AccountUpload onChange={(p) => dispatch(loadPositions(p))} />
      </div>
      <PositionTable />
    </div>
  );
}
export default PositionSection;

