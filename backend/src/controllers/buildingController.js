const buildingModel = require('../models/buildingModel');

const VALID_STATUSES = ['operational', 'under_construction', 'unavailable'];

const list = async (req, res) => {
  try {
    const result = await buildingModel.getAllBuildings();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch buildings.' });
  }
};

const create = async (req, res) => {
  const { name, status } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Building name is required.' });
  }
  const finalStatus = status || 'operational';
  if (!VALID_STATUSES.includes(finalStatus)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    const result = await buildingModel.createBuilding(name.trim(), finalStatus);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A building with this name already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create building.' });
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
    const result = await buildingModel.updateBuilding(id, name.trim(), status);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Building not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A building with this name already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update building.' });
  }
};

module.exports = { list, create, update };
