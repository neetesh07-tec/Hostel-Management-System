import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider, ToastContainer } from './context/ToastContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RoomsManagement from './pages/RoomsManagement.jsx';
import RoomOccupancy from './pages/RoomOccupancy.jsx';
import StudentsManagement from './pages/StudentsManagement.jsx';
import BookingsManagement from './pages/BookingsManagement.jsx';
import FeesManagement from './pages/FeesManagement.jsx';
import AccountSettings from './pages/AccountSettings.jsx';
import StudentPortal from './pages/StudentPortal.jsx';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const homeRedirect = user
    ? user.role === 'admin'
      ? '/dashboard'
      : '/portal'
    : '/login';

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={homeRedirect} replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="admin">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute role="admin">
            <RoomsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/occupancy"
        element={
          <ProtectedRoute role="admin">
            <RoomOccupancy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute role="admin">
            <StudentsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute role="admin">
            <BookingsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fees"
        element={
          <ProtectedRoute role="admin">
            <FeesManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute role="admin">
            <AccountSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal"
        element={
          <ProtectedRoute role="student">
            <StudentPortal />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={homeRedirect} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
}
