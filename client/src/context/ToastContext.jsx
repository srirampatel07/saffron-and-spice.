import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Close } from '../components/Icons';
import { ToastContext } from './toast';

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, { tone = 'default', duration = 3600 } = {}) => {
      const id = (nextId += 1);
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      const timer = setTimeout(() => remove(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [remove],
  );

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach((timer) => clearTimeout(timer));
      active.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {toast.tone === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => remove(toast.id)}
              aria-label="Dismiss notification"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
