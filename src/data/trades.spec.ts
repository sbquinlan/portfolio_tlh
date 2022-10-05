
import { describe, expect, it } from 'vitest'
import { AccountPosition } from './positions';
import { TargetPosition } from './targets';
import { get_adjusted_portfolio, get_sell_trades } from './trades'

let UUID = 0;
function fake_target(tickers: string[], weight: number) {
  return { tickers, weight, name: 'fake', key: `target${UUID++}`};
}

function fake_position(
  ticker: string,
  value: number,
  gain: number,
  gainvalue: number,
  loss: number,
  lossvalue: number,
) {
  return {
    key: ticker,
    ticker,
    value,
    gain,
    gainvalue,
    loss,
    lossvalue,
  }
}

function fake_aggregation(target: TargetPosition, positions: AccountPosition[]) {
  return { key: target.key, target, positions };
}

const TARGETS = [
  fake_aggregation(
    fake_target(['VTI', 'SCHB'], 0.35),
    [
      fake_position('VTIB', 1000, 1000, 1000, 0, 0),
      fake_position('SCHB', 1000, 0, 0, -1000, 1000),
    ]
  ),
  fake_aggregation(
    fake_target(['TWIB', 'MUB'], 0.35),
    []
  ),
  fake_aggregation(
    fake_target(['VEA', 'SCHF'], 0.10),
    [
      fake_position('VEA', 1000, 0, 0, -1000, 1000),
    ]
  ),
  fake_aggregation(
    fake_target(['VWO', 'IEMG'], 0.10),
    [
      fake_position('IEMG', 1000, 100, 1000, 0, 0),
    ]
  ),
  fake_aggregation(
    fake_target(['SCHD', 'VIG'], 0.10),
    [
      fake_position('SCHD', 1000, 800, 800, -200, 200),
      fake_position('VIG', 1000, 200, 200, -800, 800),
    ]
  ),
]

describe('get_sell_trades', () => {
  it('sells losses', () => {
    const orders = get_sell_trades(TARGETS, new Set());
    expect(orders.map(t => t.ticker)).toEqual(['SCHB', 'VEA', 'SCHD', 'VIG'])
    expect(orders.map(t => t.value)).toEqual([1000, 1000, 200, 800])
  })

  it('sells entire positions when asked', () => {
    const orders = get_sell_trades(TARGETS, new Set('IEMG'));
    expect(orders.map(t => t.ticker)).toEqual(['SCHB', 'VEA', 'SCHD', 'VIG'])
    expect(orders.map(t => t.value)).toEqual([1000, 1000, 200, 800])
  })
});

describe('get_adjusted_portfolio', () => {
  it('calculates an updated portfolio based on sales', () => {
    const orders = get_sell_trades(TARGETS, new Set());
    const adj_values = get_adjusted_portfolio(TARGETS, new Set());

    const total_liquid = orders.reduce(
      (sum, o) => sum + o.value,
      0
    );
    const initial_total = TARGETS.reduce(
      (t_sum, t) => t_sum + t.positions.reduce<number>(
        (p_sum, p) => p_sum + p.value,
        0,
      ), 
      0
    );
    
    // the sum of all adjusted values
    const adj_total = adj_values
      .reduce((sum, [_, amt]) => sum + amt, 0);
    // find the max ratio between target weight and current weight 
    const max_total = adj_values.map(([t, amt]) => (amt / t.target.weight))
      .reduce((max, t) => Math.max(max, t), 0);
    // distance in value between current and next balanced position
    const catchup_amount = max_total - adj_total;
    expect(adj_total + total_liquid).toEqual(initial_total)
  });
  
})