"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Loader2, Clock, MapPin, User } from "lucide-react"

interface Appointment {
  id: string; student_name: string; student_code: string; appointment_date: string
  start_time: string; end_time: string; modality: string; reason?: string
  status: string; notes?: string; institution_name: string; psychologist_name?: string
}

export default function PsychologistAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/citas")
      if (res.ok) {
        const data = await res.json()
        setAppointments(data.appointments || [])
      }
    } catch { console.error("Error fetching appointments") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      completed: { variant: "default", label: "Finalizada" },
      in_progress: { variant: "secondary", label: "En Curso" },
      confirmed: { variant: "default", label: "Confirmada" },
      pending: { variant: "secondary", label: "Pendiente" },
      cancelled: { variant: "outline", label: "Cancelada" },
    }
    const s = map[status] || { variant: "outline" as const, label: status }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
      return date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true })
    } catch { return timeStr }
  }

  const openDetail = (appt: Appointment) => { setSelected(appt); setDetailOpen(true) }

  const handleStart = async (appt: Appointment) => {
    setUpdatingId(appt.id)
    setError("")
    try {
      const res = await fetch(`/api/admin/citas/${appt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      })
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "in_progress" } : a))
      } else {
        const data = await res.json()
        setError(data.error || "Error al actualizar")
      }
    } catch { setError("Error de conexión") }
    finally { setUpdatingId(null) }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Citas</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Citas programadas</p>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No hay citas programadas</div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {appointments.map((a) => (
            <Card key={a.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium truncate">{a.student_name}</CardTitle>
                  {getStatusBadge(a.status)}
                </div>
                <CardDescription className="text-xs truncate">{a.reason || "Sin motivo especificado"}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-1 text-sm text-muted-foreground flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{new Date(a.appointment_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>{formatTime(a.start_time)} - {formatTime(a.end_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{a.modality === "in_person" ? "Presencial" : "Virtual"}</span>
                  </div>
                  {a.institution_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{a.institution_name}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetail(a)}>Ver</Button>
                  <Button size="sm" className="flex-1" onClick={() => handleStart(a)} disabled={updatingId === a.id || a.status === "completed" || a.status === "cancelled"}>
                    {updatingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Cita</DialogTitle>
            <DialogDescription>Información completa de la cita</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Estudiante:</span><span>{selected.student_name}</span>
                <span className="text-muted-foreground">Código:</span><span className="font-mono">{selected.student_code}</span>
                <span className="text-muted-foreground">Colegio:</span><span>{selected.institution_name}</span>
                <span className="text-muted-foreground">Fecha:</span><span>{new Date(selected.appointment_date).toLocaleDateString()}</span>
                <span className="text-muted-foreground">Hora inicio:</span><span>{formatTime(selected.start_time)}</span>
                <span className="text-muted-foreground">Hora fin:</span><span>{formatTime(selected.end_time)}</span>
                <span className="text-muted-foreground">Modalidad:</span><span>{selected.modality === "in_person" ? "Presencial" : "Virtual"}</span>
                <span className="text-muted-foreground">Estado:</span><span>{getStatusBadge(selected.status)}</span>
                <span className="text-muted-foreground">Psicólogo:</span><span>{selected.psychologist_name || "-"}</span>
              </div>
              {selected.reason && (
                <div><p className="text-muted-foreground mb-1">Motivo:</p><p className="text-sm">{selected.reason}</p></div>
              )}
              {selected.notes && (
                <div><p className="text-muted-foreground mb-1">Notas:</p><p className="text-sm">{selected.notes}</p></div>
              )}
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