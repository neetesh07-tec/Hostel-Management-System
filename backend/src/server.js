const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Hostel Management backend running on http://localhost:${PORT}`);
  console.log(`DB config -> host=${process.env.PG_HOST || process.env.DB_HOST} port=${process.env.PG_PORT || process.env.DB_PORT} db=${process.env.PG_DATABASE || process.env.DB_NAME} user=${process.env.PG_USER || process.env.DB_USER}`);
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully.');
  } catch (err) {
    console.error('❌ Database connection FAILED:', err.message);
    console.error('   Check that Postgres is running and the database exists.');
  }
});
