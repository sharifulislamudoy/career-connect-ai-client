import { useSyncExternalStore } from 'react';
import { subscribePwa, getPwaSnapshot, installPwa } from '../lib/pwa';

export function usePwaInstall() {
  const state = useSyncExternalStore(subscribePwa, getPwaSnapshot, getPwaSnapshot);
  return { ...state, install: installPwa };
}
