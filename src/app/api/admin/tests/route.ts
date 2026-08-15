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
        `SELECT t.id, t.code, t.name, t.description, t.population, t.min_age, t.max_age,
                json_agg(json_build_object(
                  'id', tv.id,
                  'version', tv.version,
                  'is_current', tv.is_current,
                  'parts', (
                    SELECT json_agg(json_build_object('id', tp.id, 'code', tp.code, 'name', tp.name) ORDER BY tp."order")
                    FROM test_parts tp WHERE tp.version_id = tv.id
                  )
                ) ORDER BY tv.version) as versions
         FROM tests t
         LEFT JOIN test_versions tv ON t.id = tv.test_id
         WHERE t.is_active = true
         GROUP BY t.id
         ORDER BY t.name`
      )
      return NextResponse.json({ tests: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching tests:", error)
    return NextResponse.json({ error: "Error al obtener tests" }, { status: 500 })
  }
}