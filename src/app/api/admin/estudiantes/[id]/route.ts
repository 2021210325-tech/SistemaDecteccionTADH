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
        `SELECT s.*, ei.name as institution_name, el.name as level_name, g.name as grade_name
         FROM students s
         LEFT JOIN educational_institutions ei ON s.institution_id = ei.id
         LEFT JOIN educational_levels el ON s.current_level_id = el.id
         LEFT JOIN grades g ON s.current_grade_id = g.id
         WHERE s.id = $1`,
        [id]
      )
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
      }
      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json({ error: "Error al obtener estudiante" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      firstName, lastName, documentType, documentNumber, dateOfBirth,
      gender, institutionId, currentLevelId, currentGradeId, currentSection,
      schoolYear, guardianName, guardianPhone, guardianEmail, status, notes,
    } = body

    const client = await pool.connect()
    try {
      const existing = await client.query("SELECT id FROM students WHERE id = $1", [id])
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
      }

      let age = null
      if (dateOfBirth) {
        const birth = new Date(dateOfBirth)
        const today = new Date()
        age = today.getFullYear() - birth.getFullYear()
        if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
      }

      const result = await client.query(
        `UPDATE students SET first_name = $1, last_name = $2, document_type = $3, document_number = $4,
          date_of_birth = $5, age = $6, gender = $7, institution_id = $8, current_level_id = $9,
          current_grade_id = $10, current_section = $11, school_year = $12, guardian_name = $13,
          guardian_phone = $14, guardian_email = $15, status = $16, notes = $17, updated_at = NOW()
         WHERE id = $18
         RETURNING *`,
        [
          firstName, lastName, documentType || null, documentNumber || null,
          dateOfBirth || null, age, gender || null, institutionId,
          currentLevelId || null, currentGradeId || null, currentSection || null,
          schoolYear || null, guardianName || null, guardianPhone || null,
          guardianEmail || null, status || "active", notes || null, id,
        ]
      )

      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "Error al actualizar estudiante" }, { status: 500 })
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
      const existing = await client.query("SELECT id FROM students WHERE id = $1", [id])
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
      }

      await client.query("DELETE FROM evaluations WHERE student_id = $1", [id])
      await client.query("DELETE FROM student_enrollments WHERE student_id = $1", [id])
      await client.query("DELETE FROM student_guardians WHERE student_id = $1", [id])
      await client.query("DELETE FROM consents WHERE student_id = $1", [id])
      await client.query("DELETE FROM psychological_records WHERE student_id = $1", [id])
      await client.query("DELETE FROM psychological_reports WHERE student_id = $1", [id])
      await client.query("DELETE FROM follow_ups WHERE student_id = $1", [id])
      await client.query("DELETE FROM appointments WHERE student_id = $1", [id])
      await client.query("DELETE FROM students WHERE id = $1", [id])

      return NextResponse.json({ message: "Estudiante eliminado" })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Error al eliminar estudiante" }, { status: 500 })
  }
}