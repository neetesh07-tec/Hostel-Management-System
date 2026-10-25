const floorModel = require('../models/floorModel');

const VALID_STATUSES = ['operational', 'under_construction', 'unavailable'];

const listByBuilding = async (req, res) => {
  const { buildingId } = req.params;
  try {
    const result = await floorModel.getFloorsByBuilding(buildingId);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch floors.' });
  }
};

const create = async (req, res) => {
  const { buildingId } = req.params;
  const { floor_number, name, status } = req.body;

  if (!floor_number || floor_number <= 0) {
    return res.status(400).json({ error: 'A positive floor number is required.' });
  }
  const finalStatus = status || 'operational';
  if (!VALID_STATUSES.includes(finalStatus)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    const result = await floorModel.createFloor(
      buildingId,
      parseInt(floor_number, 10),
      name ? name.trim() : `Floor ${floor_number}`,
      finalStatus
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This floor number already exists in the building.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create floor.' });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { floor_number, name, status } = req.body;
  if (!floor_number || floor_number <= 0 || !name || !name.trim() || !status) {
    return res.status(400).json({ error: 'Floor number, name, and status are required.' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    const result = await floorModel.updateFloor(
      id,
      parseInt(floor_number, 10),
      name.trim(),
      status
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Floor not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This floor number already exists in the building.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update floor.' });
  }
};

module.exports = { listByBuilding, create, update };
