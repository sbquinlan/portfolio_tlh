import TargetSection from './components/TargetSection';
import PositionSection from './components/PositionSection';
import TradeSection from './components/TradeSection';
import { useAppSelector } from './data/store';
import { selectTargetsJoinPositions } from './selectors/display';

function App() {
  const targets = useAppSelector(selectTargetsJoinPositions);
  return (
    <div className="container flex flex-col gap-4 mx-auto">
      <TargetSection targets={targets} />
      <PositionSection targets={targets} />
      <TradeSection targets={targets} />
    </div>
  );
}

export default App;
