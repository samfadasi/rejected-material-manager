const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
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
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'INSPECTOR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ncr_reports (
        id SERIAL PRIMARY KEY,
        ncr_number VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        report_date TIMESTAMP NOT NULL,
        area VARCHAR(255),
        line VARCHAR(100),
        product_name VARCHAR(255),
        product_code VARCHAR(100),
        ncr_source VARCHAR(100),
        ncr_type VARCHAR(100),
        severity VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        immediate_action TEXT,
        root_cause TEXT,
        root_cause_category VARCHAR(100),
        corrective_action TEXT,
        preventive_action TEXT,
        responsible_person VARCHAR(255),
        responsible_department VARCHAR(255),
        target_date DATE,
        closure_date DATE,
        status VARCHAR(50) DEFAULT 'Open',
        raised_by_name VARCHAR(255),
        raised_by_id VARCHAR(100),
        verified_by_name VARCHAR(255),
        verified_by_id VARCHAR(100),
        approved_by_name VARCHAR(255),
        approved_by_id VARCHAR(100),
        process_area VARCHAR(255),
        remarks TEXT,
        attachment_path VARCHAR(500),
        created_by_user_id INTEGER REFERENCES users(id)
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
