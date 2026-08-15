"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { Users, Activity, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Evaluation {
  id: string; student_name: string; student_code: string; test_name: string
  status: string; created_at: string; observations?: string; recommendations?: string
  has_symptoms?: boolean; institution_name: string; psychologist_name?: string
}

interface Appointment {
  id: string; student_name: string; student_code: string; appointment_date: string
  start_time: string; end_time: string; modality: string; reason?: string
  status: string; notes?: string; institution_name: string; psychologist_name?: string
}

export default function PsychologistDashboard() {
  const [stats, setStats] = useState({ assignedStudents: 0, pendingEvaluations: 0, completedEvaluations: 0, upcomingAppointments: 0 })
  const [recentEvaluations, setRecentEvaluations] = useState<Evaluation[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Evaluation | Appointment | null>(null)
  const [detailType, setDetailType] = useState<"evaluation" | "appointment">("evaluation")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [evRes, apRes] = await Promise.all([
        fetch("/api/admin/evaluaciones"),
        fetch("/api/admin/citas"),
      ])
      if (evRes.ok) {
        const data = await evRes.json()
        const evaluations = data.evaluations || []
        setRecentEvaluations(evaluations.slice(0, 5))
        setStats(prev => ({
          ...prev,
          assignedStudents: evaluations.length,
          pendingEvaluations: evaluations.filter((e: Evaluation) => e.status === "pending").length,
          completedEvaluations: evaluations.filter((e: Evaluation) => e.status === "completed").length,
        }))
      }
      if (apRes.ok) {
        const data = await apRes.json()
        const appts = data.appointments || []
        setAppointments(appts.slice(0, 5))
        setStats(prev => ({ ...prev, upcomingAppointments: appts.length }))
      }
    } catch { console.error("Error fetching data") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Refrescar datos cuando la ventana recibe foco
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
      confirmed: { variant: "default", label: "Confirmada" },
      cancelled: { variant: "outline", label: "Cancelada" },
    }
    const s = map[status] || { variant: "outline" as const, label: status }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  const openEvaluationDetail = (ev: Evaluation) => {
    setSelectedItem(ev); setDetailType("evaluation"); setDetailOpen(true)
  }

  const openAppointmentDetail = (appt: Appointment) => {
    setSelectedItem(appt); setDetailType("appointment"); setDetailOpen(true)
  }

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
      return date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true })
    } catch { return timeStr }
  }

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
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
            ) : recentEvaluations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay evaluaciones recientes</p>
            ) : (
              <div className="space-y-3">
                {recentEvaluations.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{ev.student_name}</p>
                      <p className="text-xs text-muted-foreground">{ev.test_name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {getStatusBadge(ev.status)}
                      <Button size="sm" variant="outline" onClick={() => openEvaluationDetail(ev)}>Ver</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Citas Próximas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay citas programadas</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{appt.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {getStatusBadge(appt.status)}
                      <Button size="sm" onClick={() => openAppointmentDetail(appt)}>Ver</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailType === "evaluation" ? "Detalle de Evaluación" : "Detalle de Cita"}</DialogTitle>
            <DialogDescription>Información completa</DialogDescription>
          </DialogHeader>
          {selectedItem && detailType === "evaluation" && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Estudiante:</span><span>{(selectedItem as Evaluation).student_name}</span>
                <span className="text-muted-foreground">Código:</span><span className="font-mono">{(selectedItem as Evaluation).student_code}</span>
                <span className="text-muted-foreground">Colegio:</span><span>{(selectedItem as Evaluation).institution_name}</span>
                <span className="text-muted-foreground">Test:</span><span>{(selectedItem as Evaluation).test_name}</span>
                <span className="text-muted-foreground">Psicólogo:</span><span>{(selectedItem as Evaluation).psychologist_name || "-"}</span>
                <span className="text-muted-foreground">Estado:</span><span>{getStatusBadge((selectedItem as Evaluation).status)}</span>
                <span className="text-muted-foreground">Síntomas:</span>
                <span><Badge variant={(selectedItem as Evaluation).has_symptoms ? "destructive" : "default"}>
                  {(selectedItem as Evaluation).has_symptoms ? "Sí" : "No"}
                </Badge></span>
                <span className="text-muted-foreground">Fecha:</span><span>{new Date((selectedItem as Evaluation).created_at).toLocaleDateString()}</span>
                {(selectedItem as Evaluation).observations && (
                  <><span className="text-muted-foreground">Observaciones:</span><span>{(selectedItem as Evaluation).observations}</span></>
                )}
                {(selectedItem as Evaluation).recommendations && (
                  <><span className="text-muted-foreground">Recomendaciones:</span><span>{(selectedItem as Evaluation).recommendations}</span></>
                )}
              </div>
            </div>
          )}
          {selectedItem && detailType === "appointment" && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Estudiante:</span><span>{(selectedItem as Appointment).student_name}</span>
                <span className="text-muted-foreground">Código:</span><span className="font-mono">{(selectedItem as Appointment).student_code}</span>
                <span className="text-muted-foreground">Colegio:</span><span>{(selectedItem as Appointment).institution_name}</span>
                <span className="text-muted-foreground">Fecha:</span><span>{new Date((selectedItem as Appointment).appointment_date).toLocaleDateString()}</span>
                <span className="text-muted-foreground">Hora inicio:</span><span>{formatTime((selectedItem as Appointment).start_time)}</span>
                <span className="text-muted-foreground">Hora fin:</span><span>{formatTime((selectedItem as Appointment).end_time)}</span>
                <span className="text-muted-foreground">Modalidad:</span><span>{(selectedItem as Appointment).modality === "in_person" ? "Presencial" : "Virtual"}</span>
                <span className="text-muted-foreground">Estado:</span><span>{getStatusBadge((selectedItem as Appointment).status)}</span>
                <span className="text-muted-foreground">Psicólogo:</span><span>{(selectedItem as Appointment).psychologist_name || "-"}</span>
                {(selectedItem as Appointment).reason && (
                  <><span className="text-muted-foreground">Motivo:</span><span>{(selectedItem as Appointment).reason}</span></>
                )}
                {(selectedItem as Appointment).notes && (
                  <><span className="text-muted-foreground">Notas:</span><span>{(selectedItem as Appointment).notes}</span></>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}