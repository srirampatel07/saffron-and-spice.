import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

const initial = {
  status: 'loading',
  data: null,
  error: null,
};

export default function usePublicConfig() {
  const [state, setState] = useState(initial);

  const load = useCallback(async (signal) => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const data = await api.getConfig({ signal });
      setState({ status: 'ready', data, error: null });
    } catch (error) {
      if (error.name === 'AbortError') return;
      setState({ status: 'error', data: null, error: error.message || 'Could not load payment options.' });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return {
    ...state,
    isLoading: state.status === 'loading',
    onlinePaymentEnabled: Boolean(state.data?.onlinePayment?.enabled),
    refresh: () => load(),
  };
}
