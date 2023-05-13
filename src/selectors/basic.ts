import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../data/store";

export const selectCash = (state: RootState) => state.cash.value;
export const selectFunds = (state: RootState) => state.funds;
export const selectPrices = (state: RootState) => state.prices;
export const selectTargets = (state: RootState) => state.targets;
export const selectPositions = (state: RootState) => state.positions;

export const selectAllTickersFromPositions = createSelector(
  [selectPositions],
  (positions) => Object.keys(positions)
);

export const selectPositionsByTicker = createSelector(
  [selectPositions, (_, tickers: string[]) => tickers],
  (positions, tickers) => tickers.map((t) => positions[t]).filter((p) => !!p)
);