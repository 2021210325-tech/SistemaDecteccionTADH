"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, Loader2 } from "lucide-react"

interface Student {
  id: string; code: string; first_name: string; last_name: string
  document_type?: string; document_number?: string; date_of_birth?: string
  age?: number; gender?: string; institution_name: string; institution_code?: string
  level_name?: string; grade_name?: string; current_section?: string; school_year?: string
  guardian_name?: string; guardian_phone?: string; guardian_email?: string
  status: string; notes?: string; created_at?: string
}

export default function PsychologistStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Student | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/estudiantes")
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
      }
    } catch { console.error("Error fetching students") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = students.filter((s) =>
    s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openDetail = (student: Student) => { setSelected(student); setDetailOpen(true) }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Mis Estudiantes</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Estudiantes asignados para evaluación</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Lista de Estudiantes</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{students.length} estudiantes asignados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No se encontraron estudiantes</div>
          ) : (
            <>
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Código</th>
                      <th className="h-10 px-4 text-left font-medium">Nombre</th>
                      <th className="h-10 px-4 text-left font-medium">Grado</th>
                      <th className="h-10 px-4 text-left font-medium">Institución</th>
                      <th className="h-10 px-4 text-left font-medium">Estado</th>
                      <th className="h-10 px-4 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4 font-mono text-xs">{s.code}</td>
                        <td className="p-4 font-medium">{s.first_name} {s.last_name}</td>
                        <td className="p-4">{s.grade_name || "-"}</td>
                        <td className="p-4">{s.institution_name}</td>
                        <td className="p-4"><Badge variant="default">Activo</Badge></td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon" title="Ver" onClick={() => openDetail(s)}><Eye className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {filtered.map((s) => (
                  <div key={s.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.code}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(s)}><Eye className="h-3 w-3" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-muted-foreground">{s.grade_name || "-"}</span>
                      <span>•</span>
                      <span className="text-muted-foreground">{s.institution_name}</span>
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
            <DialogTitle>Detalle del Estudiante</DialogTitle>
            <DialogDescription>Información completa del estudiante</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Código:</span><span className="font-mono">{selected.code}</span>
                <span className="text-muted-foreground">Nombre:</span><span>{selected.first_name} {selected.last_name}</span>
                {selected.document_type && <><span className="text-muted-foreground">Tipo doc.:</span><span>{selected.document_type}</span></>}
                {selected.document_number && <><span className="text-muted-foreground">N° documento:</span><span>{selected.document_number}</span></>}
                {selected.date_of_birth && <><span className="text-muted-foreground">Fecha nac.:</span><span>{new Date(selected.date_of_birth).toLocaleDateString()}</span></>}
                {selected.age && <><span className="text-muted-foreground">Edad:</span><span>{selected.age} años</span></>}
                {selected.gender && <><span className="text-muted-foreground">Género:</span><span>{selected.gender}</span></>}
                <span className="text-muted-foreground">Institución:</span><span>{selected.institution_name}</span>
                {selected.level_name && <><span className="text-muted-foreground">Nivel:</span><span>{selected.level_name}</span></>}
                {selected.grade_name && <><span className="text-muted-foreground">Grado:</span><span>{selected.grade_name}</span></>}
                {selected.current_section && <><span className="text-muted-foreground">Sección:</span><span>{selected.current_section}</span></>}
                {selected.school_year && <><span className="text-muted-foreground">Año escolar:</span><span>{selected.school_year}</span></>}
                {selected.guardian_name && <><span className="text-muted-foreground">Apoderado:</span><span>{selected.guardian_name}</span></>}
                {selected.guardian_phone && <><span className="text-muted-foreground">Tel. apoderado:</span><span>{selected.guardian_phone}</span></>}
                {selected.guardian_email && <><span className="text-muted-foreground">Email apoderado:</span><span>{selected.guardian_email}</span></>}
                <span className="text-muted-foreground">Estado:</span><span><Badge variant="default">Activo</Badge></span>
                {selected.notes && <><span className="text-muted-foreground">Notas:</span><span>{selected.notes}</span></>}
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