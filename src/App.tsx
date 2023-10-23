import TargetSection from './components/TargetSection';
import PositionSection from './components/PositionSection';
import TradeSection from './components/TradeSection';

function App() {
  return (
    <div className="container flex flex-col gap-4 mx-auto">
      <TargetSection />
      <PositionSection />
      <TradeSection />
    </div>
  );
}

export default App;
