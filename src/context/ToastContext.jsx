import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360,
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const colors = {
    success: { bg: '#0f2d1a', border: '#22c55e', icon: '✓', iconColor: '#22c55e' },
    error:   { bg: '#2d0f0f', border: '#ef4444', icon: '✕', iconColor: '#ef4444' },
    info:    { bg: '#0f1a2d', border: '#6C63FF', icon: 'i', iconColor: '#6C63FF' },
    warning: { bg: '#2d240f', border: '#FFD166', icon: '!', iconColor: '#FFD166' },
  };
  const c = colors[toast.type] || colors.info;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 12,
      background: c.bg, border: `1px solid ${c.border}`,
      animation: 'toastSlideIn 0.3s ease forwards',
      position: 'relative', overflow: 'hidden',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: c.border + '30', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: c.iconColor, fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>
        {c.icon}
      </div>
      <span style={{ color: '#F0F0FF', fontSize: 13, flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{ background: 'none', border: 'none', color: '#8888AA', cursor: 'pointer', fontSize: 16, padding: 0 }}
      >×</button>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: 2,
        background: c.border, animation: 'toastProgress 4s linear forwards',
      }} />
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
