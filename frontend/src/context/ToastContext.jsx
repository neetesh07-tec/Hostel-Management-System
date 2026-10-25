import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success') => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), type === 'error' ? 4000 : 3000);
    },
    [removeToast]
  );

  const value = { toasts, showToast, removeToast };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div style={containerStyle}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const cls = toast.type === 'error' ? 'alert-error' : 'alert-success';

  return (
    <div
      className={`alert ${cls}`}
      style={{
        ...toastStyle,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
      }}
      onClick={onClose}
    >
      {toast.message}
    </div>
  );
}

const containerStyle = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  pointerEvents: 'none',
};

const toastStyle = {
  transition: 'all 0.25s ease',
  cursor: 'pointer',
  pointerEvents: 'auto',
  marginBottom: 0,
  boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
  maxWidth: 360,
};
