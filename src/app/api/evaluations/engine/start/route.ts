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
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch { return null }
}

// POST: Crear/iniciar evaluación
export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await request.json()
    const { studentId, testId } = body

    if (!studentId || !testId) {
      return NextResponse.json({ error: "studentId y testId son requeridos" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      // Verificar que el test sea compatible con la edad del estudiante
      const studentResult = await client.query(
        `SELECT id, date_of_birth, first_name, last_name FROM students WHERE id = $1`,
        [studentId]
      )
      if (studentResult.rows.length === 0) {
        return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
      }

      const student = studentResult.rows[0]
      const testResult = await client.query(
        `SELECT id, code, name, population, min_age, max_age FROM tests WHERE id = $1 AND is_active = true`,
        [testId]
      )
      if (testResult.rows.length === 0) {
        return NextResponse.json({ error: "Test no encontrado o inactivo" }, { status: 404 })
      }

      const test = testResult.rows[0]

      // Calcular edad
      if (student.date_of_birth) {
        const birth = new Date(student.date_of_birth)
        const today = new Date()
        let age = today.getFullYear() - birth.getFullYear()
        if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
          age--
        }

        if (test.min_age && age < test.min_age) {
          return NextResponse.json({ error: `El estudiante tiene ${age} años. La edad mínima para ${test.name} es ${test.min_age} años` }, { status: 400 })
        }
        if (test.max_age && age > test.max_age) {
          return NextResponse.json({ error: `El estudiante tiene ${age} años. La edad máxima para ${test.name} es ${test.max_age} años` }, { status: 400 })
        }
      }

      // Obtener versión actual del test
      const versionResult = await client.query(
        `SELECT id FROM test_versions WHERE test_id = $1 AND is_current = true`,
        [testId]
      )
      if (versionResult.rows.length === 0) {
        return NextResponse.json({ error: "No hay versión activa para este test" }, { status: 404 })
      }

      // Obtener el psychologist_id del usuario actual
      const psychResult = await client.query(
        `SELECT id FROM psychologists WHERE user_id = $1`,
        [userId]
      )
      const psychologistId = psychResult.rows.length > 0 ? psychResult.rows[0].id : null

      // Crear la evaluación
      const evalResult = await client.query(
        `INSERT INTO evaluations (id, student_id, test_id, version_id, psychologist_id, created_by_id, status, started_at, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'in_progress', NOW(), NOW(), NOW())
         RETURNING id, status, started_at`,
        [studentId, testId, versionResult.rows[0].id, psychologistId, userId]
      )

      // Registrar en audit log
      await client.query(
        `INSERT INTO audit_logs (id, user_id, action, module, record_id, table_name, new_value, created_at)
         VALUES (gen_random_uuid()::text, $1, 'CREATE_EVALUATION', 'evaluations', $2, 'evaluations', $3, NOW())`,
        [userId, evalResult.rows[0].id, JSON.stringify({ studentId, testId, testName: test.name })]
      )

      return NextResponse.json({
        evaluation: {
          id: evalResult.rows[0].id,
          status: evalResult.rows[0].status,
          startedAt: evalResult.rows[0].started_at,
          student: { id: student.id, firstName: student.first_name, lastName: student.last_name },
          test: { id: test.id, code: test.code, name: test.name }
        }
      }, { status: 201 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error creating evaluation:", error)
    return NextResponse.json({ error: "Error al crear evaluación" }, { status: 500 })
  }
}