import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import targets from './targets';
import positions from './positions/positions';
import funds from './funds';
import prices from './prices';

export const LS_KEY = 'RDX_STATE';

function loadState() {
  try {
    const serialized = localStorage.getItem(LS_KEY);
    if (!serialized) return undefined;
    const targets = JSON.parse(serialized);
    return { targets };
  } catch (e: any) {
    console.error(e);
    return undefined;
  }
}

async function saveState({ targets }: RootState) {
  try {
    const serialized = JSON.stringify(targets);
    localStorage.setItem(LS_KEY, serialized);
  } catch (e: any) {
    console.error(e);
  }
}

export const store = configureStore({
  reducer: { funds, prices, positions, targets },
  preloadedState: loadState(),
});

store.subscribe(() => {
  saveState(store.getState());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
