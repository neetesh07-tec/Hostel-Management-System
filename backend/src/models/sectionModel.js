const pool = require('../config/db');

const getSectionsByFloor = (floorId) =>
  pool.query(
    `SELECT s.*,
            (SELECT COUNT(*) FROM rooms r WHERE r.section_id = s.id) AS room_count,
            (SELECT COALESCE(SUM(r.capacity),0) FROM rooms r WHERE r.section_id = s.id) AS total_capacity
       FROM sections s
      WHERE s.floor_id = $1
      ORDER BY s.name`,
    [floorId]
  );

const getSectionById = (id) =>
  pool.query('SELECT * FROM sections WHERE id = $1', [id]);

const createSection = (floorId, name, status = 'operational') =>
  pool.query(
    `INSERT INTO sections (floor_id, name, status)
     VALUES ($1, $2, $3) RETURNING *`,
    [floorId, name, status]
  );

const updateSection = (id, name, status) =>
  pool.query(
    'UPDATE sections SET name = $1, status = $2 WHERE id = $3 RETURNING *',
    [name, status, id]
  );

module.exports = {
  getSectionsByFloor,
  getSectionById,
  createSection,
  updateSection,
};
