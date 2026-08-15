import { NextResponse } from "next/server"
import { Pool } from "pg"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

const JWT_SECRET = process.env.JWT_SECRET || "tdah-system-secret-key-2026"

async function getUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null
  try { return (jwt.verify(token, JWT_SECRET) as { userId: string }).userId } catch { return null }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await request.json()
    const { evaluationId, symptomOnset, dysfunction, criteriaB, criteriaC, criteriaD, criteriaE, collateralInfo, professionalConclusion, recommendations } = body

    if (!evaluationId) return NextResponse.json({ error: "evaluationId requerido" }, { status: 400 })

    const client = await pool.connect()
    try {
      // Guardar información colateral
      if (collateralInfo && Array.isArray(collateralInfo)) {
        await client.query("DELETE FROM collateral_information WHERE evaluation_id = $1", [evaluationId])
        for (const entry of collateralInfo) {
          if (entry.sourceId && entry.content) {
            await client.query(
              `INSERT INTO collateral_information (id, evaluation_id, source_id, source_name, relationship, information_date, content, observations, created_at, updated_at)
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
              [evaluationId, entry.sourceId, entry.sourceName || null, entry.relationship || null, entry.informationDate || null, entry.content, entry.observations || null]
            )
          }
        }
      }

      // Guardar en evaluation_results (campos adicionales)
      if (symptomOnset || dysfunction || criteriaB) {
        await client.query(
          `INSERT INTO evaluation_results (id, evaluation_id, dysfunction_childhood, dysfunction_current, criteria_b, criteria_c, criteria_d, criteria_e, created_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (evaluation_id) DO UPDATE SET
             dysfunction_childhood = COALESCE($2, dysfunction_childhood),
             dysfunction_current = COALESCE($3, dysfunction_current),
             criteria_b = COALESCE($4, criteria_b),
             criteria_c = COALESCE($5, criteria_c),
             criteria_d = COALESCE($6, criteria_d),
             criteria_e = COALESCE($7, criteria_e)`,
          [evaluationId,
            dysfunction?.childhood ? JSON.stringify(dysfunction.childhood) : null,
            dysfunction?.current ? JSON.stringify(dysfunction.current) : null,
            criteriaB?.present ?? null, criteriaC?.present ?? null,
            criteriaD?.present ?? null, criteriaE?.present ?? null]
        )
      }

      // Guardar conclusión y recomendaciones
      if (professionalConclusion || recommendations) {
        await client.query(
          `UPDATE evaluations SET professional_conclusion = COALESCE($1, professional_conclusion),
           recommendations = COALESCE($2, recommendations), updated_at = NOW()
           WHERE id = $3`,
          [professionalConclusion || null, recommendations || null, evaluationId]
        )
      }

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (id, user_id, action, module, record_id, table_name, new_value, created_at)
         VALUES (gen_random_uuid()::text, $1, 'SAVE_PART3', 'evaluations', $2, 'evaluations', $3, NOW())`,
        [userId, evaluationId, JSON.stringify({ hasCollateral: collateralInfo?.length > 0 })]
      )

      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error saving Part 3:", error)
    return NextResponse.json({ error: "Error al guardar Parte 3" }, { status: 500 })
  }
}