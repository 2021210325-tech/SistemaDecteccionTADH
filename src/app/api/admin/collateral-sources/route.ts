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
      const result = await client.query("SELECT id, code, name, description FROM collateral_sources ORDER BY code")
      return NextResponse.json({ sources: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching collateral sources:", error)
    return NextResponse.json({ error: "Error al obtener fuentes" }, { status: 500 })
  }
}