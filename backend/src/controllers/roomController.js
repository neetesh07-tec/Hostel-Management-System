const roomModel = require('../models/roomModel');

const VALID_STATUSES = ['operational', 'under_construction', 'unavailable'];

// All rooms across every building/floor/section, with current occupants.
const listAll = async (req, res) => {
  try {
    const result = await roomModel.getAllRoomsWithOccupants();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rooms.' });
  }
};

// Single room with its current occupants.
const getOne = async (req, res) => {
  try {
    const result = await roomModel.getRoomWithOccupants(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch room.' });
  }
};

const listBySection = async (req, res) => {
  const { sectionId } = req.params;
  try {
    const result = await roomModel.getRoomsBySection(sectionId);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rooms.' });
  }
};

const create = async (req, res) => {
  const { sectionId } = req.params;
  const { room_number, capacity, status } = req.body;

  if (!room_number || !room_number.trim()) {
    return res.status(400).json({ error: 'Room number is required.' });
  }
  if (!capacity || !Number.isInteger(capacity) || capacity <= 0) {
    return res.status(400).json({ error: 'Capacity must be a positive integer.' });
  }
  const finalStatus = status || 'operational';
  if (!VALID_STATUSES.includes(finalStatus)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  try {
    const result = await roomModel.createRoom(
      sectionId,
      room_number.trim(),
      parseInt(capacity, 10),
      finalStatus
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A room with this number already exists in the section.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create room.' });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { room_number, capacity, status } = req.body;

  if (!room_number || !room_number.trim() || !capacity || !status) {
    return res.status(400).json({ error: 'Room number, capacity, and status are required.' });
  }
  if (!Number.isInteger(capacity) || capacity <= 0) {
    return res.status(400).json({ error: 'Capacity must be a positive integer.' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  try {
    const existing = await roomModel.getRoomById(id);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    // Capacity validation: cannot reduce below current or future peak occupancy.
    const newCapacity = parseInt(capacity, 10);
    const peak = await roomModel.getPeakOccupancy(id);
    if (newCapacity < peak) {
      return res.status(400).json({
        error: `Cannot set capacity to ${newCapacity}: the room has ${peak} overlapping confirmed/checked-in booking(s). Capacity must be at least ${peak}.`,
      });
    }

    const result = await roomModel.updateRoom(
      id,
      room_number.trim(),
      newCapacity,
      status
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A room with this number already exists in the section.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update room.' });
  }
};

module.exports = { listAll, getOne, listBySection, create, update };
