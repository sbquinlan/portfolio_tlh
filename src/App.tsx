import TargetSection from './components/TargetSection';
import PositionSection from './components/PositionSection';
import TradeSection from './components/TradeSection';

function App() {
  return (
    <div className="container mx-auto px-10">
      <TargetSection />
      <PositionSection  />
      <TradeSection />
    </div>
  );
}

export default App;
