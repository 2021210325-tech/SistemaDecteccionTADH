const { Pool } = require('pg');
const { config } = require('dotenv');
const { resolve } = require('path');
config({ path: resolve(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const client = await pool.connect();
  try {
    // Check evaluations with JOINs
    const r1 = await client.query(
      `SELECT e.id, e.student_id, e.test_id, e.status, s.first_name, s.institution_id, ei.name as inst_name, t.name as test_name
       FROM evaluations e
       JOIN students s ON e.student_id = s.id
       LEFT JOIN educational_institutions ei ON s.institution_id = ei.id
       JOIN tests t ON e.test_id = t.id`
    );
    console.log('Evaluaciones con JOINs:', JSON.stringify(r1.rows, null, 2));

    // Check students
    const r2 = await client.query('SELECT id, first_name, institution_id FROM students LIMIT 5');
    console.log('Students:', JSON.stringify(r2.rows, null, 2));

    // Check institutions
    const r3 = await client.query('SELECT id, name FROM educational_institutions LIMIT 5');
    console.log('Institutions:', JSON.stringify(r3.rows, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}
check();
