import React from 'react';

export default function Modal({ title, children, onClose, maxWidth = 480 }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: 'var(--primary)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        {children}
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
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 40px rgba(15,23,42,0.15)',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  color: 'var(--muted)',
  padding: 4,
};
