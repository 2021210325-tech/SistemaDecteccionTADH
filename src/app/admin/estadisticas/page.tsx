"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { GraduationCap, FileText, Activity, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface Statistics {
  overview: {
    totalStudents: number
    totalEvaluations: number
    totalPsychologists: number
    totalReports: number
    possibleCases: number
    evaluatedPercentage: number
  }
  evaluationsByStatus: { status: string; count: number }[]
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null)

  useEffect(() => {
    setStats({
      overview: { totalStudents: 150, totalEvaluations: 89, totalPsychologists: 5, totalReports: 42, possibleCases: 23, evaluatedPercentage: 59 },
      evaluationsByStatus: [
        { status: "Pendiente", count: 12 },
        { status: "En Proceso", count: 8 },
        { status: "Finalizada", count: 65 },
        { status: "Revisada", count: 4 },
      ],
    })
  }, [])

  if (!stats) return <div className="p-4 text-sm">Cargando...</div>

  const chartData = [
    { name: "Ene", evaluaciones: 12 }, { name: "Feb", evaluaciones: 19 }, { name: "Mar", evaluaciones: 15 },
    { name: "Abr", evaluaciones: 22 }, { name: "May", evaluaciones: 18 }, { name: "Jun", evaluaciones: 25 },
    { name: "Jul", evaluaciones: 30 }, { name: "Ago", evaluaciones: 28 },
  ]

  const pieData = stats.evaluationsByStatus.map((item) => ({ name: item.status, value: item.count }))
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Estadísticas</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Análisis y métricas del sistema de detección TDAH</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Estudiantes" value={stats.overview.totalStudents} icon={GraduationCap} trend="up" trendValue="+12%" />
        <StatCard title="Evaluaciones" value={stats.overview.totalEvaluations} icon={Activity} trend="up" trendValue="+8%" />
        <StatCard title="Posibles Casos" value={stats.overview.possibleCases} icon={TrendingUp} description={`${Math.round((stats.overview.possibleCases / stats.overview.totalEvaluations) * 100)}%`} />
        <StatCard title="Informes" value={stats.overview.totalReports} icon={FileText} trend="up" trendValue="+15%" />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Evaluaciones por Mes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Tendencia en 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="evaluaciones" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Distribución por Estado</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={70} fill="#8884d8" dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Resumen General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium">Porcentaje Evaluados</p>
              <div className="text-xl sm:text-2xl font-bold">{stats.overview.evaluatedPercentage}%</div>
              <p className="text-xs text-muted-foreground">{stats.overview.totalEvaluations} de {stats.overview.totalStudents} estudiantes</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium">Psicólogos Activos</p>
              <div className="text-xl sm:text-2xl font-bold">{stats.overview.totalPsychologists}</div>
              <p className="text-xs text-muted-foreground">En el sistema</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium">Instituciones</p>
              <div className="text-xl sm:text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">I.E. 33356 y otras</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}