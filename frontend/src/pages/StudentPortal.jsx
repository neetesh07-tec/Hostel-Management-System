import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Badge from '../components/Badge.jsx';

export default function StudentPortal({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [booking, setBooking] = useState(null);
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const handleError = (err) => { setError(err.message); setTimeout(() => setError(''), 4000); };

  useEffect(() => {
    Promise.all([api.getMyProfile(), api.getMyBooking(), api.getMyFees(), api.getMyPayments()])
      .then(([p, b, f, pay]) => {
        setProfile(p);
        setBooking(b);
        setFees(f);
        setPayments(pay);
      })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return handleError(new Error('New passwords do not match.'));
    }
    try {
      const result = await api.changePassword(passwordForm);
      flash(result.message);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
    } catch (err) { handleError(err); }
  };

  const handleLogout = async () => {
    await api.logout();
    onLogout();
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div><p>Loading your portal...</p></div>;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">Hostel Management</div>
        <div className="navbar-user">
          <span style={{ color: 'var(--secondary)' }}>{profile?.full_name || user.email}</span>
          <span className="badge badge-info">Student</span>
          <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <h1>My Portal</h1>
          <p>View your profile, room allocation, booking, and fee records.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* PROFILE */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, color: 'var(--primary)' }}>Profile</h3>
          <table className="table">
            <tbody>
              <tr><th style={{ width: 180 }}>Full Name</th><td>{profile?.full_name}</td></tr>
              <tr><th>Student ID</th><td>{profile?.student_code}</td></tr>
              <tr><th>Email</th><td>{profile?.email}</td></tr>
              <tr><th>Phone</th><td>{profile?.phone || '—'}</td></tr>
              <tr><th>Gender</th><td>{profile?.gender || '—'}</td></tr>
              <tr><th>Account Status</th><td><Badge status={profile?.account_status} /></td></tr>
            </tbody>
          </table>
        </div>

        {/* BOOKING / ROOM */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, color: 'var(--primary)' }}>Room &amp; Booking</h3>
          {!booking ? (
            <p style={{ color: 'var(--muted)' }}>You currently have no active booking.</p>
          ) : (
            <table className="table">
              <tbody>
                <tr><th style={{ width: 180 }}>Room</th><td>{booking.building_name} · Floor {booking.floor_number} · Section {booking.section_name} · Room {booking.room_number}</td></tr>
                <tr><th>Room Capacity</th><td>{booking.capacity} beds</td></tr>
                <tr><th>Booking Status</th><td><Badge status={booking.status} /></td></tr>
                <tr><th>Check-in Date</th><td>{booking.check_in_date}</td></tr>
                <tr><th>Expected Check-out</th><td>{booking.expected_check_out}</td></tr>
                <tr><th>Actual Check-in</th><td>{booking.actual_check_in || '—'}</td></tr>
                <tr><th>Actual Check-out</th><td>{booking.actual_check_out || '—'}</td></tr>
              </tbody>
            </table>
          )}
        </div>

        {/* FEES */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, color: 'var(--primary)' }}>Fee Records</h3>
          {fees.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No fee records found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Description</th><th>Amount Due</th><th>Paid</th><th>Outstanding</th><th>Due Date</th></tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id}>
                    <td>{f.description}</td>
                    <td>₹{parseFloat(f.amount_due).toLocaleString()}</td>
                    <td>₹{parseFloat(f.amount_paid || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: f.outstanding > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ₹{parseFloat(f.outstanding).toLocaleString()}
                    </td>
                    <td>{f.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAYMENT HISTORY */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, color: 'var(--primary)' }}>Payment History</h3>
          {payments.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No payments recorded.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Description</th><th>Amount</th><th>Method</th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.payment_date}</td>
                    <td>{p.fee_description}</td>
                    <td>₹{parseFloat(p.amount).toLocaleString()}</td>
                    <td>{p.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* CHANGE PASSWORD */}
        <div className="card">
          <h3 style={{ marginBottom: 16, color: 'var(--primary)' }}>Security</h3>
          {!showPasswordForm ? (
            <button className="btn btn-primary" onClick={() => setShowPasswordForm(true)}>Change Password</button>
          ) : (
            <form onSubmit={changePassword} style={{ maxWidth: 400 }}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} minLength={6} required />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} minLength={6} required />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary">Update Password</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowPasswordForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
