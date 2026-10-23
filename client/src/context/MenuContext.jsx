import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { MenuContext } from './menu';

export function MenuProvider({ children, initialMenu = null }) {
  const [state, setState] = useState(() => {
    if (initialMenu && Array.isArray(initialMenu.items) && initialMenu.items.length > 0) {
      return {
        status: 'ready',
        categories: Array.isArray(initialMenu.categories) ? initialMenu.categories : [],
        items: initialMenu.items,
        error: null,
      };
    }
    return { status: 'loading', categories: [], items: [], error: null };
  });

  const hasInitialMenu = Boolean(initialMenu && Array.isArray(initialMenu.items) && initialMenu.items.length > 0);

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
    load({ signal: controller.signal, silent: hasInitialMenu });
    return () => controller.abort();
  }, [load, hasInitialMenu]);

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
