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
      const result = await client.query("SELECT id, name, level_id FROM grades ORDER BY name")
      return NextResponse.json({ grades: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching grades:", error)
    return NextResponse.json({ error: "Error al obtener grados" }, { status: 500 })
  }
}