"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Download, Loader2 } from "lucide-react"

interface Report {
  id: string
  student_name: string
  title: string
  date: string
  status: string
}

export default function PsychologistReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setReports([
      { id: "1", student_name: "Juan Pérez García", title: "Informe Evaluación TDAH", date: "2026-08-06", status: "completed" },
      { id: "2", student_name: "María López Ramírez", title: "Informe Seguimiento", date: "2026-08-08", status: "draft" },
    ])
    setLoading(false)
  }, [])

  const filtered = reports.filter((r) =>
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      completed: { variant: "default", label: "Finalizado" },
      draft: { variant: "secondary", label: "Borrador" },
    }
    const s = map[status] || { variant: "outline" as const, label: status }
    return <Badge variant={s.variant}>{s.label}</Badge>
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
                            <Button variant="ghost" size="icon" title="Ver"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Descargar"><Download className="h-4 w-4" /></Button>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-3 w-3" /></Button>
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
    </div>
  )
}