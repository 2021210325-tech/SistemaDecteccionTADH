import { NextResponse } from "next/server"
import { Pool } from "pg"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

const JWT_SECRET = process.env.JWT_SECRET || "tdah-system-secret-key-2026"

async function getUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null
  try { return (jwt.verify(token, JWT_SECRET) as { userId: string }).userId } catch { return null }
}

export async function GET() {
  try {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT e.id, e.student_id, e.test_id, e.psychologist_id, e.status,
                e.observations, e.recommendations, e.created_at, e.completed_at, e.has_symptoms,
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
    const userId = await getUserId()

    const body = await request.json()
    const { studentId, testId, observations, recommendations, scheduledDate,
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

      // Obtener psychologist_id del usuario actual
      let psychologistId = null
      if (userId) {
        const psychResult = await client.query("SELECT id FROM psychologists WHERE user_id = $1", [userId])
        if (psychResult.rows.length > 0) psychologistId = psychResult.rows[0].id
      }

      // Obtener version_id del test
      const versionResult = await client.query(
        "SELECT id FROM test_versions WHERE test_id = $1 AND is_current = true",
        [testId]
      )
      const versionId = versionResult.rows.length > 0 ? versionResult.rows[0].id : null

      const result = await client.query(
        `INSERT INTO evaluations (id, student_id, test_id, version_id, psychologist_id, created_by_id, status, observations, recommendations, scheduled_date, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'pending', $6, $7, $8, NOW(), NOW())
         RETURNING id, student_id, test_id, status, created_at`,
        [finalStudentId, testId, versionId, psychologistId, userId || null, observations || null, recommendations || null, scheduledDate || null]
      )

      // Obtener datos completos para el dashboard
      const fullResult = await client.query(
        `SELECT e.id, e.student_id, e.test_id, e.psychologist_id, e.status,
                e.observations, e.recommendations, e.created_at,
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
         WHERE e.id = $1`,
        [result.rows[0].id]
      )

      return NextResponse.json(fullResult.rows[0], { status: 201 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error creating evaluation:", error)
    return NextResponse.json({ error: "Error al crear evaluación" }, { status: 500 })
  }
}