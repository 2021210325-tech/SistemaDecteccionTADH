import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get("institutionId") || ""
    const levelId = searchParams.get("levelId") || ""
    const gradeId = searchParams.get("gradeId") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""

    const dateFilter: Record<string, Date> = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    const studentFilter: Record<string, string> = {}
    if (institutionId) {
      studentFilter.institutionId = institutionId
    }
    if (levelId) {
      studentFilter.currentLevelId = levelId
    }
    if (gradeId) {
      studentFilter.currentGradeId = gradeId
    }

    const evaluationFilter: Record<string, unknown> = {}
    if (Object.keys(studentFilter).length > 0) {
      evaluationFilter.student = studentFilter
    }
    if (Object.keys(dateFilter).length > 0) {
      evaluationFilter.createdAt = dateFilter
    }

    const [
      totalStudents,
      totalEvaluations,
      totalPsychologists,
      totalReports,
      evaluationsByStatus,
      recentEvaluations,
    ] = await Promise.all([
      prisma.student.count({
        where: Object.keys(studentFilter).length > 0 ? studentFilter : undefined,
      }),
      prisma.evaluation.count({
        where: Object.keys(evaluationFilter).length > 0 ? evaluationFilter : undefined,
      }),
      prisma.psychologist.count({
        where: { isActive: true },
      }),
      prisma.psychologicalReport.count(),
      prisma.evaluation.groupBy({
        by: ["status"],
        _count: true,
        where: Object.keys(evaluationFilter).length > 0 ? evaluationFilter : undefined,
      }),
      prisma.evaluation.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          student: true,
          test: true,
          psychologist: true,
        },
      }),
    ])

    const possibleCases = await prisma.evaluationResult.count({
      where: {
        evaluation: {
          status: "completed",
        },
        OR: [
          { category: "inattention" },
          { category: "hyperactivity" },
          { category: "combined" },
        ],
      },
    })

    return NextResponse.json({
      overview: {
        totalStudents,
        totalEvaluations,
        totalPsychologists,
        totalReports,
        possibleCases,
        evaluatedPercentage: totalStudents > 0
          ? Math.round((totalEvaluations / totalStudents) * 100)
          : 0,
      },
      evaluationsByStatus: evaluationsByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      recentEvaluations,
    })
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}