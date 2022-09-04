import { DisplayTargetState } from './types/display';
import {
  TargetPosition,
  TargetMultiPosition,
  TargetSimplePosition,
  TargetFundPosition,
} from './types/targets';
import { AccountPosition } from './types/portfolio';
import { useState } from 'react';
import TargetSection from './components/TargetSection';
import PositionSection from './components/PositionSection';

function App() {
  const [targets, setTargets] = useState([
    new TargetMultiPosition(['SCHG', 'VTI', 'VXF'], 0.35),
    new TargetSimplePosition('VCITX', 'Vanguard CA Muni', 0.3),
    new TargetMultiPosition(['VIG', 'SCHD'], 0.1), // dividend
    new TargetMultiPosition(['VEA', 'SCHF'], 0.1), // international
    new TargetMultiPosition(['IEMG', 'VWO'], 0.1), // emerging

    new TargetMultiPosition(['VBK', 'VB'], 0), // small cap
    new TargetSimplePosition(
      'VOT',
      'Vanguard Mid-Cap Growth Index Fund ETF',
      0
    ),

    new TargetSimplePosition('F', 'Ford', 0),
    new TargetSimplePosition('AAL', 'American Airlines', 0),
  ]);
  const [positions, setPositions] = useState<Map<string, AccountPosition>>(
    new Map()
  );
  const portfolio_positions = targets.reduce(
    (acc: DisplayTargetState[], target: TargetPosition) => {
      if (target instanceof TargetMultiPosition) {
        return acc.concat(
          new DisplayTargetState(
            target,
            target.tickers
              .map((ticker) => positions.get(ticker))
              .filter((n) => !!n) as any
          )
        );
      } else if (
        target instanceof TargetSimplePosition ||
        target instanceof TargetFundPosition
      ) {
        return acc.concat(
          new DisplayTargetState(
            target,
            positions.has(target.ticker) ? [positions.get(target.ticker)!] : []
          )
        );
      }
      return [];
    },
    []
  );

  const tickers = targets.reduce(
    (acc, next) =>
      acc.concat(
        next instanceof TargetMultiPosition
          ? next.tickers
          : ((next as any).ticker as string)
      ),
    [] as string[]
  );
  const unallocated = new DisplayTargetState(
    new TargetSimplePosition('unallocated', 'Unallocated Positions', 0),
    Array.from(positions.values())
      .filter((p) => !~tickers.indexOf(p.ticker))
      .sort((a, b) => b.value - a.value)
  );
  return (
    <div className="container mx-auto px-10">
      <TargetSection
        targets={targets}
        setWeight={(t, w) => {
          t.weight = w;
        }}
        onDelete={(t) => {
          setTargets(targets.filter((v) => t !== v));
        }}
      />
      <PositionSection
        positions={[...portfolio_positions, unallocated]}
        setPositions={setPositions}
      />
    </div>
  );
}

export default App;
