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

// POST: Guardar respuesta
export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await request.json()
    const { evaluationId, questionId, optionId, textAnswer, numericAnswer, booleanValue, examples, observation } = body

    if (!evaluationId || !questionId) {
      return NextResponse.json({ error: "evaluationId y questionId son requeridos" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      // Verificar que la evaluación esté en estado válido
      const evalResult = await client.query(
        "SELECT id, status FROM evaluations WHERE id = $1",
        [evaluationId]
      )
      if (evalResult.rows.length === 0) {
        return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
      }
      if (evalResult.rows[0].status === "approved" || evalResult.rows[0].status === "cancelled") {
        return NextResponse.json({ error: "No se puede modificar una evaluación aprobada o cancelada" }, { status: 400 })
      }

      // Upsert de la respuesta - check first, then insert or update
      const existingAnswer = await client.query(
        "SELECT id FROM evaluation_answers WHERE evaluation_id = $1 AND question_id = $2",
        [evaluationId, questionId]
      )
      let answerId: string
      if (existingAnswer.rows.length > 0) {
        answerId = existingAnswer.rows[0].id
        await client.query(
          `UPDATE evaluation_answers SET option_id = $2, text_answer = $3, numeric_answer = $4, boolean_value = $5, updated_at = NOW() WHERE id = $1`,
          [answerId, optionId || null, textAnswer || null, numericAnswer || null, booleanValue || null]
        )
      } else {
        const answerResult = await client.query(
          `INSERT INTO evaluation_answers (id, evaluation_id, question_id, option_id, text_answer, numeric_answer, boolean_value, created_by_id, created_at, updated_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING id`,
          [evaluationId, questionId, optionId || null, textAnswer || null, numericAnswer || null, booleanValue || null, userId]
        )
        answerId = answerResult.rows[0].id
      }

      // Guardar ejemplos reconocidos si existen
      if (examples && Array.isArray(examples)) {
        await client.query("DELETE FROM evaluation_answer_examples WHERE answer_id = $1", [answerId])
        for (const ex of examples) {
          if (ex.selected) {
            await client.query(
              `INSERT INTO evaluation_answer_examples (id, evaluation_id, answer_id, example_id, selected, observation, created_at)
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
              [evaluationId, answerId, ex.exampleId, ex.selected, ex.observation || null]
            )
          }
        }
      }

      // Guardar observación si existe
      if (observation !== undefined && observation !== null && observation !== "") {
        const existingObs = await client.query(
          "SELECT id FROM evaluation_observations WHERE evaluation_id = $1 AND question_id = $2",
          [evaluationId, questionId]
        )
        if (existingObs.rows.length > 0) {
          await client.query(
            "UPDATE evaluation_observations SET observation = $3, updated_at = NOW() WHERE id = $1",
            [existingObs.rows[0].id, questionId, observation]
          )
        } else {
          await client.query(
            `INSERT INTO evaluation_observations (id, evaluation_id, question_id, context, observation, created_by_id, created_at, updated_at)
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW())`,
            [evaluationId, questionId, null, observation, userId]
          )
        }
      }

      // Registrar en audit log
      await client.query(
        `INSERT INTO audit_logs (id, user_id, action, module, record_id, table_name, new_value, created_at)
         VALUES (gen_random_uuid()::text, $1, 'SAVE_ANSWER', 'evaluations', $2, 'evaluation_answers', $3, NOW())`,
        [userId, evaluationId, JSON.stringify({ questionId, optionId, textAnswer })]
      )

      return NextResponse.json({ answerId, success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error saving answer:", error)
    return NextResponse.json({ error: "Error al guardar respuesta" }, { status: 500 })
  }
}

// PUT: Calcular progreso y resultados
export async function PUT(request: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await request.json()
    const { evaluationId, action } = body

    if (!evaluationId) return NextResponse.json({ error: "evaluationId es requerido" }, { status: 400 })

    const client = await pool.connect()
    try {
      const evalResult = await client.query(
        `SELECT e.*, t.code as test_code
         FROM evaluations e
         JOIN tests t ON e.test_id = t.id
         WHERE e.id = $1`,
        [evaluationId]
      )
      if (evalResult.rows.length === 0) {
        return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
      }

      const evaluation = evalResult.rows[0]

      if (action === "progress") {
        // Calcular progreso
        const totalQuestions = await client.query(
          `SELECT COUNT(DISTINCT tq.id) as total
           FROM test_questions tq
           JOIN test_criteria tc ON tq.criterion_id = tc.id
           JOIN test_domains td ON tc.domain_id = td.id
           JOIN test_parts tp ON td.part_id = tp.id
           JOIN test_versions tv ON tp.version_id = tv.id
           WHERE tv.test_id = $1 AND tv.is_current = true`,
          [evaluation.test_id]
        )

        const answeredQuestions = await client.query(
          `SELECT COUNT(DISTINCT ea.question_id) as answered
           FROM evaluation_answers ea
           WHERE ea.evaluation_id = $1`,
          [evaluationId]
        )

        const total = parseInt(totalQuestions.rows[0].total)
        const answered = parseInt(answeredQuestions.rows[0].answered)
        const progress = total > 0 ? Math.round((answered / total) * 100) : 0

        return NextResponse.json({ total, answered, progress })
      }

      if (action === "calculate") {
        // Calcular resultados para DIVA-5
        const inattentionCurrent = await client.query(
          `SELECT COUNT(DISTINCT ea.question_id) as count
           FROM evaluation_answers ea
           JOIN test_questions tq ON ea.question_id = tq.id
           JOIN test_criteria tc ON tq.criterion_id = tc.id
           JOIN test_domains td ON tc.domain_id = td.id
           JOIN test_parts tp ON td.part_id = tp.id
           JOIN test_versions tv ON tp.version_id = tv.id
           WHERE tv.test_id = $1 AND tv.is_current = true
             AND tq.context = 'CURRENT' AND td.code = 'INATTENTION'
             AND ea.evaluation_id = $2
             AND ea.option_id IN (SELECT id FROM test_options WHERE score > 0)`,
          [evaluation.test_id, evaluationId]
        )

        const inattentionChildhood = await client.query(
          `SELECT COUNT(DISTINCT ea.question_id) as count
           FROM evaluation_answers ea
           JOIN test_questions tq ON ea.question_id = tq.id
           JOIN test_criteria tc ON tq.criterion_id = tc.id
           JOIN test_domains td ON tc.domain_id = td.id
           JOIN test_parts tp ON td.part_id = tp.id
           JOIN test_versions tv ON tp.version_id = tv.id
           WHERE tv.test_id = $1 AND tv.is_current = true
             AND tq.context = 'CHILDHOOD' AND td.code = 'INATTENTION'
             AND ea.evaluation_id = $2
             AND ea.option_id IN (SELECT id FROM test_options WHERE score > 0)`,
          [evaluation.test_id, evaluationId]
        )

        const hyperactivityCurrent = await client.query(
          `SELECT COUNT(DISTINCT ea.question_id) as count
           FROM evaluation_answers ea
           JOIN test_questions tq ON ea.question_id = tq.id
           JOIN test_criteria tc ON tq.criterion_id = tc.id
           JOIN test_domains td ON tc.domain_id = td.id
           JOIN test_parts tp ON td.part_id = tp.id
           JOIN test_versions tv ON tp.version_id = tv.id
           WHERE tv.test_id = $1 AND tv.is_current = true
             AND tq.context = 'CURRENT' AND td.code = 'HYPERACTIVITY_IMPULSIVITY'
             AND ea.evaluation_id = $2
             AND ea.option_id IN (SELECT id FROM test_options WHERE score > 0)`,
          [evaluation.test_id, evaluationId]
        )

        const hyperactivityChildhood = await client.query(
          `SELECT COUNT(DISTINCT ea.question_id) as count
           FROM evaluation_answers ea
           JOIN test_questions tq ON ea.question_id = tq.id
           JOIN test_criteria tc ON tq.criterion_id = tc.id
           JOIN test_domains td ON tc.domain_id = td.id
           JOIN test_parts tp ON td.part_id = tp.id
           JOIN test_versions tv ON tp.version_id = tv.id
           WHERE tv.test_id = $1 AND tv.is_current = true
             AND tq.context = 'CHILDHOOD' AND td.code = 'HYPERACTIVITY_IMPULSIVITY'
             AND ea.evaluation_id = $2
             AND ea.option_id IN (SELECT id FROM test_options WHERE score > 0)`,
          [evaluation.test_id, evaluationId]
        )

        const inattCurrent = parseInt(inattentionCurrent.rows[0].count)
        const inattChild = parseInt(inattentionChildhood.rows[0].count)
        const hyperCurrent = parseInt(hyperactivityCurrent.rows[0].count)
        const hyperChild = parseInt(hyperactivityChildhood.rows[0].count)

        // Reglas DIVA-5: ≥6 en actual para déficit, ≥6 para hiperactividad
        const overallResult =
          (inattCurrent >= 6 && hyperCurrent >= 6) ? "TDAH combinado" :
          (inattCurrent >= 6) ? "TDAH predominantemente desatento" :
          (hyperCurrent >= 6) ? "TDAH predominantemente hiperactivo-impulsivo" :
          "No cumple criterios"

        // Upsert resultados - check first, then insert or update
        const existingResult = await client.query(
          "SELECT id FROM evaluation_results WHERE evaluation_id = $1",
          [evaluationId]
        )
        if (existingResult.rows.length > 0) {
          await client.query(
            `UPDATE evaluation_results SET inattention_childhood = $2, inattention_current = $3, hyperactivity_childhood = $4, hyperactivity_current = $5, overall_result = $6 WHERE evaluation_id = $1`,
            [evaluationId, inattChild, inattCurrent, hyperChild, hyperCurrent, overallResult]
          )
        } else {
          await client.query(
            `INSERT INTO evaluation_results (id, evaluation_id, inattention_childhood, inattention_current, hyperactivity_childhood, hyperactivity_current, overall_result, created_at)
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW())`,
            [evaluationId, inattChild, inattCurrent, hyperChild, hyperCurrent, overallResult]
          )
        }

        const hasSymptoms = overallResult !== "No cumple criterios"
        await client.query(
          "UPDATE evaluations SET has_symptoms = $2, updated_at = NOW() WHERE id = $1",
          [evaluationId, hasSymptoms]
        )

        return NextResponse.json({
          inattention: { current: inattCurrent, childhood: inattChild },
          hyperactivity: { current: hyperCurrent, childhood: hyperChild },
          overallResult,
          hasSymptoms
        })
      }

      if (action === "complete") {
        // Marcar como completada
        await client.query(
          `UPDATE evaluations SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [evaluationId]
        )
        return NextResponse.json({ success: true })
      }

      return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error in evaluation engine:", error)
    return NextResponse.json({ error: "Error en motor de evaluación" }, { status: 500 })
  }
}