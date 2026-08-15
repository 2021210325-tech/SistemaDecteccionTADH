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
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch { return null }
}

// GET: Obtener estructura completa de un instrumento
export async function GET(request: Request) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const testId = searchParams.get("testId")
    const versionId = searchParams.get("versionId")

    if (!testId) return NextResponse.json({ error: "testId es requerido" }, { status: 400 })

    const client = await pool.connect()
    try {
      let query: string
      let params: unknown[]

      if (versionId) {
        query = `SELECT tv.id as version_id, tv.version, tv.description as version_description,
                        tp.id as part_id, tp.code as part_code, tp.name as part_name, tp.description as part_description, tp."order" as part_order,
                        td.id as domain_id, td.code as domain_code, td.name as domain_name, td.description as domain_description,
                        tc.id as criterion_id, tc.code as criterion_code, tc."number" as criterion_number,
                        tc.name as criterion_name, tc.official_text, tc.description as criterion_description,
                        tq.id as question_id, tq.code as question_code, tq.context, tq.text as question_text,
                        tq.question_type, tq.required, tq.allows_examples, tq.allows_observation, tq."order" as question_order,
                        to2.id as option_id, to2.code as option_code, to2.text as option_text, to2.value as option_value, to2.score as option_score, to2."order" as option_order,
                        tex.id as example_id, tex.text as example_text, tex.value as example_value, tex.score as example_score, tex."order" as example_order
                 FROM test_versions tv
                 JOIN test_parts tp ON tv.id = tp.version_id
                 JOIN test_domains td ON tp.id = td.part_id
                 JOIN test_criteria tc ON td.id = tc.domain_id
                 JOIN test_questions tq ON tc.id = tq.criterion_id
                 LEFT JOIN test_options to2 ON tq.id = to2.question_id
                 LEFT JOIN test_examples tex ON tq.id = tex.question_id
                 WHERE tv.test_id = $1 AND tv.id = $2
                 ORDER BY tp."order", td."order", tc."order", tq."order", to2."order", tex."order"`
        params = [testId, versionId]
      } else {
        query = `SELECT tv.id as version_id, tv.version, tv.description as version_description,
                        tp.id as part_id, tp.code as part_code, tp.name as part_name, tp.description as part_description, tp."order" as part_order,
                        td.id as domain_id, td.code as domain_code, td.name as domain_name, td.description as domain_description,
                        tc.id as criterion_id, tc.code as criterion_code, tc."number" as criterion_number,
                        tc.name as criterion_name, tc.official_text, tc.description as criterion_description,
                        tq.id as question_id, tq.code as question_code, tq.context, tq.text as question_text,
                        tq.question_type, tq.required, tq.allows_examples, tq.allows_observation, tq."order" as question_order,
                        to2.id as option_id, to2.code as option_code, to2.text as option_text, to2.value as option_value, to2.score as option_score, to2."order" as option_order,
                        tex.id as example_id, tex.text as example_text, tex.value as example_value, tex.score as example_score, tex."order" as example_order
                 FROM test_versions tv
                 JOIN test_parts tp ON tv.id = tp.version_id
                 JOIN test_domains td ON tp.id = td.part_id
                 JOIN test_criteria tc ON td.id = tc.domain_id
                 JOIN test_questions tq ON tc.id = tq.criterion_id
                 LEFT JOIN test_options to2 ON tq.id = to2.question_id
                 LEFT JOIN test_examples tex ON tq.id = tex.question_id
                 WHERE tv.test_id = $1 AND tv.is_current = true
                 ORDER BY tp."order", td."order", tc."order", tq."order", to2."order", tex."order"`
        params = [testId]
      }

      const result = await client.query(query, params)

      // Estructurar los datos en árbol
      const versionMap = new Map<string, Record<string, unknown>>()
      const partMap = new Map<string, Record<string, unknown>>()
      const domainMap = new Map<string, Record<string, unknown>>()
      const criterionMap = new Map<string, Record<string, unknown>>()
      const questionMap = new Map<string, Record<string, unknown>>()

      for (const row of result.rows) {
        if (!versionMap.has(row.version_id)) {
          versionMap.set(row.version_id, {
            id: row.version_id, version: row.version, description: row.version_description, parts: []
          })
        }
        const version = versionMap.get(row.version_id)!

        if (!partMap.has(row.part_id)) {
          const part = { id: row.part_id, code: row.part_code, name: row.part_name, description: row.part_description, order: row.part_order, domains: [] }
          ;(version.parts as Record<string, unknown>[]).push(part)
          partMap.set(row.part_id, part)
        }
        const part = partMap.get(row.part_id)!

        if (!domainMap.has(row.domain_id)) {
          const domain = { id: row.domain_id, code: row.domain_code, name: row.domain_name, description: row.domain_description, criteria: [] }
          ;(part.domains as Record<string, unknown>[]).push(domain)
          domainMap.set(row.domain_id, domain)
        }
        const domain = domainMap.get(row.domain_id)!

        if (!criterionMap.has(row.criterion_id)) {
          const criterion = {
            id: row.criterion_id, code: row.criterion_code, number: row.criterion_number,
            name: row.criterion_name, officialText: row.official_text, description: row.criterion_description, questions: []
          }
          ;(domain.criteria as Record<string, unknown>[]).push(criterion)
          criterionMap.set(row.criterion_id, criterion)
        }
        const criterion = criterionMap.get(row.criterion_id)!

        if (!questionMap.has(row.question_id)) {
          const question: Record<string, unknown> = {
            id: row.question_id, code: row.question_code, context: row.context,
            text: row.question_text, questionType: row.question_type, required: row.required,
            allowsExamples: row.allows_examples, allowsObservation: row.allows_observation,
            order: row.question_order, options: [], examples: []
          }
          ;(criterion.questions as Record<string, unknown>[]).push(question)
          questionMap.set(row.question_id, question)
        }
        const question = questionMap.get(row.question_id)!

        if (row.option_id && !(question.options as Record<string, unknown>[]).some((o: Record<string, unknown>) => o.id === row.option_id)) {
          ;(question.options as Record<string, unknown>[]).push({
            id: row.option_id, code: row.option_code, text: row.option_text,
            value: row.option_value, score: row.option_score, order: row.option_order
          })
        }

        if (row.example_id && !(question.examples as Record<string, unknown>[]).some((e: Record<string, unknown>) => e.id === row.example_id)) {
          ;(question.examples as Record<string, unknown>[]).push({
            id: row.example_id, text: row.example_text, value: row.example_value,
            score: row.example_score, order: row.example_order
          })
        }
      }

      return NextResponse.json({ structure: Array.from(versionMap.values()) })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching evaluation structure:", error)
    return NextResponse.json({ error: "Error al obtener estructura" }, { status: 500 })
  }
}