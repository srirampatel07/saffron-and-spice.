import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { MenuContext } from './menu';

export function MenuProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', categories: [], items: [], error: null });

  const load = useCallback(async ({ signal, silent = false } = {}) => {
    setState((current) => ({
      ...current,
      status: silent && current.items.length > 0 ? current.status : 'loading',
      error: null,
    }));

    try {
      const data = await api.getMenu({ signal });
      setState({
        status: 'ready',
        categories: Array.isArray(data?.categories) ? data.categories : [],
        items: Array.isArray(data?.items) ? data.items : [],
        error: null,
      });
    } catch (error) {
      if (error.name === 'AbortError') return;
      setState((current) => ({
        ...current,
        status: 'error',
        error: error.message || 'The menu could not be loaded.',
      }));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  const refresh = useCallback(() => load({ silent: true }), [load]);

  const value = useMemo(
    () => ({
      ...state,
      isLoading: state.status === 'loading',
      refresh,
    }),
    [state, refresh],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}
