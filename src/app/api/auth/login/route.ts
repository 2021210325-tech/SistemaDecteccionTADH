import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'tdah-system-secret-key-2026'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    let userData: any = null

    try {
      const result = await client.query(
        `SELECT u.id, u.email, u.password_hash, u.is_active,
                COALESCE(p.first_name, a.first_name) as first_name,
                COALESCE(p.last_name, a.last_name) as last_name,
                (SELECT json_agg(json_build_object('name', r.name))
                 FROM user_roles ur JOIN roles r ON ur.role_id = r.id
                 WHERE ur.user_id = u.id) as roles
         FROM users u
         LEFT JOIN psychologists p ON u.id = p.user_id
         LEFT JOIN administrators a ON u.id = a.user_id
         WHERE u.email = $1`,
        [email]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      userData = result.rows[0]

      if (!userData.is_active) {
        return NextResponse.json(
          { error: 'Cuenta desactivada' },
          { status: 403 }
        )
      }

      const validPassword = await bcrypt.compare(password, userData.password_hash)
      if (!validPassword) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      await client.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [userData.id]
      )
    } finally {
      client.release()
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const roles = userData.roles?.map((r: { name: string }) => r.name) || []

    const token = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        roles,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    const response = NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        roles,
      },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}