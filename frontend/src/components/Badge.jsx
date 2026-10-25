import React from 'react';

const STATUS_MAP = {
  operational: { cls: 'badge-success', label: 'Operational' },
  under_construction: { cls: 'badge-warning', label: 'Under Construction' },
  unavailable: { cls: 'badge-danger', label: 'Unavailable' },
  active: { cls: 'badge-success', label: 'Active' },
  inactive: { cls: 'badge-muted', label: 'Inactive' },
  pending: { cls: 'badge-warning', label: 'Pending' },
  confirmed: { cls: 'badge-info', label: 'Confirmed' },
  cancelled: { cls: 'badge-muted', label: 'Cancelled' },
  checked_in: { cls: 'badge-success', label: 'Checked In' },
  completed: { cls: 'badge-muted', label: 'Completed' },
};

export default function Badge({ status }) {
  const info = STATUS_MAP[status] || { cls: 'badge-muted', label: status };
  return <span className={`badge ${info.cls}`}>{info.label}</span>;
}
