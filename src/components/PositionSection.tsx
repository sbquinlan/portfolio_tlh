import { DisplayTargetState } from '../types/display';
import { AccountPosition } from '../types/portfolio';
import AccountUpload from './AccountUpload';
import PositionTable from './PositionTable';

type TProps = {
  positions: DisplayTargetState[];
  setPositions: (p: Map<string, AccountPosition>) => void;
};
function PositionSection({ positions, setPositions }: TProps) {  
  return (
    <div>
      <div className="flex flex-row items-center py-2 px-4">
        <h1 className="flex-1 text-lg font-bold">Portfolio</h1>
        <AccountUpload onChange={(p) => setPositions(p)} />
      </div>
      <PositionTable positions={positions} />
    </div>
  );
}
export default PositionSection;

