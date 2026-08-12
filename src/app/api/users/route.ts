import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { psychologist: { firstName: { contains: search } } },
        { psychologist: { lastName: { contains: search } } },
        { administrator: { firstName: { contains: search } } },
        { administrator: { lastName: { contains: search } } },
      ]
    }

    if (role) {
      where.roles = {
        some: {
          role: { name: role },
        },
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          psychologist: true,
          administrator: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    )
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

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: "hashed_password_placeholder",
        psychologist: role === "PSICOLOGO" ? {
          create: {
            firstName,
            lastName,
            phone,
            specialization,
            licenseNumber,
            institutionId,
          },
        } : undefined,
        administrator: role.startsWith("ADMIN_") ? {
          create: {
            firstName,
            lastName,
            phone,
          },
        } : undefined,
        roles: {
          create: {
            role: {
              connect: { name: role },
            },
          },
        },
      },
      include: {
        psychologist: true,
        administrator: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    )
  }
}