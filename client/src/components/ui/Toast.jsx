import { useState, useEffect, useCallback } from 'react';
import './Toast.css';

let toastId = 0;
let addToastFn = null;

export function toast(message, type = 'info', duration = 4000) {
  if (addToastFn) addToastFn({ id: ++toastId, message, type, duration });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  addToastFn = useCallback((t) => {
    setToasts(prev => [...prev, t]);
    setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== t.id));
    }, t.duration);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} role="status">
          <span className="toast-icon">
            {t.type === 'success' && '✓'}
            {t.type === 'error' && '✕'}
            {t.type === 'warning' && '!'}
            {t.type === 'info' && 'i'}
          </span>
          <span className="toast-message">{t.message}</span>
          <button className="toast-dismiss" onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}>×</button>
        </div>
      ))}
    </div>
  );
}
