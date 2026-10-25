const sectionModel = require('../models/sectionModel');

const VALID_STATUSES = ['operational', 'under_construction', 'unavailable'];

const listByFloor = async (req, res) => {
  const { floorId } = req.params;
  try {
    const result = await sectionModel.getSectionsByFloor(floorId);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sections.' });
  }
};

const create = async (req, res) => {
  const { floorId } = req.params;
  const { name, status } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Section name is required.' });
  }
  const finalStatus = status || 'operational';
  if (!VALID_STATUSES.includes(finalStatus)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    const result = await sectionModel.createSection(floorId, name.trim(), finalStatus);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A section with this name already exists on the floor.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create section.' });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  if (!name || !name.trim() || !status) {
    return res.status(400).json({ error: 'Name and status are required.' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    const result = await sectionModel.updateSection(id, name.trim(), status);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A section with this name already exists on the floor.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update section.' });
  }
};

module.exports = { listByFloor, create, update };
