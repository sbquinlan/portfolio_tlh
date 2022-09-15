import { DisplayTargetState } from '../types/display';
import { AccountPosition } from '../types/portfolio';
import { TargetPosition } from '../types/targets';
import AccountUpload from './AccountUpload';
import PositionTable from './PositionTable';

type TProps = {
  positions: Map<string, AccountPosition>,
  targets: Map<string, TargetPosition>,
  setPositions: (p: Map<string, AccountPosition>) => void;
};
function PositionSection({ positions, targets, setPositions }: TProps) {  
  return (
    <div>
      <div className="flex flex-row items-center py-2 px-4">
        <h1 className="flex-1 text-lg font-bold">Portfolio</h1>
        <AccountUpload onChange={(p) => setPositions(p)} />
      </div>
      <PositionTable positions={positions} targets={targets} />
    </div>
  );
}
export default PositionSection;

