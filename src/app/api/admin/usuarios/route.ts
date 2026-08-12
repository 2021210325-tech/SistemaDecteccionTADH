import { NextResponse } from "next/server"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    const client = await pool.connect()
    try {
      let whereClause = "WHERE 1=1"
      const params: unknown[] = []
      let paramIdx = 1

      if (search) {
        whereClause += ` AND (u.email ILIKE $${paramIdx} OR COALESCE(p.first_name, a.first_name) ILIKE $${paramIdx} OR COALESCE(p.last_name, a.last_name) ILIKE $${paramIdx})`
        params.push(`%${search}%`)
        paramIdx++
      }

      if (role) {
        whereClause += ` AND EXISTS (SELECT 1 FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.id WHERE ur2.user_id = u.id AND r2.name = $${paramIdx})`
        params.push(role)
        paramIdx++
      }

      const countResult = await client.query(
        `SELECT COUNT(*) FROM users u
         LEFT JOIN psychologists p ON u.id = p.user_id
         LEFT JOIN administrators a ON u.id = a.user_id
         ${whereClause}`,
        params
      )

      const result = await client.query(
        `SELECT u.id, u.email, u.is_active, u.created_at, u.last_login_at,
                COALESCE(p.first_name, a.first_name) as first_name,
                COALESCE(p.last_name, a.last_name) as last_name,
                p.phone as phone, p.specialization, p.license_number, p.institution_id,
                a.phone as admin_phone,
                (SELECT json_agg(json_build_object('name', r.name))
                 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
                 WHERE ur.user_id = u.id) as roles
         FROM users u
         LEFT JOIN psychologists p ON u.id = p.user_id
         LEFT JOIN administrators a ON u.id = a.user_id
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      )

      return NextResponse.json({
        users: result.rows.map((row) => ({
          ...row,
          roles: row.roles?.map((r: { name: string }) => r.name) || [],
        })),
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, role, phone, specialization, licenseNumber, institutionId } = body

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Email, contraseña, nombre, apellido y rol son requeridos" },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    try {
      const existing = await client.query("SELECT id FROM users WHERE email = $1", [email])
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
      }

      const passwordHash = await bcrypt.hash(password, 12)

      const userResult = await client.query(
        `INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, true, NOW(), NOW())
         RETURNING id, email, is_active, created_at`,
        [email, passwordHash]
      )

      const userId = userResult.rows[0].id

      if (role === "PSICOLOGO") {
        await client.query(
          `INSERT INTO psychologists (id, user_id, first_name, last_name, phone, specialization, license_number, institution_id, is_active, created_at, updated_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
          [userId, firstName, lastName, phone || null, specialization || null, licenseNumber || null, institutionId || null]
        )
      } else if (role.startsWith("ADMIN_")) {
        await client.query(
          `INSERT INTO administrators (id, user_id, first_name, last_name, phone, created_at, updated_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW())`,
          [userId, firstName, lastName, phone || null]
        )
      }

      const roleResult = await client.query("SELECT id FROM roles WHERE name = $1", [role])
      if (roleResult.rows.length > 0) {
        await client.query(
          `INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
          [userId, roleResult.rows[0].id]
        )
      }

      const fullUser = await client.query(
        `SELECT u.id, u.email, u.is_active, u.created_at,
                COALESCE(p.first_name, a.first_name) as first_name,
                COALESCE(p.last_name, a.last_name) as last_name,
                (SELECT json_agg(json_build_object('name', r.name))
                 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
                 WHERE ur.user_id = u.id) as roles
         FROM users u
         LEFT JOIN psychologists p ON u.id = p.user_id
         LEFT JOIN administrators a ON u.id = a.user_id
         WHERE u.id = $1`,
        [userId]
      )

      return NextResponse.json(fullUser.rows[0], { status: 201 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}