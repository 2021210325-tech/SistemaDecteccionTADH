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
      const result = await client.query("SELECT id, code, name FROM tests WHERE is_active = true ORDER BY name")
      return NextResponse.json({ tests: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching tests:", error)
    return NextResponse.json({ error: "Error al obtener tests" }, { status: 500 })
  }
}