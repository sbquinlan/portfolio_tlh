import { TargetPosition } from '../types/targets';
import TargetRow from './TargetRow';

type TProps = {
  targets: TargetPosition[],
  setWeight: (t: TargetPosition, n: number) => void,
  onDelete: (t: TargetPosition) => void,
}
function TargetSection({ targets, setWeight, onDelete }: TProps) {
  return (
    <div>
      <div className='flex flex-row items-center py-2 px-4'>
        <h1 className='flex-1 text-lg font-bold'>Targets</h1>
      </div>
      <ul className='border border-gray-500'>
        {targets.map(p => <TargetRow 
          key={p.symbol}
          target={p}
          onDelete={() => onDelete(p)} 
          setWeight={(w) => setWeight(p, w)} 
        />)}
      </ul>
    </div>
    
    
  )
}

export default TargetSection
