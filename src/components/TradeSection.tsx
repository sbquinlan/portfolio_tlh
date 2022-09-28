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
        />
      }
    >
      <TradeTable trades={trades} />
    </SectionCard>
  );
}

export default TradeSection;
