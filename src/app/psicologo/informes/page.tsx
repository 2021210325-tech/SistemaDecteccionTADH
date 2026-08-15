"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Eye, Download, Loader2 } from "lucide-react"

interface Report {
  id: string; student_name: string; student_code: string; title: string
  date: string; status: string; institution_name: string; test_name: string
  observations?: string; recommendations?: string; has_symptoms?: boolean
  psychologist_name?: string; created_at: string
}

export default function PsychologistReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Report | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/evaluaciones")
      if (res.ok) {
        const data = await res.json()
        const evaluations = data.evaluations || []
        setReports(evaluations.map((e: Report & { created_at: string }) => ({
          id: e.id,
          student_name: e.student_name,
          student_code: e.student_code,
          title: `Informe Evaluación TDAH - ${e.student_name}`,
          date: new Date(e.created_at).toLocaleDateString(),
          status: e.status,
          institution_name: e.institution_name,
          test_name: e.test_name,
          observations: e.observations,
          recommendations: e.recommendations,
          has_symptoms: e.has_symptoms,
          psychologist_name: e.psychologist_name,
          created_at: e.created_at,
        })))
      }
    } catch { console.error("Error fetching reports") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = reports.filter((r) =>
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      completed: { variant: "default", label: "Finalizado" },
      in_progress: { variant: "secondary", label: "En Proceso" },
      pending: { variant: "outline", label: "Borrador" },
    }
    const s = map[status] || { variant: "outline" as const, label: status }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  const openDetail = (report: Report) => { setSelected(report); setDetailOpen(true) }

  const handleDownload = (report: Report) => {
    setDownloading(report.id)
    const content = `
INFORME DE EVALUACIÓN PSICOLÓGICA
==================================

Estudiante: ${report.student_name}
Código: ${report.student_code}
Institución: ${report.institution_name}
Test Aplicado: ${report.test_name}
Fecha de Evaluación: ${report.date}
Estado: ${report.status === "completed" ? "Finalizado" : "En Proceso"}
Psicólogo: ${report.psychologist_name || "No asignado"}

OBSERVACIONES:
${report.observations || "Sin observaciones"}

RECOMENDACIONES:
${report.recommendations || "Sin recomendaciones"}

SÍNTOMAS DETECTADOS: ${report.has_symptoms ? "Sí" : "No"}

==================================
Generado el ${new Date().toLocaleDateString()}
Sistema de Evaluación TDAH
    `.trim()

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Informe_${report.student_code}_${report.date.replace(/\//g, "-")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloading(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Informes</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Informes psicológicos generados</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Lista de Informes</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{reports.length} informes registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por estudiante, título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No se encontraron informes</div>
          ) : (
            <>
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Estudiante</th>
                      <th className="h-10 px-4 text-left font-medium">Título</th>
                      <th className="h-10 px-4 text-left font-medium">Fecha</th>
                      <th className="h-10 px-4 text-left font-medium">Estado</th>
                      <th className="h-10 px-4 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4 font-medium">{r.student_name}</td>
                        <td className="p-4">{r.title}</td>
                        <td className="p-4">{r.date}</td>
                        <td className="p-4">{getStatusBadge(r.status)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Ver" onClick={() => openDetail(r)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Descargar" onClick={() => handleDownload(r)} disabled={downloading === r.id}>
                              {downloading === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {filtered.map((r) => (
                  <div key={r.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.student_name}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(r)}><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(r)} disabled={downloading === r.id}>
                          {downloading === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(r.status)}
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Informe</DialogTitle>
            <DialogDescription>Información completa del informe</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Estudiante:</span><span>{selected.student_name}</span>
                <span className="text-muted-foreground">Código:</span><span className="font-mono">{selected.student_code}</span>
                <span className="text-muted-foreground">Institución:</span><span>{selected.institution_name}</span>
                <span className="text-muted-foreground">Test:</span><span>{selected.test_name}</span>
                <span className="text-muted-foreground">Fecha:</span><span>{selected.date}</span>
                <span className="text-muted-foreground">Estado:</span><span>{getStatusBadge(selected.status)}</span>
                <span className="text-muted-foreground">Psicólogo:</span><span>{selected.psychologist_name || "-"}</span>
                <span className="text-muted-foreground">Síntomas:</span>
                <span><Badge variant={selected.has_symptoms ? "destructive" : "default"}>
                  {selected.has_symptoms ? "Sí" : "No"}
                </Badge></span>
              </div>
              {selected.observations && (
                <div><p className="text-muted-foreground mb-1">Observaciones:</p><p className="text-sm">{selected.observations}</p></div>
              )}
              {selected.recommendations && (
                <div><p className="text-muted-foreground mb-1">Recomendaciones:</p><p className="text-sm">{selected.recommendations}</p></div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
            {selected && (
              <Button onClick={() => { handleDownload(selected); setDetailOpen(false) }}>
                <Download className="mr-2 h-4 w-4" /> Descargar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}