"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { GraduationCap, Activity, TrendingUp, Building2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EntityDashboard() {
  const [stats] = useState({
    totalStudents: 1500,
    totalEvaluations: 890,
    totalInstitutions: 12,
    possibleCases: 230,
  })

  const chartData = [
    { name: "I.E. 33356", evaluaciones: 150, indicadores: 28 },
    { name: "I.E. 33357", evaluaciones: 120, indicadores: 15 },
    { name: "I.E. 33358", evaluaciones: 180, indicadores: 35 },
    { name: "I.E. 33359", evaluaciones: 90, indicadores: 12 },
    { name: "I.E. 33360", evaluaciones: 200, indicadores: 42 },
  ]

  const degrees = [
    { name: "1.° Primaria", count: 45, pct: 30 },
    { name: "2.° Primaria", count: 52, pct: 35 },
    { name: "3.° Primaria", count: 48, pct: 32 },
    { name: "4.° Primaria", count: 55, pct: 37 },
    { name: "5.° Primaria", count: 40, pct: 27 },
    { name: "6.° Primaria", count: 38, pct: 25 },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Entidad Gubernamental</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Estadísticas agregadas para toma de decisiones</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Estudiantes" value={stats.totalStudents.toLocaleString()} icon={GraduationCap} />
        <StatCard title="Evaluaciones" value={stats.totalEvaluations.toLocaleString()} icon={Activity} />
        <StatCard title="Posibles Casos" value={stats.possibleCases.toLocaleString()} icon={TrendingUp}
          description={`${Math.round((stats.possibleCases / stats.totalEvaluations) * 100)}%`} />
        <StatCard title="Instituciones" value={stats.totalInstitutions} icon={Building2} />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Por Institución</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Evaluaciones e indicadores</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Región" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="huanuco">Huánuco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="evaluaciones" fill="#3b82f6" name="Evaluados" />
                <Bar dataKey="indicadores" fill="#ef4444" name="Indicadores" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Por Grado</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Nivel educativo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {degrees.map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm">{d.name}</span>
                    <span className="text-xs sm:text-sm font-medium">{d.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}