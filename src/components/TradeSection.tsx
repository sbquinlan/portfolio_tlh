import { useState } from 'react';
import Papa from 'papaparse';

import TradeTable from './TradeTable';
import SectionCard from './SectionCard';
import TradeEditor from './TradeEditor';
import { useAppSelector } from '../data/store';
import { selectAllTickersFromPositions } from '../selectors/basic';
import { selectTradesWhereConfigs } from '../selectors/trades';

type TProps = { };
function TradeSection({ }: TProps) {
  const [wash_sale, setWashSale] = useState<string[]>([]);
  const [offset_gains, setOffsetGains] = useState<string[]>([]);
  const [loss_threshold, setLossThreshold] = useState<number>(5);
  const trades = useAppSelector(
    state => selectTradesWhereConfigs(
      state,
      { loss_threshold, close_all: new Set(offset_gains) },
      { wash_sale, normalize: false },
    )
  );
  const all_tickers = useAppSelector(selectAllTickersFromPositions);

  const on_export = () => {
    const csv_content = Papa.unparse(
      trades.map(
        ({ action, quantity, type, symbol, value, account, limit }) => ({
          Action: action,
          Symbol: symbol,
          SecType: type,
          TimeInForce: 'DAY',
          Account: account, 
          ... type === 'FUND' 
            ? { 
                Quantity: `${value.toFixed(2)}USD`,
                Exchange: 'FUNDSERV',
                OrderType: 'MKT',
                MonetaryValue: value.toFixed(3),
                LmtPrice: '',
                UsePriceMgmtAlgo: ''
              }
            : { 
                Quantity: quantity,
                Exchange: 'SMART/AMEX',
                OrderType: 'MIDPRICE',
                MonetaryValue: '',
                LmtPrice: limit,
                UsePriceMgmtAlgo: true
              },
        })
      ),
      {
        columns: [
          'Action',
          'Quantity',
          'Symbol',
          'SecType',
          'Exchange',
          'Currency',
          'TimeInForce',
          'OrderType',
          'Account',
          'MonetaryValue',
          'LmtPrice',
          'UsePriceMgmtAlgo'
        ],
      }
    );
    
    const link = document.createElement('a')
    link.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(csv_content)}`);
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
          lossThreshold={loss_threshold}
          setLossThreshold={setLossThreshold}
          onExport={on_export}
        />
      }
    >
      <TradeTable trades={trades} />
    </SectionCard>
  );
}

export default TradeSection;
