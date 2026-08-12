import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT e.*, s.first_name || ' ' || s.last_name as student_name,
                s.code as student_code, ei.name as institution_name,
                t.name as test_name, t.code as test_code,
                p.first_name || ' ' || p.last_name as psychologist_name
         FROM evaluations e
         JOIN students s ON e.student_id = s.id
         JOIN educational_institutions ei ON s.institution_id = ei.id
         JOIN tests t ON e.test_id = t.id
         LEFT JOIN psychologists p ON e.psychologist_id = p.id
         WHERE e.id = $1`,
        [id]
      )
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
      }
      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching evaluation:", error)
    return NextResponse.json({ error: "Error al obtener evaluación" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, observations, recommendations, totalScore, maxScore, percentage, hasSymptoms } = body

    const client = await pool.connect()
    try {
      const existing = await client.query("SELECT id FROM evaluations WHERE id = $1", [id])
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
      }

      let updateQuery = `UPDATE evaluations SET updated_at = NOW()`
      const updateParams: unknown[] = []
      let paramIdx = 1

      if (status) {
        updateQuery += `, status = $${paramIdx}`
        updateParams.push(status)
        paramIdx++
        if (status === "completed") {
          updateQuery += `, completed_at = NOW()`
        }
      }
      if (observations !== undefined) {
        updateQuery += `, observations = $${paramIdx}`
        updateParams.push(observations)
        paramIdx++
      }
      if (recommendations !== undefined) {
        updateQuery += `, recommendations = $${paramIdx}`
        updateParams.push(recommendations)
        paramIdx++
      }
      if (totalScore !== undefined) {
        updateQuery += `, "totalScore" = $${paramIdx}`
        updateParams.push(totalScore)
        paramIdx++
      }
      if (maxScore !== undefined) {
        updateQuery += `, "maxScore" = $${paramIdx}`
        updateParams.push(maxScore)
        paramIdx++
      }
      if (percentage !== undefined) {
        updateQuery += `, percentage = $${paramIdx}`
        updateParams.push(percentage)
        paramIdx++
      }

      updateQuery += ` WHERE id = $${paramIdx}`
      updateParams.push(id)
      await client.query(updateQuery, updateParams)

      const result = await client.query(
        `SELECT e.*, s.first_name || ' ' || s.last_name as student_name,
                t.name as test_name, p.first_name || ' ' || p.last_name as psychologist_name
         FROM evaluations e
         JOIN students s ON e.student_id = s.id
         JOIN tests t ON e.test_id = t.id
         LEFT JOIN psychologists p ON e.psychologist_id = p.id
         WHERE e.id = $1`,
        [id]
      )
      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating evaluation:", error)
    return NextResponse.json({ error: "Error al actualizar evaluación" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await pool.connect()
    try {
      const existing = await client.query("SELECT id FROM evaluations WHERE id = $1", [id])
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 })
      }

      await client.query("DELETE FROM evaluation_answers WHERE evaluation_id = $1", [id])
      await client.query("DELETE FROM evaluation_results WHERE evaluation_id = $1", [id])
      await client.query("DELETE FROM evaluations WHERE id = $1", [id])

      return NextResponse.json({ message: "Evaluación eliminada" })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error deleting evaluation:", error)
    return NextResponse.json({ error: "Error al eliminar evaluación" }, { status: 500 })
  }
}