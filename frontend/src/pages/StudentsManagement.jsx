import React, { useCallback, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StudentForm from '../components/StudentForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Badge from '../components/Badge.jsx';
import DataTable from '../components/DataTable.jsx';
import { useApi } from '../hooks/useApi.js';
import { useModal } from '../hooks/useModal.js';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';

export default function StudentsManagement() {
  const { showToast } = useToast();
  const { data: students, loading, refetch } = useApi(() => api.getStudents());

  const formModal = useModal(false);
  const confirmModal = useModal(false);
  const [editing, setEditing] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const openAdd = useCallback(() => {
    setEditing(null);
    formModal.open();
  }, [formModal]);

  const openEdit = useCallback(
    (student) => {
      setEditing(student);
      formModal.open();
    },
    [formModal]
  );

  const handleSubmit = useCallback(
    async (formValues) => {
      try {
        if (editing) {
          const { full_name, student_code, email, phone, gender } = formValues;
          await api.updateStudent(editing.id, { full_name, student_code, email, phone, gender });
          showToast('Student updated.');
        } else {
          await api.createStudent(formValues);
          showToast('Student created.');
        }
        formModal.close();
        refetch();
      } catch (err) {
        showToast(err.message, 'error');
      }
    },
    [editing, formModal, refetch, showToast]
  );

  const handleDeactivate = useCallback(async () => {
    try {
      await api.deactivateStudent(deactivatingId);
      showToast('Student deactivated.');
      confirmModal.close();
      refetch();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [deactivatingId, confirmModal, refetch, showToast]);

  const askDeactivate = useCallback(
    (id) => {
      setDeactivatingId(id);
      confirmModal.open();
    },
    [confirmModal]
  );

  const columns = [
    { key: 'student_code', header: 'Student ID', style: { fontWeight: 600 } },
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'phone',
      header: 'Phone',
      render: (s) => s.phone || '—',
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (s) => s.gender || '—',
    },
    {
      key: 'current_room',
      header: 'Room',
      render: (s) => {
        if (!s.current_room) return <span style={{ color: 'var(--muted)' }}>—</span>;
        return (
          <span style={{ fontWeight: 600 }}>
            {s.current_room}
          </span>
        );
      },
    },
    {
      key: 'current_building',
      header: 'Building',
      render: (s) => {
        if (!s.current_building) return <span style={{ color: 'var(--muted)' }}>—</span>;
        return (
          <span>
            {s.current_building}
            {s.current_floor ? ` · F${s.current_floor}` : ''}
            {s.current_section ? ` · Sec ${s.current_section}` : ''}
          </span>
        );
      },
    },
    { key: 'booking_count', header: 'Bookings' },
    {
      key: 'account_status',
      header: 'Status',
      render: (s) => <Badge status={s.account_status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={() => openEdit(s)}>
            Edit
          </button>
          {s.account_status === 'active' && (
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 12px', color: 'var(--danger)', borderColor: '#fecaca' }}
              onClick={() => askDeactivate(s.id)}
            >
              Deactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="page">
        <PageHeader
          title="Students"
          subtitle="Manage student records. Deactivating preserves booking & payment history."
          action={<button className="btn btn-primary" onClick={openAdd}>+ Add Student</button>}
        />

        <div className="card">
          <DataTable columns={columns} data={students || []} emptyMessage="No students found." />
        </div>
      </div>

      <StudentForm
        open={formModal.isOpen}
        editing={editing}
        onClose={formModal.close}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        title="Deactivate Student?"
        message="This student will no longer be able to log in. Their booking and payment history is preserved."
        confirmLabel="Yes, deactivate"
        onConfirm={handleDeactivate}
        onCancel={confirmModal.close}
      />
    </div>
  );
}
