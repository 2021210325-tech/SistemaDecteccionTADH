"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { Users, Activity, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function PsychologistDashboard() {
  const [stats] = useState({
    assignedStudents: 25,
    pendingEvaluations: 8,
    completedEvaluations: 42,
    upcomingAppointments: 3,
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Psicólogo</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Panel de control de actividades psicológicas</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Estudiantes Asignados" value={stats.assignedStudents} icon={Users} />
        <StatCard title="Evaluaciones Pendientes" value={stats.pendingEvaluations} icon={Activity} />
        <StatCard title="Finalizadas" value={stats.completedEvaluations} icon={FileText} />
        <StatCard title="Próximas Citas" value={stats.upcomingAppointments} icon={Calendar} />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Evaluaciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Juan Pérez García", test: "DIVA 2.0", status: "Finalizada", variant: "default" as const },
                { name: "María López Ramírez", test: "DIVA 2.0", status: "En Proceso", variant: "secondary" as const },
                { name: "Carlos Mendoza Silva", test: "DIVA 2.0", status: "Pendiente", variant: "outline" as const },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.test}</p>
                  </div>
                  <Badge variant={item.variant} className="flex-shrink-0 ml-2">{item.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Citas Próximas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Padres de Juan Pérez", time: "10:00 - 11:00 AM" },
                { name: "Seguimiento María López", time: "2:00 - 2:30 PM" },
                { name: "Evaluación Carlos Mendoza", time: "3:00 - 4:00 PM" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                  <Button size="sm" className="flex-shrink-0 ml-2">Ver</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}