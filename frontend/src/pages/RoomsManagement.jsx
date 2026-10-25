import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { api } from "../services/api.js";

const STATUS_OPTIONS = ["operational", "under_construction", "unavailable"];

const statusBadge = (status) => {
  const cls =
    status === "operational"
      ? "badge-success"
      : status === "under_construction"
        ? "badge-warning"
        : "badge-danger";
  return <span className={`badge ${cls}`}>{status.replace("_", " ")}</span>;
};

const occupancyPill = (room) => {
  const ratio = room.capacity > 0 ? room.occupied_beds / room.capacity : 0;
  const cls =
    room.occupied_beds === 0
      ? "badge-success"
      : ratio >= 1
        ? "badge-danger"
        : "badge-warning";
  return (
    <span className={`badge ${cls}`}>
      {room.occupied_beds}/{room.capacity} beds
    </span>
  );
};

export default function RoomsManagement({ user, onLogout }) {
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [sections, setSections] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [newBuilding, setNewBuilding] = useState({
    name: "",
    status: "operational",
  });
  const [newFloor, setNewFloor] = useState({
    floor_number: "",
    name: "",
    status: "operational",
  });
  const [newSection, setNewSection] = useState({
    name: "",
    status: "operational",
  });
  const [newRoom, setNewRoom] = useState({
    room_number: "",
    capacity: "",
    status: "operational",
  });

  // Inline edit states
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleError = (err) => {
    setError(err.message);
    setTimeout(() => setError(""), 4000);
  };

  // Load buildings
  useEffect(() => {
    api
      .getBuildings()
      .then(setBuildings)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);

  // When a building is selected, load its floors
  useEffect(() => {
    if (!selectedBuilding) {
      setFloors([]);
      return;
    }
    api.getFloors(selectedBuilding.id).then(setFloors).catch(handleError);
    setSelectedFloor(null);
  }, [selectedBuilding]);

  // When a floor is selected, load its sections
  useEffect(() => {
    if (!selectedFloor) {
      setSections([]);
      return;
    }
    api.getSections(selectedFloor.id).then(setSections).catch(handleError);
    setSelectedSection(null);
  }, [selectedFloor]);

  // When a section is selected, load its rooms
  useEffect(() => {
    if (!selectedSection) {
      setRooms([]);
      return;
    }
    api.getRooms(selectedSection.id).then(setRooms).catch(handleError);
  }, [selectedSection]);

  // --- Building actions ---
  const createBuilding = async (e) => {
    e.preventDefault();
    try {
      const b = await api.createBuilding(newBuilding);
      setBuildings([...buildings, b]);
      setNewBuilding({ name: "", status: "operational" });
      flash("Building created.");
    } catch (err) {
      handleError(err);
    }
  };

  const saveBuilding = async (id) => {
    try {
      const updated = await api.updateBuilding(id, editingBuilding);
      setBuildings(
        buildings.map((b) => (b.id === id ? { ...b, ...updated } : b)),
      );
      if (selectedBuilding?.id === id)
        setSelectedBuilding({ ...selectedBuilding, ...updated });
      setEditingBuilding(null);
      flash("Building updated.");
    } catch (err) {
      handleError(err);
    }
  };

  // --- Floor actions ---
  const createFloor = async (e) => {
    e.preventDefault();
    try {
      const f = await api.createFloor(selectedBuilding.id, newFloor);
      setFloors([...floors, f]);
      setNewFloor({ floor_number: "", name: "", status: "operational" });
      flash("Floor created.");
    } catch (err) {
      handleError(err);
    }
  };

  // --- Section actions ---
  const createSection = async (e) => {
    e.preventDefault();
    try {
      const s = await api.createSection(selectedFloor.id, newSection);
      setSections([...sections, s]);
      setNewSection({ name: "", status: "operational" });
      flash("Section created.");
    } catch (err) {
      handleError(err);
    }
  };

  // --- Room actions ---
  const createRoom = async (e) => {
    e.preventDefault();
    try {
      const r = await api.createRoom(selectedSection.id, {
        ...newRoom,
        capacity: parseInt(newRoom.capacity, 10),
      });
      setRooms([
        ...rooms,
        { ...r, occupied_beds: 0, available_beds: r.capacity },
      ]);
      setNewRoom({ room_number: "", capacity: "", status: "operational" });
      flash("Room created.");
    } catch (err) {
      handleError(err);
    }
  };

  const saveRoom = async (id) => {
    try {
      const updated = await api.updateRoom(id, {
        ...editingRoom,
        capacity: parseInt(editingRoom.capacity, 10),
      });
      setRooms(rooms.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      setEditingRoom(null);
      flash("Room updated.");
    } catch (err) {
      handleError(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading buildings...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />

      <div className="page">
        <div className="page-header">
          <h1>Rooms &amp; Buildings</h1>
          <p>
            Manage buildings, floors, sections, and rooms. Click an item to
            drill down.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {/* COLUMN 1: BUILDINGS */}
          <div className="card">
            <h3 style={{ marginBottom: 12, color: "var(--primary)" }}>
              Buildings
            </h3>
            {buildings.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No buildings yet.</p>
            ) : (
              <ul style={{ listStyle: "none", marginBottom: 16 }}>
                {buildings.map((b) => (
                  <li
                    key={b.id}
                    onClick={() => setSelectedBuilding(b)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background:
                        selectedBuilding?.id === b.id
                          ? "#eef2ff"
                          : "transparent",
                      marginBottom: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {b.floor_count} floors · {b.room_count} rooms ·{" "}
                        {b.total_capacity} beds
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBuilding({
                          id: b.id,
                          name: b.name,
                          status: b.status,
                        });
                      }}
                    >
                      Edit
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {editingBuilding ? (
              <div
                style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}
              >
                <div className="form-group">
                  <label>Name</label>
                  <input
                    value={editingBuilding.name}
                    onChange={(e) =>
                      setEditingBuilding({
                        ...editingBuilding,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editingBuilding.status}
                    onChange={(e) =>
                      setEditingBuilding({
                        ...editingBuilding,
                        status: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => saveBuilding(editingBuilding.id)}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setEditingBuilding(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={createBuilding}
                style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}
              >
                <div className="form-group">
                  <label>New building name</label>
                  <input
                    value={newBuilding.name}
                    onChange={(e) =>
                      setNewBuilding({ ...newBuilding, name: e.target.value })
                    }
                    placeholder="e.g. Tower B"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  + Add Building
                </button>
              </form>
            )}
          </div>

          {/* COLUMN 2: FLOORS */}
          <div className="card">
            <h3 style={{ marginBottom: 12, color: "var(--primary)" }}>
              Floors {selectedBuilding ? `· ${selectedBuilding.name}` : ""}
            </h3>
            {!selectedBuilding ? (
              <p style={{ color: "var(--muted)" }}>
                Select a building to view its floors.
              </p>
            ) : floors.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No floors yet.</p>
            ) : (
              <ul style={{ listStyle: "none", marginBottom: 16 }}>
                {floors.map((f) => (
                  <li
                    key={f.id}
                    onClick={() => setSelectedFloor(f)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background:
                        selectedFloor?.id === f.id ? "#eef2ff" : "transparent",
                      marginBottom: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {f.section_count} sections · {f.room_count} rooms ·{" "}
                        {f.total_capacity} beds
                      </div>
                    </div>
                    {statusBadge(f.status)}
                  </li>
                ))}
              </ul>
            )}

            {selectedBuilding && (
              <form
                onSubmit={createFloor}
                style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}
              >
                <div className="form-group">
                  <label>Floor number</label>
                  <input
                    type="number"
                    min="1"
                    value={newFloor.floor_number}
                    onChange={(e) =>
                      setNewFloor({ ...newFloor, floor_number: e.target.value })
                    }
                    placeholder="11"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Name (optional)</label>
                  <input
                    value={newFloor.name}
                    onChange={(e) =>
                      setNewFloor({ ...newFloor, name: e.target.value })
                    }
                    placeholder="Floor 11"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  + Add Floor
                </button>
              </form>
            )}
          </div>

          {/* COLUMN 3: SECTIONS */}
          <div className="card">
            <h3 style={{ marginBottom: 12, color: "var(--primary)" }}>
              Sections {selectedFloor ? `· ${selectedFloor.name}` : ""}
            </h3>
            {!selectedFloor ? (
              <p style={{ color: "var(--muted)" }}>
                Select a floor to view its sections.
              </p>
            ) : sections.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No sections yet.</p>
            ) : (
              <ul style={{ listStyle: "none", marginBottom: 16 }}>
                {sections.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => setSelectedSection(s)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background:
                        selectedSection?.id === s.id
                          ? "#eef2ff"
                          : "transparent",
                      marginBottom: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>Section {s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {s.room_count} rooms · {s.total_capacity} beds
                      </div>
                    </div>
                    {statusBadge(s.status)}
                  </li>
                ))}
              </ul>
            )}

            {selectedFloor && (
              <form
                onSubmit={createSection}
                style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}
              >
                <div className="form-group">
                  <label>Section name</label>
                  <input
                    value={newSection.name}
                    onChange={(e) =>
                      setNewSection({ ...newSection, name: e.target.value })
                    }
                    placeholder="C"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  + Add Section
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ROOMS TABLE */}
        {selectedSection && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16, color: "var(--primary)" }}>
              Rooms in Section {selectedSection.name}
            </h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Room #</th>
                  <th>Capacity</th>
                  <th>Occupancy</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        color: "var(--muted)",
                        padding: 24,
                      }}
                    >
                      No rooms in this section yet.
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) =>
                    editingRoom?.id === room.id ? (
                      <tr key={room.id}>
                        <td>
                          <input
                            value={editingRoom.room_number}
                            onChange={(e) =>
                              setEditingRoom({
                                ...editingRoom,
                                room_number: e.target.value,
                              })
                            }
                            style={{ width: 80, padding: 6 }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={editingRoom.capacity}
                            onChange={(e) =>
                              setEditingRoom({
                                ...editingRoom,
                                capacity: e.target.value,
                              })
                            }
                            style={{ width: 70, padding: 6 }}
                          />
                        </td>
                        <td
                          colSpan="2"
                          style={{ fontSize: 12, color: "var(--muted)" }}
                        >
                          Current peak occupancy: {room.occupied_beds}. Capacity
                          cannot go below this.
                        </td>
                        <td>
                          <select
                            value={editingRoom.status}
                            onChange={(e) =>
                              setEditingRoom({
                                ...editingRoom,
                                status: e.target.value,
                              })
                            }
                            style={{ padding: 6 }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: "6px 12px" }}
                              onClick={() => saveRoom(room.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: "6px 12px" }}
                              onClick={() => setEditingRoom(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={room.id}>
                        <td style={{ fontWeight: 600 }}>{room.room_number}</td>
                        <td>{room.capacity} beds</td>
                        <td>{occupancyPill(room)}</td>
                        <td>{room.available_beds}</td>
                        <td>{statusBadge(room.status)}</td>
                        <td>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "6px 12px" }}
                            onClick={() =>
                              setEditingRoom({
                                id: room.id,
                                room_number: room.room_number,
                                capacity: room.capacity,
                                status: room.status,
                              })
                            }
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>

            <form
              onSubmit={createRoom}
              style={{
                marginTop: 20,
                borderTop: "1px solid var(--border)",
                paddingTop: 16,
              }}
            >
              <h4 style={{ marginBottom: 12 }}>Add a room</h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 12,
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Room number</label>
                  <input
                    value={newRoom.room_number}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, room_number: e.target.value })
                    }
                    placeholder="201"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Capacity (beds)</label>
                  <input
                    type="number"
                    min="1"
                    value={newRoom.capacity}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, capacity: e.target.value })
                    }
                    placeholder="4"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Status</label>
                  <select
                    value={newRoom.status}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, status: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: 12 }}
              >
                + Add Room
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
