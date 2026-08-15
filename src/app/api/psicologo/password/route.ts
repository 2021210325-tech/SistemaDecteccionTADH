import { NextResponse } from "next/server"
import { Pool } from "pg"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

const JWT_SECRET = process.env.JWT_SECRET || "tdah-system-secret-key-2026"

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Contraseña actual y nueva contraseña son requeridas" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      const userResult = await client.query(
        "SELECT id, password_hash FROM users WHERE id = $1",
        [decoded.userId]
      )
      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }

      const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash)
      if (!validPassword) {
        return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 })
      }

      const newHash = await bcrypt.hash(newPassword, 12)
      await client.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        [newHash, decoded.userId]
      )

      return NextResponse.json({ message: "Contraseña actualizada correctamente" })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Error al cambiar contraseña" }, { status: 500 })
  }
}