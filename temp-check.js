const { Pool } = require('pg')
const p = new Pool({ connectionString: 'postgresql://neondb_owner:npg_nKMk5idCZ2qy@ep-twilight-pond-ac4x0ckk.sa-east-1.aws.neon.tech/neondb?sslmode=require' })

async function run() {
  const [tests, students, psychologists, evaluations] = await Promise.all([
    p.query('SELECT id, code, name FROM tests'),
    p.query('SELECT id, code, first_name, last_name, institution_id FROM students'),
    p.query('SELECT id, user_id, first_name, last_name FROM psychologists'),
    p.query(`SELECT id, student_id, test_id, status, "totalScore", percentage, created_at FROM evaluations`),
  ])
  console.log('=== TESTS ===')
  tests.rows.forEach(r => console.log(' ', r.id, r.code, r.name))
  console.log('=== STUDENTS ===')
  students.rows.forEach(r => console.log(' ', r.id, r.code, r.first_name, r.last_name))
  console.log('=== PSYCHOLOGISTS ===')
  psychologists.rows.forEach(r => console.log(' ', r.id, r.first_name, r.last_name))
  console.log('=== EVALUATIONS ===')
  evaluations.rows.forEach(r => console.log(' ', r.id, r.status, r.totalScore, r.percentage))
  await p.end()
}

run().catch(e => { console.error(e); process.exit(1) })
