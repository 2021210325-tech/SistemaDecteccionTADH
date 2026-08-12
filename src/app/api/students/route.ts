import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { code: { contains: search } },
          ],
        }
      : {}

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          institution: true,
          currentGrade: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.count({ where }),
    ])

    return NextResponse.json({
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { error: "Error al obtener estudiantes" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      documentType,
      documentNumber,
      dateOfBirth,
      gender,
      institutionId,
      currentLevelId,
      currentGradeId,
      currentSection,
      schoolYear,
      guardianName,
      guardianPhone,
      guardianEmail,
    } = body

    if (!firstName || !lastName || !institutionId) {
      return NextResponse.json(
        { error: "Nombre, apellido e institución son requeridos" },
        { status: 400 }
      )
    }

    const lastStudent = await prisma.student.findFirst({
      orderBy: { createdAt: "desc" },
    })
    const nextCode = lastStudent?.code
      ? `EST${(parseInt(lastStudent.code.replace("EST", "")) + 1).toString().padStart(4, "0")}`
      : "EST0001"

    const student = await prisma.student.create({
      data: {
        code: nextCode,
        firstName,
        lastName,
        documentType,
        documentNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        institutionId,
        currentLevelId,
        currentGradeId,
        currentSection,
        schoolYear,
        guardianName,
        guardianPhone,
        guardianEmail,
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { error: "Error al crear estudiante" },
      { status: 500 }
    )
  }
}