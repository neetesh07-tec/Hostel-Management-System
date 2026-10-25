import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import StatCard from "../components/StatCard.jsx";
import { api } from "../services/api.js";

export default function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />

      <div className="page">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Real-time statistics from the hostel management database.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {stats && (
          <>
            <div className="stat-grid">
              <StatCard
                label="Active Students"
                value={stats.active_students}
                sub="Currently enrolled"
              />
              <StatCard label="Buildings" value={stats.total_buildings} />
              <StatCard label="Floors" value={stats.total_floors} />
              <StatCard label="Rooms" value={stats.total_rooms} />
            </div>

            <div className="stat-grid">
              <StatCard
                label="Total Bed Capacity"
                value={stats.total_bed_capacity}
                sub="beds total"
                color="var(--primary)"
              />
              <StatCard
                label="Occupied Beds"
                value={stats.occupied_beds}
                sub={`${stats.total_bed_capacity > 0 ? Math.round((stats.occupied_beds / stats.total_bed_capacity) * 100) : 0}% load`}
                color="var(--tertiary)"
              />
              <StatCard
                label="Available Beds"
                value={stats.available_beds}
                sub="immediate beds"
                color="var(--success)"
              />
              <StatCard
                label="Upcoming Bookings"
                value={stats.upcoming_bookings}
                sub="confirmed future"
                color="var(--warning)"
              />
            </div>

            <div className="stat-grid">
              <StatCard
                label="Expected Check-outs"
                value={stats.expected_checkouts}
                sub="next 7 days"
                color="var(--tertiary)"
              />
              <StatCard
                label="Outstanding Fees"
                value={`₹${stats.outstanding_fees.toLocaleString()}`}
                sub="unpaid balance"
                color="var(--danger)"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
