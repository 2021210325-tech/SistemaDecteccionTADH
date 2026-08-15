"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { Users, GraduationCap, FileText, Activity, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Evaluation {
  id: string; student_name: string; test_name: string; status: string
  created_at: string; institution_name: string
}

interface DashboardStats {
  totalStudents: number
  totalEvaluations: number
  pendingEvaluations: number
  completedEvaluations: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ totalStudents: 0, totalEvaluations: 0, pendingEvaluations: 0, completedEvaluations: 0 })
  const [recentEvaluations, setRecentEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [evRes, stRes] = await Promise.all([
        fetch("/api/admin/evaluaciones"),
        fetch("/api/admin/estudiantes"),
      ])
      if (evRes.ok) {
        const data = await evRes.json()
        const evaluations = data.evaluations || []
        setRecentEvaluations(evaluations.slice(0, 5))
        setStats({
          totalStudents: evaluations.length,
          totalEvaluations: evaluations.length,
          pendingEvaluations: evaluations.filter((e: Evaluation) => e.status === "pending").length,
          completedEvaluations: evaluations.filter((e: Evaluation) => e.status === "completed").length,
        })
      }
    } catch { console.error("Error fetching data") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const handleFocus = () => { fetchData() }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [fetchData])

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      completed: { variant: "default", label: "Finalizada" },
      in_progress: { variant: "secondary", label: "En Proceso" },
      pending: { variant: "outline", label: "Pendiente" },
    }
    const s = map[status] || { variant: "outline" as const, label: status }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Administrador</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Panel de control del sistema de detección TDAH</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Estudiantes" value={stats.totalStudents} icon={GraduationCap} />
        <StatCard title="Evaluaciones" value={stats.totalEvaluations} icon={Activity} />
        <StatCard title="Pendientes" value={stats.pendingEvaluations} icon={Calendar} />
        <StatCard title="Finalizadas" value={stats.completedEvaluations} icon={FileText} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Evaluaciones Recientes</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Últimas evaluaciones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          ) : recentEvaluations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay evaluaciones registradas</p>
          ) : (
            <div className="space-y-3">
              {recentEvaluations.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{ev.student_name}</p>
                    <p className="text-xs text-muted-foreground">{ev.test_name} • {ev.institution_name}</p>
                  </div>
                  {getStatusBadge(ev.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}