import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const institutionId = searchParams.get("institutionId") || ""
    const status = searchParams.get("status") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    const client = await pool.connect()
    try {
      let whereClause = "WHERE 1=1"
      const params: unknown[] = []
      let paramIdx = 1

      if (search) {
        whereClause += ` AND (s.first_name ILIKE $${paramIdx} OR s.last_name ILIKE $${paramIdx} OR s.code ILIKE $${paramIdx} OR s.document_number ILIKE $${paramIdx})`
        params.push(`%${search}%`)
        paramIdx++
      }
      if (institutionId) {
        whereClause += ` AND s.institution_id = $${paramIdx}`
        params.push(institutionId)
        paramIdx++
      }
      if (status) {
        whereClause += ` AND s.status = $${paramIdx}`
        params.push(status)
        paramIdx++
      }

      const countResult = await client.query(
        `SELECT COUNT(*) FROM students s ${whereClause}`,
        params
      )

      const result = await client.query(
        `SELECT s.id, s.code, s.first_name, s.last_name, s.document_type, s.document_number,
                s.date_of_birth, s.age, s.gender, s.institution_id, s.current_level_id,
                s.current_grade_id, s.current_section, s.school_year, s.guardian_name,
                s.guardian_phone, s.guardian_email, s.status, s.notes, s.created_at,
                ei.name as institution_name, ei.modular_code as institution_code,
                el.name as level_name, g.name as grade_name
         FROM students s
         LEFT JOIN educational_institutions ei ON s.institution_id = ei.id
         LEFT JOIN educational_levels el ON s.current_level_id = el.id
         LEFT JOIN grades g ON s.current_grade_id = g.id
         ${whereClause}
         ORDER BY s.created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      )

      return NextResponse.json({
        students: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Error al obtener estudiantes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      firstName, lastName, documentType, documentNumber, dateOfBirth,
      gender, institutionId, currentLevelId, currentGradeId, currentSection,
      schoolYear, guardianName, guardianPhone, guardianEmail, notes,
    } = body

    if (!firstName || !lastName || !institutionId) {
      return NextResponse.json(
        { error: "Nombre, apellido e institución son requeridos" },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    try {
      const codeResult = await client.query(
        `SELECT COUNT(*) as count FROM students WHERE institution_id = $1`,
        [institutionId]
      )
      const codeNum = parseInt(codeResult.rows[0].count) + 1
      const instResult = await client.query("SELECT modular_code FROM educational_institutions WHERE id = $1", [institutionId])
      const instCode = instResult.rows[0]?.modular_code || "000"
      const code = `EST${instCode}-${String(codeNum).padStart(3, "0")}`

      let age = null
      if (dateOfBirth) {
        const birth = new Date(dateOfBirth)
        const today = new Date()
        age = today.getFullYear() - birth.getFullYear()
        if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
      }

      const result = await client.query(
        `INSERT INTO students (id, code, first_name, last_name, document_type, document_number,
          date_of_birth, age, gender, institution_id, current_level_id, current_grade_id,
          current_section, school_year, guardian_name, guardian_phone, guardian_email,
          status, notes, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'active', $17, NOW(), NOW())
         RETURNING *`,
        [
          code, firstName, lastName, documentType || null, documentNumber || null,
          dateOfBirth || null, age, gender || null, institutionId,
          currentLevelId || null, currentGradeId || null, currentSection || null,
          schoolYear || null, guardianName || null, guardianPhone || null,
          guardianEmail || null, notes || null,
        ]
      )

      return NextResponse.json(result.rows[0], { status: 201 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ error: "Error al crear estudiante" }, { status: 500 })
  }
}