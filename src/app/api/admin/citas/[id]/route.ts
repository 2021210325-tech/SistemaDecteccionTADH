import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.modality,
                a.reason, a.status, a.notes, a.created_at,
                s.first_name || ' ' || s.last_name as student_name,
                s.code as student_code,
                ei.name as institution_name,
                p.first_name || ' ' || p.last_name as psychologist_name
         FROM appointments a
         JOIN students s ON a.student_id = s.id
         LEFT JOIN educational_institutions ei ON a.institution_id = ei.id
         LEFT JOIN psychologists p ON a.psychologist_id = p.id
         WHERE a.id = $1`,
        [id]
      )
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
      }
      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching appointment:", error)
    return NextResponse.json({ error: "Error al obtener cita" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, notes, reason } = body

    const client = await pool.connect()
    try {
      const fields: string[] = []
      const values: unknown[] = []
      let paramIdx = 1

      if (status) { fields.push(`status = $${paramIdx}`); values.push(status); paramIdx++ }
      if (notes !== undefined) { fields.push(`notes = $${paramIdx}`); values.push(notes); paramIdx++ }
      if (reason !== undefined) { fields.push(`reason = $${paramIdx}`); values.push(reason); paramIdx++ }

      fields.push(`updated_at = NOW()`)
      values.push(id)

      const result = await client.query(
        `UPDATE appointments SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
      }
      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: "Error al actualizar cita" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await pool.connect()
    try {
      const result = await client.query("DELETE FROM appointments WHERE id = $1 RETURNING id", [id])
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
      }
      return NextResponse.json({ message: "Cita eliminada" })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json({ error: "Error al eliminar cita" }, { status: 500 })
  }
}