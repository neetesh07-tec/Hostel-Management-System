import React, { useMemo, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';

// ----- helpers -----

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const daysUntil = (iso) => {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

const genderLabel = (g) => (g ? g.charAt(0).toUpperCase() : '—');

// ----- room card -----

function RoomCard({ room, onClick }) {
  const occupants = room.occupants || [];
  const isFull = occupants.length >= room.capacity;
  const isEmpty = occupants.length === 0;

  const totalOutstanding = occupants.reduce(
    (sum, o) => sum + (parseFloat(o.outstanding) || 0),
    0
  );

  return (
    <div
      className={`room-card ${isEmpty ? 'room-card--empty' : ''} ${isFull ? 'room-card--full' : ''}`}
      onClick={onClick}
    >
      <div className="room-card__head">
        <span className="room-card__number">{room.room_number}</span>
        <span className="room-card__tag">
          {occupants.length > 0
            ? occupants.map((o) => genderLabel(o.gender)).join('') || '—'
            : '—'}
          {' • '}
          {room.section_name}
        </span>
      </div>

      <div className="room-card__body">
        {isEmpty ? (
          <>
            <div className="room-card__title">Available Bed{room.capacity > 1 ? 's' : ''}</div>
            <div className="room-card__sub">
              {room.capacity} bed{room.capacity > 1 ? 's' : ''} • Ready now
            </div>
          </>
        ) : (
          occupants.map((o) => {
            const days = daysUntil(o.expected_check_out);
            const outstanding = parseFloat(o.outstanding) || 0;
            return (
              <div className="room-card__occupant" key={o.booking_id}>
                <div className="room-card__name">{o.student_name}</div>
                <div className="room-card__sub">
                  Out: {formatDate(o.expected_check_out)}
                  {days !== null && days >= 0 ? ` (${days}d)` : ''}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="room-card__foot">
        {isEmpty ? (
          <span className="room-card__status room-card__status--ok">
            ● {room.available_beds} free
          </span>
        ) : totalOutstanding > 0 ? (
          <span className="room-card__status room-card__status--due">
            ● ${totalOutstanding.toFixed(0)} due
          </span>
        ) : (
          <span className="room-card__status room-card__status--ok">● Paid</span>
        )}
        <button className="btn btn-ghost room-card__btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          {isEmpty ? 'Inspect' : 'Inspect'}
        </button>
      </div>
    </div>
  );
}

// ----- room detail modal -----

function RoomDetailModal({ room, onClose, onCheckOut }) {
  if (!room) return null;
  const occupants = room.occupants || [];

  return (
    <Modal title={`Room ${room.room_number}`} onClose={onClose} maxWidth={760}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14, color: 'var(--muted)' }}>
          <div><strong style={{ color: 'var(--primary)' }}>Building:</strong> {room.building_name}</div>
          <div><strong style={{ color: 'var(--primary)' }}>Floor:</strong> {room.floor_name || room.floor_number}</div>
          <div><strong style={{ color: 'var(--primary)' }}>Section:</strong> {room.section_name}</div>
          <div><strong style={{ color: 'var(--primary)' }}>Capacity:</strong> {room.capacity} beds</div>
          <div><strong style={{ color: 'var(--primary)' }}>Occupied:</strong> {occupants.length}/{room.capacity}</div>
        </div>
      </div>

      <h4 style={{ marginBottom: 12, color: 'var(--primary)' }}>
        {occupants.length > 0 ? `Students in this room (${occupants.length})` : 'No students currently in this room'}
      </h4>

      {occupants.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
          This room is empty. {room.capacity} bed{room.capacity > 1 ? 's are' : ' is'} available.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {occupants.map((o) => {
            const outstanding = parseFloat(o.outstanding) || 0;
            const days = daysUntil(o.expected_check_out);
            return (
              <div className="card" key={o.booking_id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                      {o.student_name}
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                        {o.student_code}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                      {o.email}
                    </div>
                    {o.phone && (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                        {o.phone}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={`badge ${o.gender === 'female' ? 'badge-info' : o.gender === 'male' ? 'badge-muted' : 'badge-muted'}`}>
                      {o.gender || '—'}
                    </span>
                    {outstanding > 0 ? (
                      <span className="badge badge-danger">${outstanding.toFixed(2)} due</span>
                    ) : (
                      <span className="badge badge-success">Paid</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
                  <div><strong style={{ color: 'var(--secondary)' }}>Check-in:</strong> {formatDate(o.check_in_date)}</div>
                  <div>
                    <strong style={{ color: 'var(--secondary)' }}>Expected check-out:</strong> {formatDate(o.expected_check_out)}
                    {days !== null && days >= 0 ? ` (${days} day${days === 1 ? '' : 's'} left)` : ''}
                  </div>
                  <div><strong style={{ color: 'var(--secondary)' }}>Status:</strong> {o.status}</div>
                </div>
                {o.status === 'checked_in' && (
                  <div style={{ marginTop: 12, textAlign: 'right' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => onCheckOut(o.booking_id)}
                    >
                      Check-Out
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

// ----- main page -----

export default function RoomOccupancy() {
  const { showToast } = useToast();
  const { data: rooms, loading, refetch } = useApi(() => api.getAllRooms());
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Group rooms by building > floor > section
  const grouped = useMemo(() => {
    const result = [];
    if (!rooms) return result;
    const buildingMap = new Map();
    for (const room of rooms) {
      const bKey = room.building_name;
      if (!buildingMap.has(bKey)) buildingMap.set(bKey, new Map());
      const floorMap = buildingMap.get(bKey);
      const fKey = `${room.floor_number}|${room.floor_name || ''}`;
      if (!floorMap.has(fKey)) floorMap.set(fKey, new Map());
      const sectionMap = floorMap.get(fKey);
      const sKey = room.section_name;
      if (!sectionMap.has(sKey)) sectionMap.set(sKey, []);
      sectionMap.get(sKey).push(room);
    }
    for (const [bName, floorMap] of buildingMap) {
      const floors = [];
      for (const [fKey, sectionMap] of floorMap) {
        const [fNum, fName] = fKey.split('|');
        const sections = [];
        for (const [sName, sectionRooms] of sectionMap) {
          sections.push({ name: sName, rooms: sectionRooms });
        }
        floors.push({ number: fNum, name: fName, sections });
      }
      result.push({ name: bName, floors });
    }
    return result;
  }, [rooms]);

  const buildings = useMemo(() => {
    const set = new Set();
    (rooms || []).forEach((r) => set.add(r.building_name));
    return Array.from(set).sort();
  }, [rooms]);

  const floors = useMemo(() => {
    const set = new Set();
    (rooms || [])
      .filter((r) => filterBuilding === 'all' || r.building_name === filterBuilding)
      .forEach((r) => set.add(`${r.floor_number}|${r.floor_name || ''}`));
    return Array.from(set).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [rooms, filterBuilding]);

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    return rooms.filter((r) => {
      if (filterBuilding !== 'all' && r.building_name !== filterBuilding) return false;
      if (filterFloor !== 'all' && `${r.floor_number}|${r.floor_name || ''}` !== filterFloor) return false;
      const occ = (r.occupants || []).length;
      if (filterStatus === 'occupied' && occ === 0) return false;
      if (filterStatus === 'available' && occ >= r.capacity) return false;
      return true;
    });
  }, [rooms, filterBuilding, filterFloor, filterStatus]);

  const stats = useMemo(() => {
    const total = rooms?.length || 0;
    const occupied = (rooms || []).filter((r) => (r.occupants || []).length > 0).length;
    const available = (rooms || []).filter((r) => (r.occupants || []).length < r.capacity).length;
    return { total, occupied, available };
  }, [rooms]);

  const handleCheckOut = async (bookingId) => {
    try {
      await api.checkOutBooking(bookingId);
      showToast('Student checked out.');
      setSelectedRoom(null);
      refetch();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading rooms...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="page">
        <PageHeader
          title="Room Occupancy"
          subtitle="Visual overview of all rooms. Click any room card to view student details and check-out."
        />

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total Rooms</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Occupied</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.occupied}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Available Rooms</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.available}</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
              <label>Building</label>
              <select
                value={filterBuilding}
                onChange={(e) => { setFilterBuilding(e.target.value); setFilterFloor('all'); }}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
              >
                <option value="all">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
              <label>Floor</label>
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
              >
                <option value="all">All Floors</option>
                {floors.map((f) => {
                  const [num, name] = f.split('|');
                  return (
                    <option key={f} value={f}>
                      {name ? `${name} (Floor ${num})` : `Floor ${num}`}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
              <label>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
              >
                <option value="all">All Rooms</option>
                <option value="occupied">Occupied</option>
                <option value="available">Available</option>
              </select>
            </div>
          </div>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 48 }}>
            No rooms match the selected filters.
          </div>
        ) : (
          grouped.map((building) => {
            const buildingRooms = filteredRooms.filter((r) => r.building_name === building.name);
            if (buildingRooms.length === 0) return null;
            return (
              <div key={building.name} style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 22, color: 'var(--primary)', marginBottom: 16 }}>
                  {building.name}
                </h2>
                {building.floors.map((floor) => {
                  const floorRooms = buildingRooms.filter((r) => `${r.floor_number}|${r.floor_name || ''}` === `${floor.number}|${floor.name || ''}`);
                  if (floorRooms.length === 0) return null;
                  return (
                    <div key={`${building.name}-${floor.number}`} style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 16, color: 'var(--secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {floor.name ? `${floor.name} ` : ''}Floor {floor.number}
                      </h3>
                      {floor.sections.map((section) => {
                        const sectionRooms = floorRooms.filter((r) => r.section_name === section.name);
                        if (sectionRooms.length === 0) return null;
                        const occCount = sectionRooms.reduce((s, r) => s + (r.occupants || []).length, 0);
                        const capCount = sectionRooms.reduce((s, r) => s + r.capacity, 0);
                        return (
                          <div key={`${building.name}-${floor.number}-${section.name}`} style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <h4 style={{ fontSize: 15, color: 'var(--primary)', fontWeight: 600 }}>
                                Section {section.name}
                              </h4>
                              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                                {occCount}/{capCount} beds occupied
                              </span>
                            </div>
                            <div className="room-grid">
                              {sectionRooms.map((room) => (
                                <RoomCard
                                  key={room.id}
                                  room={room}
                                  onClick={() => setSelectedRoom(room)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <RoomDetailModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
        onCheckOut={handleCheckOut}
      />
    </div>
  );
}
