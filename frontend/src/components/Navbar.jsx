import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const linkClass = (path) =>
    location.pathname === path
      ? { color: 'var(--primary)', fontWeight: 700 }
      : { color: 'var(--secondary)' };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div className="navbar-brand">Hostel Management</div>
        <div className="navbar-links">
          <Link to="/dashboard" style={linkClass('/dashboard')}>Dashboard</Link>
          <Link to="/rooms" style={linkClass('/rooms')}>Rooms</Link>
          <Link to="/occupancy" style={linkClass('/occupancy')}>Occupancy</Link>
          <Link to="/students" style={linkClass('/students')}>Students</Link>
          <Link to="/bookings" style={linkClass('/bookings')}>Bookings</Link>
          <Link to="/fees" style={linkClass('/fees')}>Fees</Link>
          <Link to="/settings" style={linkClass('/settings')}>Settings</Link>
        </div>
      </div>
      <div className="navbar-user">
        <span style={{ color: 'var(--secondary)' }}>{user.email}</span>
        <span className="badge badge-info">Admin</span>
        <button className="btn btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
