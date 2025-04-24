const { Pool } = require('pg');


const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'badMinton',
  password: "12345678",
  port: process.env.DB_PORT || 5432,

});
  
const checkConnection = async () => {
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Database connection successful:', result.rows[0].now);
      return true;
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
      return false;
    }
  };

checkConnection();

pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});



module.exports = {pool,checkConnection};