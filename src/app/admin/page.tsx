"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { Users, GraduationCap, FileText, Activity, TrendingUp, Building2, Calendar } from "lucide-react"

interface DashboardStats {
  totalStudents: number
  totalEvaluations: number
  totalPsychologists: number
  totalReports: number
  possibleCases: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalEvaluations: 0,
    totalPsychologists: 0,
    totalReports: 0,
    possibleCases: 0,
  })

  useEffect(() => {
    setStats({
      totalStudents: 150,
      totalEvaluations: 89,
      totalPsychologists: 5,
      totalReports: 42,
      possibleCases: 23,
    })
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Administrador</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Panel de control del sistema de detección TDAH
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Estudiantes"
          value={stats.totalStudents}
          icon={GraduationCap}
          trend="up"
          trendValue="+12% este mes"
        />
        <StatCard
          title="Evaluaciones"
          value={stats.totalEvaluations}
          icon={Activity}
          trend="up"
          trendValue="+8% este mes"
        />
        <StatCard
          title="Psicólogos"
          value={stats.totalPsychologists}
          icon={Users}
        />
        <StatCard
          title="Informes"
          value={stats.totalReports}
          icon={FileText}
          trend="up"
          trendValue="+15%"
        />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Evaluaciones Recientes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Últimas evaluaciones realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Juan Pérez García", test: "DIVA 2.0", status: "Finalizada" },
                { name: "María López Ramírez", test: "DIVA 2.0", status: "En Proceso" },
                { name: "Carlos Mendoza Silva", test: "DIVA 2.0", status: "Pendiente" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.test}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                    item.status === "Finalizada" ? "bg-green-100 text-green-700" :
                    item.status === "En Proceso" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: Users, text: "Nuevo psicólogo registrado", time: "Hace 2h" },
                { icon: FileText, text: "Informe generado", time: "Hace 4h" },
                { icon: Activity, text: "Evaluación completada", time: "Hace 6h" },
                { icon: Calendar, text: "Cita programada", time: "Ayer" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 border-b pb-3 last:border-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
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