import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { api } from '../services/api.js';

export default function AccountSettings({ user, onLogout }) {
  const [emailForm, setEmailForm] = useState({ new_email: user.email || '', current_password: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const handleError = (err) => { setError(err.message); setTimeout(() => setError(''), 4000); };

  const changeEmail = async (e) => {
    e.preventDefault();
    try {
      const result = await api.changeEmail(emailForm);
      flash(result.message);
      setEmailForm({ ...emailForm, current_password: '' });
    } catch (err) { handleError(err); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return handleError(new Error('New passwords do not match.'));
    }
    try {
      const result = await api.changePassword(passwordForm);
      flash(result.message);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) { handleError(err); }
  };

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div className="page">
        <div className="page-header">
          <h1>Account Settings</h1>
          <p>Manage your email and password. Current password is required for all changes.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16, color: 'var(--primary)' }}>Change Email</h3>
            <form onSubmit={changeEmail}>
              <div className="form-group">
                <label>New Email</label>
                <input type="email" value={emailForm.new_email} onChange={(e) => setEmailForm({ ...emailForm, new_email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={emailForm.current_password} onChange={(e) => setEmailForm({ ...emailForm, current_password: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary">Update Email</button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16, color: 'var(--primary)' }}>Change Password</h3>
            <form onSubmit={changePassword}>
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
              <button type="submit" className="btn btn-primary">Update Password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
