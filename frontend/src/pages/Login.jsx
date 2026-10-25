import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useForm } from '../hooks/useForm.js';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { values, handleChange } = useForm({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(values.email, values.password);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Hostel Management</h1>
        <p className="subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="admin@hostel.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-creds">
          <strong>Demo credentials (dev only):</strong>
          <br />
          Admin — admin@hostel.com / Admin@123
          <br />
          Student — shahrukh.khan@student.hostel.com / Student@123
        </div>
      </div>
    </div>
  );
}
