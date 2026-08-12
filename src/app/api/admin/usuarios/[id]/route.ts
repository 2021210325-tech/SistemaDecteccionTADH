import { NextResponse } from "next/server"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT u.id, u.email, u.is_active, u.created_at, u.last_login_at,
                p.first_name, p.last_name, p.phone, p.specialization, p.license_number, p.institution_id,
                a.first_name as admin_first_name, a.last_name as admin_last_name, a.phone as admin_phone,
                (SELECT json_agg(json_build_object('name', r.name))
                 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
                 WHERE ur.user_id = u.id) as roles
         FROM users u
         LEFT JOIN psychologists p ON u.id = p.user_id
         LEFT JOIN administrators a ON u.id = a.user_id
         WHERE u.id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }

      const user = result.rows[0]
      return NextResponse.json({
        ...user,
        first_name: user.first_name || user.admin_first_name,
        last_name: user.last_name || user.admin_last_name,
        phone: user.phone || user.admin_phone,
        roles: user.roles?.map((r: { name: string }) => r.name) || [],
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { email, password, firstName, lastName, role, phone, specialization, licenseNumber, institutionId, isActive } = body

    const client = await pool.connect()
    try {
      const existing = await client.query("SELECT id FROM users WHERE id = $1", [id])
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }

      if (email) {
        const emailCheck = await client.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, id])
        if (emailCheck.rows.length > 0) {
          return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
        }
      }

      let updateQuery = "UPDATE users SET updated_at = NOW()"
      const updateParams: unknown[] = []
      let paramIdx = 1

      if (email) {
        updateQuery += `, email = $${paramIdx}`
        updateParams.push(email)
        paramIdx++
      }
      if (password) {
        const hash = await bcrypt.hash(password, 12)
        updateQuery += `, password_hash = $${paramIdx}`
        updateParams.push(hash)
        paramIdx++
      }
      if (typeof isActive === "boolean") {
        updateQuery += `, is_active = $${paramIdx}`
        updateParams.push(isActive)
        paramIdx++
      }

      updateQuery += ` WHERE id = $${paramIdx}`
      updateParams.push(id)
      await client.query(updateQuery, updateParams)

      const userRole = await client.query(
        `SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1`,
        [id]
      )
      const currentRole = userRole.rows[0]?.name

      if (currentRole === "PSICOLOGO") {
        await client.query(
          `UPDATE psychologists SET first_name = $1, last_name = $2, phone = $3, specialization = $4, license_number = $5, institution_id = $6, updated_at = NOW()
           WHERE user_id = $7`,
          [firstName, lastName, phone || null, specialization || null, licenseNumber || null, institutionId || null, id]
        )
      } else if (currentRole?.startsWith("ADMIN_")) {
        await client.query(
          `UPDATE administrators SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW()
           WHERE user_id = $4`,
          [firstName, lastName, phone || null, id]
        )
      }

      if (role && role !== currentRole) {
        await client.query("DELETE FROM user_roles WHERE user_id = $1", [id])
        const roleResult = await client.query("SELECT id FROM roles WHERE name = $1", [role])
        if (roleResult.rows.length > 0) {
          await client.query(
            `INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
            [id, roleResult.rows[0].id]
          )
        }

        if (role === "PSICOLOGO" && currentRole !== "PSICOLOGO") {
          const existingPsy = await client.query("SELECT id FROM psychologists WHERE user_id = $1", [id])
          if (existingPsy.rows.length === 0) {
            await client.query(
              `INSERT INTO psychologists (id, user_id, first_name, last_name, phone, is_active, created_at, updated_at)
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW(), NOW())`,
              [id, firstName, lastName, phone || null]
            )
          }
        } else if (role.startsWith("ADMIN_") && !currentRole?.startsWith("ADMIN_")) {
          const existingAdmin = await client.query("SELECT id FROM administrators WHERE user_id = $1", [id])
          if (existingAdmin.rows.length === 0) {
            await client.query(
              `INSERT INTO administrators (id, user_id, first_name, last_name, phone, created_at, updated_at)
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW())`,
              [id, firstName, lastName, phone || null]
            )
          }
        }
      }

      const updatedUser = await client.query(
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
        [id]
      )

      return NextResponse.json(updatedUser.rows[0])
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await pool.connect()
    try {
      const existing = await client.query("SELECT id FROM users WHERE id = $1", [id])
      if (existing.rows.length === 0) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }

      await client.query("DELETE FROM user_roles WHERE user_id = $1", [id])
      await client.query("DELETE FROM psychologists WHERE user_id = $1", [id])
      await client.query("DELETE FROM administrators WHERE user_id = $1", [id])
      await client.query("DELETE FROM entity_users WHERE user_id = $1", [id])
      await client.query("DELETE FROM users WHERE id = $1", [id])

      return NextResponse.json({ message: "Usuario eliminado" })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}