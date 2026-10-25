import React from 'react';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: 'var(--primary)', marginBottom: 12 }}>{title}</h3>
        <p style={{ color: 'var(--secondary)', marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: 16,
};

const modalStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 28,
  width: '100%',
  maxWidth: 420,
  boxShadow: '0 20px 40px rgba(15,23,42,0.15)',
};
