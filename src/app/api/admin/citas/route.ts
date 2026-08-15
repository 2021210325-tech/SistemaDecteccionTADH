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
         WHERE a.appointment_date >= CURRENT_DATE
         ORDER BY a.appointment_date ASC, a.start_time ASC
         LIMIT 10`
      )
      return NextResponse.json({ appointments: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json({ error: "Error al obtener citas" }, { status: 500 })
  }
}