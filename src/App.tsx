import TargetSection from './components/TargetSection';
import PositionSection from './components/PositionSection';
import TradeSection from './components/TradeSection';

function App() {
  return (
    <div className="container grid grid-flow-row-dense lg:grid-cols-2 grid-cols-1 gap-4 mx-auto md:px-12 px-4">
      <TargetSection />
      <PositionSection />
      <TradeSection />
    </div>
  );
}

export default App;
