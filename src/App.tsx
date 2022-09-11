import { DisplayTargetState } from './types/display';
import { TargetPosition } from './types/targets';
import { AccountPosition } from './types/portfolio';
import { useState } from 'react';
import TargetSection from './components/TargetSection';
import PositionSection from './components/PositionSection';

function App() {
  const [targets, setTargets] = useState<TargetPosition[]>([
    new TargetPosition(['SCHG', 'VTI', 'VXF'], 'Total Market', 35),
    new TargetPosition(['VCITX'], 'CA Muni Bonds', 35),
    new TargetPosition(['VIG', 'SCHD'], 'Dividend', 10),
    new TargetPosition(['VEA', 'SCHF'], 'International', 10), 
    new TargetPosition(['IEMG', 'VWO'], 'Emerging Market', 10),

    new TargetPosition(['VBK', 'VB'], 'Small Cap', 0), 
    new TargetPosition(
      ['VOT'],
      'Vanguard Mid-Cap Growth Index Fund ETF',
      0
    ),

    new TargetPosition(['F'], 'Ford', 0),
    new TargetPosition(['AAL'], 'American Airlines', 0),
  ]);
  const [positions, setPositions] = useState<Map<string, AccountPosition>>(
    new Map()
  );
  const portfolio_positions = targets.reduce<DisplayTargetState[]>(
    (acc, target) => acc.concat(
      new DisplayTargetState(
        target,
        target.tickers
          .map((ticker) => positions.get(ticker))
          .filter((n) => !!n) as any
      )
    ),
    []
  );

  const tickers = targets.reduce<string[]>(
    (acc, next) => acc.concat(next.tickers),
    []
  );
  const unallocated = new DisplayTargetState(
    new TargetPosition(['unallocated'], 'Unallocated Positions', 0),
    Array.from(positions.values())
      .filter((p) => !~tickers.indexOf(p.ticker))
      .sort((a, b) => b.value - a.value)
  );
  return (
    <div className="container mx-auto px-10">
      <TargetSection
        targets={targets}
        setTargets={setTargets}
      />
      <PositionSection
        positions={[...portfolio_positions, unallocated]}
        setPositions={setPositions}
      />
    </div>
  );
}

export default App;
