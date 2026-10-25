import React from 'react';

export default function FormField({ label, children, hint }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      {children}
      {hint && <small style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4, display: 'block' }}>{hint}</small>}
    </div>
  );
}

export function TextInput({ label, ...props }) {
  return (
    <FormField label={label}>
      <input {...props} />
    </FormField>
  );
}

export function SelectInput({ label, options, ...props }) {
  return (
    <FormField label={label}>
      <select {...props} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
