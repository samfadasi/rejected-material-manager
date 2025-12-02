const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        employee_id VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'inspector',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ncr_reports (
        id SERIAL PRIMARY KEY,
        ncr_number VARCHAR(50) UNIQUE NOT NULL,
        date_raised DATE NOT NULL,
        raised_by_name VARCHAR(255) NOT NULL,
        raised_by_employee_id VARCHAR(100),
        department VARCHAR(100) NOT NULL,
        process_area VARCHAR(255),
        source_type VARCHAR(100) NOT NULL,
        nonconformity_description TEXT NOT NULL,
        requirement_reference VARCHAR(255),
        severity VARCHAR(50) NOT NULL,
        immediate_correction TEXT,
        root_cause TEXT,
        corrective_action TEXT,
        preventive_action TEXT,
        responsible_person VARCHAR(255),
        target_date DATE,
        closure_date DATE,
        status VARCHAR(50) DEFAULT 'Open',
        attachment_path VARCHAR(500),
        created_by_user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ncr_counter (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        counter INTEGER DEFAULT 0,
        UNIQUE(year)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

module.exports = { pool, initDatabase };
