import { NextResponse } from "next/server"
import { Pool } from "pg"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

const JWT_SECRET = process.env.JWT_SECRET || "tdah-system-secret-key-2026"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT p.id, p.first_name, p.last_name, p.phone, p.specialization,
                p.document_type, p.document_number, p.license_number, u.email
         FROM psychologists p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id = $1`,
        [decoded.userId]
      )
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
      }
      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const body = await request.json()
    const { firstName, lastName, phone, specialization } = body

    const client = await pool.connect()
    try {
      const result = await client.query(
        `UPDATE psychologists SET first_name = $1, last_name = $2, phone = $3,
                specialization = $4, updated_at = NOW()
         WHERE user_id = $5 RETURNING *`,
        [firstName, lastName, phone || null, specialization || null, decoded.userId]
      )
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
      }
      return NextResponse.json(result.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 })
  }
}