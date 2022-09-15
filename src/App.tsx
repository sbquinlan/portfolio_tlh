import { TargetPosition } from './types/targets';
import { AccountPosition } from './types/portfolio';
import { useState } from 'react';
import TargetSection from './components/TargetSection';
import PositionSection from './components/PositionSection';
import TradeSection from './components/TradeSection';



function App() {
  const [targets, setTargets] = useState<Map<string, TargetPosition>>(
    new Map([
      new TargetPosition(['SCHG', 'VTI', 'VXF'], 'Total Market', 0.40),
      new TargetPosition(['VCITX', 'CMF'], 'CA Muni Bonds', 0.30),
      new TargetPosition(['VIG', 'SCHD'], 'Dividend', 0.10),
      new TargetPosition(['VEA', 'SCHF'], 'International', 0.10), 
      new TargetPosition(['IEMG', 'VWO'], 'Emerging Market', 0.10),
    ].map(tp => [tp.key, tp]))
  );
  const [positions, setPositions] = useState<Map<string, AccountPosition>>(
    new Map()
  );

  
  return (
    <div className="container mx-auto px-10">
      <TargetSection
        targets={targets}
        setTargets={setTargets}
      />
      <PositionSection
        targets={targets}
        positions={positions}
        setPositions={setPositions}
      />
      <TradeSection 
        targets={targets}
        positions={positions}
      />
    </div>
  );
}

export default App;
