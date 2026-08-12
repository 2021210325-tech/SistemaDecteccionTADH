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
      const result = await client.query("SELECT id, name FROM educational_levels ORDER BY name")
      return NextResponse.json({ levels: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching levels:", error)
    return NextResponse.json({ error: "Error al obtener niveles" }, { status: 500 })
  }
}