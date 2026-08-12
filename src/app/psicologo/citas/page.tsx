"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Loader2 } from "lucide-react"

interface Appointment {
  id: string
  student_name: string
  type: string
  date: string
  time: string
  status: string
}

export default function PsychologistAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setAppointments([
      { id: "1", student_name: "Padres de Juan Pérez", type: "Entrevista padres", date: "2026-08-12", time: "10:00 - 11:00", status: "confirmed" },
      { id: "2", student_name: "María López Ramírez", type: "Seguimiento", date: "2026-08-12", time: "14:00 - 14:30", status: "pending" },
      { id: "3", student_name: "Carlos Mendoza Silva", type: "Evaluación", date: "2026-08-13", time: "09:00 - 10:00", status: "pending" },
    ])
    setLoading(false)
  }, [])

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      confirmed: { variant: "default", label: "Confirmada" },
      pending: { variant: "secondary", label: "Pendiente" },
      cancelled: { variant: "outline", label: "Cancelada" },
    }
    const s = map[status] || { variant: "outline" as const, label: status }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Citas</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Citas programadas</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {appointments.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">{a.student_name}</CardTitle>
                  {getStatusBadge(a.status)}
                </div>
                <CardDescription className="text-xs">{a.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{a.date} • {a.time}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="w-full">Ver</Button>
                  <Button size="sm" className="w-full">Iniciar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}