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
        "SELECT id, name, modular_code FROM educational_institutions WHERE is_active = true ORDER BY name"
      )
      return NextResponse.json({ institutions: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching institutions:", error)
    return NextResponse.json({ error: "Error al obtener instituciones" }, { status: 500 })
  }
}