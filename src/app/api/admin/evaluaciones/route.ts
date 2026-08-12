import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

export async function GET() {
  try {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT e.id, e.student_id, e.test_id, e.psychologist_id, e.status,
                e."totalScore", e.maxScore, e.percentage, e.observations,
                e.recommendations, e.created_at, e.completed_at,
                s.first_name || ' ' || s.last_name as student_name,
                s.code as student_code,
                ei.name as institution_name,
                t.name as test_name,
                p.first_name || ' ' || p.last_name as psychologist_name
         FROM evaluations e
         JOIN students s ON e.student_id = s.id
         JOIN educational_institutions ei ON s.institution_id = ei.id
         JOIN tests t ON e.test_id = t.id
         LEFT JOIN psychologists p ON e.psychologist_id = p.id
         ORDER BY e.created_at DESC`
      )
      return NextResponse.json({ evaluations: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching evaluations:", error)
    return NextResponse.json({ error: "Error al obtener evaluaciones" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, testId, psychologistId, observations, recommendations, scheduledDate,
            studentFirstName, studentLastName, studentCode, studentInstitutionId } = body

    if (!testId) {
      return NextResponse.json({ error: "El test es requerido" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      let finalStudentId = studentId

      if (!finalStudentId && studentFirstName && studentLastName && studentInstitutionId) {
        const codeResult = await client.query(
          `SELECT COUNT(*) as count FROM students WHERE institution_id = $1`,
          [studentInstitutionId]
        )
        const codeNum = parseInt(codeResult.rows[0].count) + 1
        const instResult = await client.query("SELECT modular_code FROM educational_institutions WHERE id = $1", [studentInstitutionId])
        const instCode = instResult.rows[0]?.modular_code || "000"
        const code = studentCode || `EST${instCode}-${String(codeNum).padStart(3, "0")}`

        const newStudent = await client.query(
          `INSERT INTO students (id, code, first_name, last_name, institution_id, status, created_at, updated_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'active', NOW(), NOW())
           RETURNING id`,
          [code, studentFirstName, studentLastName, studentInstitutionId]
        )
        finalStudentId = newStudent.rows[0].id
      }

      if (!finalStudentId) {
        return NextResponse.json({ error: "Estudiante es requerido (seleccionar existente o ingresar datos nuevos)" }, { status: 400 })
      }

      const result = await client.query(
        `INSERT INTO evaluations (id, student_id, test_id, psychologist_id, status, observations, recommendations, scheduled_date, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, 'pending', $4, $5, $6, NOW(), NOW())
         RETURNING id, student_id, test_id, status, created_at`,
        [finalStudentId, testId, psychologistId || null, observations || null, recommendations || null, scheduledDate || null]
      )
      return NextResponse.json(result.rows[0], { status: 201 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error creating evaluation:", error)
    return NextResponse.json({ error: "Error al crear evaluación" }, { status: 500 })
  }
}