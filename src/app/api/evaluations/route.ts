import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const studentId = searchParams.get("studentId") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
        { test: { name: { contains: search } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (studentId) {
      where.studentId = studentId
    }

    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        include: {
          student: true,
          test: true,
          psychologist: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.evaluation.count({ where }),
    ])

    return NextResponse.json({
      evaluations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching evaluations:", error)
    return NextResponse.json(
      { error: "Error al obtener evaluaciones" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, testId, psychologistId, scheduledDate } = body

    if (!studentId || !testId) {
      return NextResponse.json(
        { error: "Estudiante y test son requeridos" },
        { status: 400 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 }
      )
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
    })

    if (!test) {
      return NextResponse.json(
        { error: "Test no encontrado" },
        { status: 404 }
      )
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        studentId,
        testId,
        psychologistId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: "pending",
      },
      include: {
        student: true,
        test: true,
      },
    })

    return NextResponse.json(evaluation, { status: 201 })
  } catch (error) {
    console.error("Error creating evaluation:", error)
    return NextResponse.json(
      { error: "Error al crear evaluación" },
      { status: 500 }
    )
  }
}