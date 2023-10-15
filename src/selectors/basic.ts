import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../data/store";
import { CASH_TARGET, CASH_TARGET_KEY } from "../data/targets";

export const selectCash = (state: RootState) => state.positions?.cash;
export const selectFunds = (state: RootState) => state.funds;
export const selectPrices = (state: RootState) => state.prices;
export const selectTargets = (state: RootState) => ({
  ... state.targets,
  [CASH_TARGET_KEY]: {
    ... CASH_TARGET,
    weight: Math.max(0, 1 - Object.values(state.targets).reduce((a, { weight }) => a + weight, 0))
  }
});
export const selectPositions = (state: RootState) => state.positions?.positions;

export const selectAllTickersFromPositions = createSelector(
  [selectPositions],
  (positions) => Object.values(positions).map(({ ticker }) =>  ticker)
);

export const selectPositionsByTicker = createSelector(
  [selectPositions, (_, tickers: string[]) => tickers],
  (positions, tickers) => tickers.map((t) => positions[t]).filter((p) => !!p)
);