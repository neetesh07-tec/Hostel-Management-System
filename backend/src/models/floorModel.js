const pool = require('../config/db');

const getFloorsByBuilding = (buildingId) =>
  pool.query(
    `SELECT f.*,
            (SELECT COUNT(*) FROM sections s WHERE s.floor_id = f.id) AS section_count,
            (SELECT COUNT(*) FROM rooms r WHERE r.section_id IN
               (SELECT id FROM sections WHERE floor_id = f.id)) AS room_count,
            (SELECT COALESCE(SUM(r.capacity),0) FROM rooms r WHERE r.section_id IN
               (SELECT id FROM sections WHERE floor_id = f.id)) AS total_capacity
       FROM floors f
      WHERE f.building_id = $1
      ORDER BY f.floor_number`,
    [buildingId]
  );

const getFloorById = (id) =>
  pool.query('SELECT * FROM floors WHERE id = $1', [id]);

const createFloor = (buildingId, floorNumber, name, status = 'operational') =>
  pool.query(
    `INSERT INTO floors (building_id, floor_number, name, status)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [buildingId, floorNumber, name, status]
  );

const updateFloor = (id, floorNumber, name, status) =>
  pool.query(
    `UPDATE floors SET floor_number = $1, name = $2, status = $3
     WHERE id = $4 RETURNING *`,
    [floorNumber, name, status, id]
  );

module.exports = {
  getFloorsByBuilding,
  getFloorById,
  createFloor,
  updateFloor,
};
