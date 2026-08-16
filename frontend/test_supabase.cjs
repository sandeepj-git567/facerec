const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const SUPABASE_URL = 'https://fsqimethnzloxmxkwfse.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HBxr2NEOtdWhPLCyi5wYOA_kr94_flY';

console.log('Testing Supabase Client...');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSupabase() {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.log('Supabase API query response:', error.message);
    } else {
      console.log('Supabase API connected successfully! Data:', data);
    }
  } catch (err) {
    console.error('Supabase API error:', err.message);
  }

  console.log('\nTesting PostgreSQL direct connection with pg Pool...');
  const poolConfigs = [
    {
      user: 'postgres',
      host: 'db.fsqimethnzloxmxkwfse.supabase.co',
      database: 'postgres',
      password: '@Sandeepj9660',
      port: 5432,
      ssl: { rejectUnauthorized: false }
    },
    {
      user: 'postgres',
      host: 'db.fsqimethnzloxmxkwfse.supabase.co',
      database: 'postgres',
      password: 'Sandeepj9660',
      port: 5432,
      ssl: { rejectUnauthorized: false }
    }
  ];

  for (let i = 0; i < poolConfigs.length; i++) {
    const cfg = poolConfigs[i];
    console.log(`Trying password format #${i + 1}...`);
    const pool = new Pool(cfg);
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT NOW() as current_time, version()');
      console.log('✅ PostgreSQL Direct Connected successfully!');
      console.log('Server Time:', res.rows[0].current_time);
      console.log('PostgreSQL Version:', res.rows[0].version);
      client.release();
      await pool.end();
      return cfg;
    } catch (e) {
      console.log(`❌ Attempt #${i + 1} failed:`, e.message);
      await pool.end().catch(() => {});
    }
  }
}

testSupabase();
