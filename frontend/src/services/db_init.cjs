const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'db.fsqimethnzloxmxkwfse.supabase.co',
  database: 'postgres',
  password: '@Sandeepj9660',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  console.log('🔄 Initializing Supabase PostgreSQL Schema for FaceSecureAI...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Users Table
    console.log('Creating table: users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        password_hash VARCHAR(255) NOT NULL,
        roles JSONB DEFAULT '["ROLE_USER"]'::jsonb,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Face Biometric Embeddings Table
    console.log('Creating table: face_embeddings...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS face_embeddings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(100) NOT NULL,
        full_name VARCHAR(200),
        templates JSONB DEFAULT '[]'::jsonb,
        vectors JSONB DEFAULT '[]'::jsonb,
        quality_score NUMERIC(5,2) DEFAULT 98.5,
        enrolled_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Attendance & Real-Time Clock Logs Table
    console.log('Creating table: attendance...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user_snapshot JSONB DEFAULT '{}'::jsonb,
        date DATE NOT NULL,
        clock_in TIMESTAMPTZ,
        clock_out TIMESTAMPTZ,
        work_hours NUMERIC(5,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'PRESENT',
        device_info VARCHAR(100) DEFAULT 'Scan Station Terminal',
        confidence NUMERIC(5,2) DEFAULT 98.5,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Helpdesk Support Queries Table
    console.log('Creating table: helpdesk_queries...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS helpdesk_queries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(100),
        user_full_name VARCHAR(200),
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'GENERAL',
        priority VARCHAR(50) DEFAULT 'MEDIUM',
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'OPEN',
        admin_response TEXT,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Security Audit & Intrusion Logs Table
    console.log('Creating table: security_audit_logs...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_audit_logs (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        user_id INTEGER,
        username VARCHAR(100),
        confidence NUMERIC(5,2),
        details TEXT,
        status VARCHAR(50) DEFAULT 'INFO',
        ip_address VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Kiosk Terminals Table
    console.log('Creating table: kiosk_terminals...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kiosk_terminals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(100),
        status VARCHAR(50) DEFAULT 'ONLINE',
        last_heartbeat TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Insert Default System Administrator if not exists
    const adminCheck = await client.query("SELECT id FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      console.log('Seeding initial admin account...');
      await client.query(`
        INSERT INTO users (username, email, first_name, last_name, phone, password_hash, roles, status)
        VALUES ('admin', 'admin@facesecureai.internal', 'System', 'Administrator', '+1 800 555 0199', 'admin123', '["ROLE_ADMIN", "ROLE_USER"]'::jsonb, 'ACTIVE');
      `);
    }

    // Insert Default Employee test account if not exists
    const empCheck = await client.query("SELECT id FROM users WHERE username = 'employee'");
    if (empCheck.rows.length === 0) {
      console.log('Seeding initial employee account...');
      await client.query(`
        INSERT INTO users (username, email, first_name, last_name, phone, password_hash, roles, status)
        VALUES ('employee', 'employee@facesecureai.internal', 'Demo', 'Employee', '+1 800 555 0198', 'employee123', '["ROLE_USER"]'::jsonb, 'ACTIVE');
      `);
    }

    // Enable Supabase Realtime for these tables
    try {
      await client.query(`
        ALTER PUBLICATION supabase_realtime ADD TABLE users, face_embeddings, attendance, helpdesk_queries, security_audit_logs;
      `);
      console.log('✅ Enabled Supabase Realtime publication on all tables.');
    } catch (pubErr) {
      console.log('Note on Realtime Publication:', pubErr.message);
    }

    await client.query('COMMIT');
    console.log('===================================================');
    console.log('🎉 Supabase PostgreSQL Database Initialized Successfully!');
    console.log('Tables: users, face_embeddings, attendance, helpdesk_queries, security_audit_logs, kiosk_terminals');
    console.log('===================================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database Initialization Failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
