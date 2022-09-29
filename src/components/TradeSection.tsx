import { useState } from 'react';
import { calculate_trades } from '../data/trades';
import { useAppSelector } from '../data/store';
import TradeTable from './TradeTable';
import SectionCard from './SectionCard';
import TradeEditor from './TradeEditor';
import {
  DisplayTargetState,
  selectAllTickersFromPositions,
  selectPositionsByTicker,
} from '../data/display';
import { useSelector } from 'react-redux';

type TProps = { targets: DisplayTargetState[] };
function TradeSection({ targets }: TProps) {
  const [wash_sale, setWashSale] = useState<string[]>([]);
  const [offset_gains, setOffsetGains] = useState<string[]>([]);

  const all_tickers = useSelector(selectAllTickersFromPositions);
  const offset_gains_positions = useAppSelector((state) =>
    selectPositionsByTicker(state, offset_gains)
  );

  const trades = calculate_trades(targets, offset_gains_positions, wash_sale);
  const on_export = () => {
    const initial = Object.fromEntries(
      targets.flatMap(
        dt => dt.positions.map<[string, number]>( ({ ticker, value }) => [ticker, value] )
      ),
    );
    const updated = trades
      .filter( ({ order }) => order !== 'wash' )
      .map<[string, number]>( ({ ticker, value }) => [ticker, value] )
      .reduce<Record<string, number>>(
        (acc, [ticker, value]) => ({ 
          ... acc, 
          [ticker]: (ticker in acc ? acc[ticker] : 0) - value
        }),
        initial
      )
    const total_value = Object.values(updated).reduce((acc, n) => acc + n, 0);
    const weights = Object.entries(updated)
      .filter( ([_, value]) => value >= 1)
      .map( ([ticker, value]) => {
        const weight = (100 * value) / total_value;
        return `DES,${ticker},STK,SMART/AMEX,,,,,,${weight.toFixed(5)}`
      })
      .join('\n')
    
    const link = document.createElement('a')
    link.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(weights)}`);
    link.setAttribute('download', 'export.csv');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click()
    document.body.removeChild(link);
  }
  return (
    <SectionCard
      title="Trades"
      controls={
        <TradeEditor
          allTickers={all_tickers}
          washSale={wash_sale}
          setWashSale={setWashSale}
          offsetGains={offset_gains}
          setOffsetGains={setOffsetGains}
          onExport={on_export}
        />
      }
    >
      <TradeTable trades={trades} />
    </SectionCard>
  );
}

export default TradeSection;
