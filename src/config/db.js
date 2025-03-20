const { Pool } = require('pg');

// Create a new Pool instance with your PostgreSQL connection details
const pool = new Pool({
  user: 'postgres',      // Replace with your PostgreSQL username
  host: 'localhost',          // Host where PostgreSQL is running
  database: 'badMinton',  // Replace with your database name
  password: '12345678',  // Replace with your actual password as a string
  port: 5432,                 // Default PostgreSQL port
});

// Test that the connection is working
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;