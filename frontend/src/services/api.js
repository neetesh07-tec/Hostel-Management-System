const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  health: () => request('/health'),
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Buildings
  getBuildings: () => request('/buildings'),
  createBuilding: (data) => request('/buildings', { method: 'POST', body: JSON.stringify(data) }),
  updateBuilding: (id, data) => request(`/buildings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Floors
  getFloors: (buildingId) => request(`/floors/building/${buildingId}`),
  createFloor: (buildingId, data) => request(`/floors/building/${buildingId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateFloor: (id, data) => request(`/floors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Sections
  getSections: (floorId) => request(`/sections/floor/${floorId}`),
  createSection: (floorId, data) => request(`/sections/floor/${floorId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateSection: (id, data) => request(`/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Rooms
  getRooms: (sectionId) => request(`/rooms/section/${sectionId}`),
  getAllRooms: () => request('/rooms'),
  getRoom: (id) => request(`/rooms/${id}`),
  createRoom: (sectionId, data) => request(`/rooms/section/${sectionId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id, data) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Students
  getStudents: () => request('/students'),
  getStudent: (id) => request(`/students/${id}`),
  createStudent: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateStudent: (id) => request(`/students/${id}/deactivate`, { method: 'PATCH' }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Bookings
  getBookings: () => request('/bookings'),
  getBooking: (id) => request(`/bookings/${id}`),
  createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id, data) => request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  confirmBooking: (id) => request(`/bookings/${id}/confirm`, { method: 'PATCH' }),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  checkInBooking: (id) => request(`/bookings/${id}/check-in`, { method: 'PATCH' }),
  checkOutBooking: (id) => request(`/bookings/${id}/check-out`, { method: 'PATCH' }),

  // Fees
  getFees: () => request('/fees'),
  getFeesByStudent: (studentId) => request(`/fees/student/${studentId}`),
  createFee: (data) => request('/fees', { method: 'POST', body: JSON.stringify(data) }),

  // Payments
  getPayments: () => request('/payments'),
  getPaymentsByStudent: (studentId) => request(`/payments/student/${studentId}`),
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),

  // Account settings (self-service)
  changeEmail: (data) => request('/account/email', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data) => request('/account/password', { method: 'PATCH', body: JSON.stringify(data) }),

  // Student self-service
  getMyProfile: () => request('/student/profile'),
  getMyBooking: () => request('/student/booking'),
  getMyFees: () => request('/student/fees'),
  getMyPayments: () => request('/student/payments'),
};
