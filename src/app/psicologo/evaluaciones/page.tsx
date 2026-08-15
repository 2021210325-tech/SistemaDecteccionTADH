"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Eye, FileText, Loader2, Plus, Edit, Trash2 } from "lucide-react"

interface Evaluation {
  id: string; student_id: string; test_id: string; psychologist_id?: string
  status: string; totalScore?: number; maxScore?: number; percentage?: number
  observations?: string; recommendations?: string; created_at: string; completed_at?: string
  student_name: string; student_code: string; institution_name: string
  test_name: string; psychologist_name?: string; has_symptoms?: boolean
}

interface Student { id: string; code: string; first_name: string; last_name: string; institution_name: string }
interface Test { id: string; code: string; name: string }

export default function PsychologistEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterInstitution, setFilterInstitution] = useState("all")
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Evaluation | null>(null)

  const [form, setForm] = useState({ studentId: "", testId: "", observations: "", recommendations: "", hasSymptoms: false,
    studentFirstName: "", studentLastName: "", studentCode: "", studentInstitutionId: "" })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [evRes, stRes, testRes, instRes] = await Promise.all([
        fetch("/api/admin/evaluaciones"),
        fetch("/api/admin/estudiantes"),
        fetch("/api/admin/tests"),
        fetch("/api/admin/instituciones/catalog"),
      ])
      if (evRes.ok) setEvaluations((await evRes.json()).evaluations || [])
      if (stRes.ok) setStudents((await stRes.json()).students || [])
      if (testRes.ok) setTests((await testRes.json()).tests || [])
      if (instRes.ok) setInstitutions((await instRes.json()).institutions || [])
    } catch { console.error("Error fetching data") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = evaluations.filter((e) => {
    const matchSearch = e.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.test_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchInst = filterInstitution === "all" || e.institution_name === institutions.find((i) => i.id === filterInstitution)?.name
    return matchSearch && matchInst
  })

  const divaTest = tests.find((t) => t.name.toLowerCase().includes("diva"))

  const resetForm = () => { setForm({ studentId: "", testId: divaTest?.id || "", observations: "", recommendations: "", hasSymptoms: false,
    studentFirstName: "", studentLastName: "", studentCode: "", studentInstitutionId: "" }); setFormError("") }

  const handleCreate = async () => {
    setFormError("")
    if (!form.studentId && (!form.studentFirstName || !form.studentLastName || !form.studentInstitutionId)) {
      setFormError("Complete los datos del estudiante (nombre, apellido y colegio)"); return
    }
    if (!form.testId) { setFormError("El test es requerido"); return }
    setFormLoading(true)
    try {
      const res = await fetch("/api/admin/evaluaciones", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setCreateOpen(false); resetForm(); fetchData()
    } catch { setFormError("Error de conexión") }
    finally { setFormLoading(false) }
  }

  const handleEdit = async () => {
    if (!selected) return
    setFormError("")
    setFormLoading(true)
    try {
      const res = await fetch(`/api/admin/evaluaciones/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setEditOpen(false); setSelected(null); resetForm(); fetchData()
    } catch { setFormError("Error de conexión") }
    finally { setFormLoading(false) }
  }

  const handleComplete = async (ev: Evaluation) => {
    try {
      await fetch(`/api/admin/evaluaciones/${ev.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", hasSymptoms: form.hasSymptoms }),
      })
      fetchData()
    } catch { console.error("Error completing evaluation") }
  }

  const handleDelete = async () => {
    if (!selected) return
    setFormLoading(true)
    try {
      const res = await fetch(`/api/admin/evaluaciones/${selected.id}`, { method: "DELETE" })
      if (!res.ok) { const d = await res.json(); setFormError(d.error); return }
      setDeleteOpen(false); setSelected(null); fetchData()
    } catch { setFormError("Error de conexión") }
    finally { setFormLoading(false) }
  }

  const openEdit = (ev: Evaluation) => {
    setSelected(ev)
    setForm({ studentId: ev.student_id, testId: ev.test_id, observations: ev.observations || "", recommendations: ev.recommendations || "", hasSymptoms: ev.has_symptoms || false,
      studentFirstName: "", studentLastName: "", studentCode: "", studentInstitutionId: "" })
    setFormError(""); setEditOpen(true)
  }

  const openView = (ev: Evaluation) => { setSelected(ev); setViewOpen(true) }
  const openDelete = (ev: Evaluation) => { setSelected(ev); setDeleteOpen(true) }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Evaluaciones</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{evaluations.length} evaluaciones registradas</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { resetForm(); setCreateOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Evaluación
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Lista de Evaluaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por estudiante, test..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <select value={filterInstitution} onChange={(e) => setFilterInstitution(e.target.value)} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="all">Todos los colegios</option>
              {institutions.map((i) => <option key={i.id} value={i.name}>{i.name}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No se encontraron evaluaciones</div>
          ) : (
            <>
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Estudiante</th>
                      <th className="h-10 px-4 text-left font-medium">Colegio</th>
                      <th className="h-10 px-4 text-left font-medium">Test</th>
                      <th className="h-10 px-4 text-left font-medium">Estado</th>
                      <th className="h-10 px-4 text-left font-medium">Síntomas</th>
                      <th className="h-10 px-4 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ev) => (
                      <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4">
                          <p className="font-medium">{ev.student_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{ev.student_code}</p>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{ev.institution_name}</td>
                        <td className="p-4">{ev.test_name}</td>
                        <td className="p-4">{getStatusBadge(ev.status)}</td>
                        <td className="p-4">
                          <Badge variant={ev.has_symptoms ? "destructive" : "default"}>
                            {ev.has_symptoms ? "Sí" : "No"}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Ver" onClick={() => openView(ev)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(ev)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Informe"><FileText className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Eliminar" onClick={() => openDelete(ev)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {filtered.map((ev) => (
                  <div key={ev.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{ev.student_name}</p>
                        <p className="text-xs text-muted-foreground">{ev.institution_name}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(ev)}><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ev)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDelete(ev)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(ev.status)}
                      <Badge variant={ev.has_symptoms ? "destructive" : "default"}>
                        Síntomas: {ev.has_symptoms ? "Sí" : "No"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{ev.test_name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Evaluación</DialogTitle>
            <DialogDescription>Crear una nueva evaluación psicológica</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
            <div className="space-y-1.5">
              <Label className="text-sm">Nombre del Estudiante *</Label>
              <Input value={form.studentFirstName} onChange={(e) => setForm({ ...form, studentFirstName: e.target.value })} placeholder="Nombre" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Apellido del Estudiante *</Label>
              <Input value={form.studentLastName} onChange={(e) => setForm({ ...form, studentLastName: e.target.value })} placeholder="Apellido" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Código del Estudiante</Label>
              <Input value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} placeholder="Opcional - se genera automáticamente" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Colegio *</Label>
              <select value={form.studentInstitutionId} onChange={(e) => setForm({ ...form, studentInstitutionId: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Seleccionar colegio</option>
                {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Test *</Label>
              <select value={form.testId} onChange={(e) => setForm({ ...form, testId: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Seleccionar test</option>
                {tests.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Observaciones</Label>
              <Input value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} placeholder="Notas del psicólogo" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Recomendaciones</Label>
              <Input value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} placeholder="Recomendaciones" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Evaluación</DialogTitle>
            <DialogDescription>Modificar evaluación y marcar síntomas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
            <div className="space-y-1.5">
              <Label className="text-sm">Observaciones</Label>
              <Input value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Recomendaciones</Label>
              <Input value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm">¿Presenta síntomas?</Label>
              <select value={form.hasSymptoms ? "true" : "false"} onChange={(e) => setForm({ ...form, hasSymptoms: e.target.value === "true" })} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Evaluación</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Estudiante:</span><span>{selected.student_name}</span>
                <span className="text-muted-foreground">Código:</span><span className="font-mono">{selected.student_code}</span>
                <span className="text-muted-foreground">Colegio:</span><span>{selected.institution_name}</span>
                <span className="text-muted-foreground">Test:</span><span>{selected.test_name}</span>
                <span className="text-muted-foreground">Estado:</span><span>{getStatusBadge(selected.status)}</span>
                <span className="text-muted-foreground">Síntomas:</span>
                <span><Badge variant={selected.has_symptoms ? "destructive" : "default"}>{selected.has_symptoms ? "Sí" : "No"}</Badge></span>
                <span className="text-muted-foreground">Fecha:</span><span>{new Date(selected.created_at).toLocaleDateString()}</span>
                {selected.completed_at && <><span className="text-muted-foreground">Completada:</span><span>{new Date(selected.completed_at).toLocaleDateString()}</span></>}
                {selected.observations && <><span className="text-muted-foreground">Observaciones:</span><span>{selected.observations}</span></>}
                {selected.recommendations && <><span className="text-muted-foreground">Recomendaciones:</span><span>{selected.recommendations}</span></>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Cerrar</Button>
            {selected && <Button onClick={() => { setViewOpen(false); openEdit(selected) }}><Edit className="mr-2 h-4 w-4" /> Editar</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Evaluación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la evaluación de <strong>{selected?.student_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}