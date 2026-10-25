const pool = require('../config/db');

const getAllBuildings = () =>
  pool.query(
    `SELECT b.*,
            (SELECT COUNT(*) FROM floors f WHERE f.building_id = b.id) AS floor_count,
            (SELECT COUNT(*) FROM rooms r
               JOIN sections s ON s.id = r.section_id
               JOIN floors f ON f.id = s.floor_id
              WHERE f.building_id = b.id) AS room_count,
            (SELECT COALESCE(SUM(r.capacity),0) FROM rooms r
               JOIN sections s ON s.id = r.section_id
               JOIN floors f ON f.id = s.floor_id
              WHERE f.building_id = b.id) AS total_capacity
       FROM buildings b
      ORDER BY b.name`
  );

const getBuildingById = (id) =>
  pool.query('SELECT * FROM buildings WHERE id = $1', [id]);

const createBuilding = (name, status = 'operational') =>
  pool.query(
    'INSERT INTO buildings (name, status) VALUES ($1, $2) RETURNING *',
    [name, status]
  );

const updateBuilding = (id, name, status) =>
  pool.query(
    'UPDATE buildings SET name = $1, status = $2 WHERE id = $3 RETURNING *',
    [name, status, id]
  );

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
};
