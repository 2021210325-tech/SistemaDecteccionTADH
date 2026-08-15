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

// GET: Obtener evaluación con respuestas
export async function GET(request: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const evaluationId = searchParams.get("id")

    if (!evaluationId) return NextResponse.json({ error: "id es requerido" }, { status: 400 })

    const client = await pool.connect()
    try {
      const evalResult = await client.query(
        `SELECT e.*, t.code as test_code, t.name as test_name,
                s.first_name as student_first_name, s.last_name as student_last_name,
                s.code as student_code, s.date_of_birth,
                ei.name as institution_name,
                p.first_name as psych_first_name, p.last_name as psych_last_name
         FROM evaluations e
         JOIN tests t ON e.test_id = t.id
         JOIN students s ON e.student_id = s.id
         LEFT JOIN educational_institutions ei ON s.institution_id = ei.id
         LEFT JOIN psychologists p ON e.psychologist_id = p.id
         WHERE e.id = $1`,
        [evaluationId]
      )

      if (evalResult.rows.length === 0) {
        return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
      }

      const evaluation = evalResult.rows[0]

      // Obtener respuestas
      const answersResult = await client.query(
        `SELECT ea.id, ea.question_id, ea.option_id, ea.text_answer, ea.numeric_answer, ea.boolean_value,
                to2.code as option_code, to2.text as option_text, to2.score as option_score
         FROM evaluation_answers ea
         LEFT JOIN test_options to2 ON ea.option_id = to2.id
         WHERE ea.evaluation_id = $1`,
        [evaluationId]
      )

      // Obtener ejemplos seleccionados
      const examplesResult = await client.query(
        `SELECT eae.id, eae.answer_id, eae.example_id, eae.selected, eae.observation,
                tex.text as example_text
         FROM evaluation_answer_examples eae
         JOIN test_examples tex ON eae.example_id = tex.id
         WHERE eae.evaluation_id = $1 AND eae.selected = true`,
        [evaluationId]
      )

      // Obtener observaciones
      const observationsResult = await client.query(
        `SELECT id, question_id, context, observation
         FROM evaluation_observations
         WHERE evaluation_id = $1`,
        [evaluationId]
      )

      // Obtener resultados
      const resultsResult = await client.query(
        `SELECT * FROM evaluation_results WHERE evaluation_id = $1`,
        [evaluationId]
      )

      // Obtener información colateral
      const collateralResult = await client.query(
        `SELECT ci.*, cs.name as source_name, cs.code as source_code
         FROM collateral_information ci
         JOIN collateral_sources cs ON ci.source_id = cs.id
         WHERE ci.evaluation_id = $1`,
        [evaluationId]
      )

      return NextResponse.json({
        evaluation: {
          ...evaluation,
          answers: answersResult.rows,
          examples: examplesResult.rows,
          observations: observationsResult.rows,
          results: resultsResult.rows[0] || null,
          collateralInfo: collateralResult.rows
        }
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching evaluation:", error)
    return NextResponse.json({ error: "Error al obtener evaluación" }, { status: 500 })
  }
}