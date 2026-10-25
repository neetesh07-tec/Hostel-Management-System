import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import { api } from '../services/api.js';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'checked_in', 'cancelled', 'completed'];

export default function BookingsManagement({ user, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    student_id: '', room_id: '', check_in_date: '', expected_check_out: '', status: 'pending',
  });

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const handleError = (err) => { setError(err.message); setTimeout(() => setError(''), 4000); };

  const loadBookings = () => {
    api.getBookings().then(setBookings).catch(handleError).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([api.getBookings(), api.getStudents()])
      .then(([b, s]) => {
        setBookings(b);
        setStudents(s.filter((st) => st.account_status === 'active'));
      })
      .catch(handleError)
      .finally(() => setLoading(false));

    // Load all rooms flattened across buildings
    api.getBuildings().then(async (buildings) => {
      const allRooms = [];
      for (const b of buildings) {
        const floors = await api.getFloors(b.id);
        for (const f of floors) {
          const sections = await api.getSections(f.id);
          for (const sec of sections) {
            const rms = await api.getRooms(sec.id);
            rms.forEach((r) => allRooms.push({ ...r, building_name: b.name, floor_number: f.floor_number, section_name: sec.name }));
          }
        }
      }
      setRooms(allRooms);
    }).catch(handleError);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ student_id: '', room_id: '', check_in_date: '', expected_check_out: '', status: 'pending' });
    setShowForm(true);
  };

  const openEdit = (b) => {
    setEditing(b.id);
    setForm({
      student_id: b.student_id,
      room_id: b.room_id,
      check_in_date: b.check_in_date,
      expected_check_out: b.expected_check_out,
      status: b.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateBooking(editing, {
          room_id: form.room_id,
          check_in_date: form.check_in_date,
          expected_check_out: form.expected_check_out,
        });
        flash('Booking updated.');
      } else {
        await api.createBooking(form);
        flash('Booking created.');
      }
      setShowForm(false);
      loadBookings();
    } catch (err) {
      handleError(err);
    }
  };

  const doAction = async (id, action, label) => {
    try {
      await action(id);
      flash(`${label} successful.`);
      loadBookings();
    } catch (err) {
      handleError(err);
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) {
    return (
      <div className="loading-screen"><div className="spinner"></div><p>Loading bookings...</p></div>
    );
  }

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div className="page">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1>Bookings</h1>
            <p>Manage room allocations, check-ins, and check-outs.</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ New Booking</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              className={filter === f ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Expected Out</th>
                <th>Actual In</th>
                <th>Actual Out</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No bookings found.</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.student_name}<br /><span style={{ fontSize: 11, color: 'var(--muted)' }}>{b.student_code}</span></td>
                    <td>{b.building_name} · Flr {b.floor_number} · Sec {b.section_name} · {b.room_number}</td>
                    <td>{b.check_in_date}</td>
                    <td>{b.expected_check_out}</td>
                    <td>{b.actual_check_in || '—'}</td>
                    <td>{b.actual_check_out || '—'}</td>
                    <td><Badge status={b.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(b.status === 'pending') && (
                          <>
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => doAction(b.id, api.confirmBooking, 'Confirm')}>Confirm</button>
                            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: 'var(--danger)' }} onClick={() => doAction(b.id, api.cancelBooking, 'Cancel')}>Cancel</button>
                          </>
                        )}
                        {(b.status === 'confirmed') && (
                          <>
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => doAction(b.id, api.checkInBooking, 'Check-in')}>Check In</button>
                            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: 'var(--danger)' }} onClick={() => doAction(b.id, api.cancelBooking, 'Cancel')}>Cancel</button>
                          </>
                        )}
                        {(b.status === 'checked_in') && (
                          <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => doAction(b.id, api.checkOutBooking, 'Check-out')}>Check Out</button>
                        )}
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(b)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal title={editing ? 'Edit Booking' : 'New Booking'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Student</label>
              <select
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                style={selectStyle}
                disabled={!!editing}
                required
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Room</label>
              <select
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                style={selectStyle}
                required
              >
                <option value="">Select room</option>
                {rooms.filter((r) => r.status === 'operational').map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.building_name} · Flr {r.floor_number} · Sec {r.section_name} · {r.room_number} ({r.capacity} beds, {r.available_beds} avail)
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Check-in Date</label>
                <input type="date" value={form.check_in_date} onChange={(e) => setForm({ ...form, check_in_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Expected Check-out</label>
                <input type="date" value={form.expected_check_out} onChange={(e) => setForm({ ...form, expected_check_out: e.target.value })} required />
              </div>
            </div>
            {!editing && (
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={selectStyle}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary">{editing ? 'Save' : 'Create'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const selectStyle = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' };
