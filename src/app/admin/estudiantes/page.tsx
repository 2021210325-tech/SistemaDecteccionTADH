"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Edit, Trash2, Eye, Loader2, Check, ChevronsUpDown } from "lucide-react"

interface Student {
  id: string; code: string; first_name: string; last_name: string
  document_type?: string; document_number?: string; date_of_birth?: string
  age?: number; gender?: string; institution_id: string
  current_level_id?: string; current_grade_id?: string; current_section?: string
  school_year?: string; guardian_name?: string; guardian_phone?: string
  guardian_email?: string; status: string; notes?: string; created_at: string
  institution_name?: string; level_name?: string; grade_name?: string
}

interface Institution { id: string; name: string; modular_code: string }
interface Grade { id: string; name: string; level_id: string }
interface Level { id: string; name: string }

const emptyForm = {
  firstName: "", lastName: "", documentType: "DNI", documentNumber: "",
  dateOfBirth: "", gender: "", institutionId: "", currentLevelId: "",
  currentGradeId: "", currentSection: "", schoolYear: "2026",
  guardianName: "", guardianPhone: "", guardianEmail: "", notes: "",
}

function InstitutionSelect({ value, onChange, institutions }: { value: string; onChange: (v: string) => void; institutions: Institution[] }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const selected = institutions.find((i) => i.id === value)
  const filtered = institutions.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) || i.modular_code.includes(search)
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected ? selected.name : "Buscar institución..."}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-2">
            <Input
              placeholder="Escribir para buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No encontrada</p>
            ) : (
              filtered.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => { onChange(i.id); setOpen(false); setSearch("") }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Check className={`h-4 w-4 ${value === i.id ? "opacity-100" : "opacity-0"}`} />
                  <span>{i.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{i.modular_code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [grades, setGrades] = useState<Grade[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Student | null>(null)

  const [form, setForm] = useState(emptyForm)
  const [formStatus, setFormStatus] = useState("active")
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      const res = await fetch(`/api/admin/estudiantes?${params}`)
      const data = await res.json()
      setStudents(data.students || [])
      setTotal(data.total || 0)
    } catch { console.error("Error fetching students") }
    finally { setLoading(false) }
  }, [searchTerm])

  const fetchCatalogs = async () => {
    try {
      const [instRes, levelRes, gradeRes] = await Promise.all([
        fetch("/api/admin/instituciones/catalog"),
        fetch("/api/admin/catalog/levels"),
        fetch("/api/admin/catalog/grades"),
      ])
      if (instRes.ok) setInstitutions((await instRes.json()).institutions || [])
      if (levelRes.ok) setLevels((await levelRes.json()).levels || [])
      if (gradeRes.ok) setGrades((await gradeRes.json()).grades || [])
    } catch { console.error("Error fetching catalogs") }
  }

  useEffect(() => { fetchStudents(); fetchCatalogs() }, [fetchStudents])

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(), 300)
    return () => clearTimeout(timer)
  }, [searchTerm, fetchStudents])

  const resetForm = () => { setForm(emptyForm); setFormStatus("active"); setFormError("") }

  const handleCreate = async () => {
    setFormError("")
    if (!form.firstName || !form.lastName || !form.institutionId) {
      setFormError("Nombre, apellido e institución son requeridos")
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch("/api/admin/estudiantes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setCreateOpen(false); resetForm(); fetchStudents()
    } catch { setFormError("Error de conexión") }
    finally { setFormLoading(false) }
  }

  const handleEdit = async () => {
    if (!selected) return
    setFormError("")
    setFormLoading(true)
    try {
      const res = await fetch(`/api/admin/estudiantes/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: formStatus }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setEditOpen(false); setSelected(null); resetForm(); fetchStudents()
    } catch { setFormError("Error de conexión") }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    setFormLoading(true)
    try {
      const res = await fetch(`/api/admin/estudiantes/${selected.id}`, { method: "DELETE" })
      if (!res.ok) { const d = await res.json(); setFormError(d.error); return }
      setDeleteOpen(false); setSelected(null); fetchStudents()
    } catch { setFormError("Error de conexión") }
    finally { setFormLoading(false) }
  }

  const openEdit = (s: Student) => {
    setSelected(s)
    setFormStatus(s.status)
    setForm({
      firstName: s.first_name, lastName: s.last_name, documentType: s.document_type || "DNI",
      documentNumber: s.document_number || "", dateOfBirth: s.date_of_birth?.split("T")[0] || "",
      gender: s.gender || "", institutionId: s.institution_id, currentLevelId: s.current_level_id || "",
      currentGradeId: s.current_grade_id || "", currentSection: s.current_section || "",
      schoolYear: s.school_year || "2026", guardianName: s.guardian_name || "",
      guardianPhone: s.guardian_phone || "", guardianEmail: s.guardian_email || "", notes: s.notes || "",
    })
    setFormError(""); setEditOpen(true)
  }

  const openView = (s: Student) => { setSelected(s); setViewOpen(true) }
  const openDelete = (s: Student) => { setSelected(s); setDeleteOpen(true) }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Activo" },
      inactive: { variant: "secondary", label: "Inactivo" },
      graduated: { variant: "outline", label: "Graduado" },
    }
    const s = map[status] || { variant: "outline" as const, label: status }
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  const studentForm = (
    <>
      {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Nombre *</Label>
          <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Juan" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Apellido *</Label>
          <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Pérez" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Tipo Doc.</Label>
          <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
            <option value="DNI">DNI</option>
            <option value="CE">Carnet de Extranjería</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">N° Documento</Label>
          <Input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} placeholder="Opcional" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Fecha de Nacimiento</Label>
          <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Género</Label>
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">Seleccionar</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Institución *</Label>
        <InstitutionSelect value={form.institutionId} onChange={(v) => setForm({ ...form, institutionId: v })} institutions={institutions} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Nivel</Label>
          <select value={form.currentLevelId} onChange={(e) => setForm({ ...form, currentLevelId: e.target.value, currentGradeId: "" })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">Seleccionar nivel</option>
            {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Grado</Label>
          <select value={form.currentGradeId} onChange={(e) => setForm({ ...form, currentGradeId: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">Seleccionar grado</option>
            {(form.currentLevelId ? grades.filter((g) => g.level_id === form.currentLevelId) : grades).map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Sección</Label>
          <Input value={form.currentSection} onChange={(e) => setForm({ ...form, currentSection: e.target.value })} placeholder="A, B..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Año Escolar</Label>
          <Input value={form.schoolYear} onChange={(e) => setForm({ ...form, schoolYear: e.target.value })} placeholder="2026" />
        </div>
      </div>
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">Apoderado</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Nombre del Apoderado</Label>
            <Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} placeholder="Nombre completo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Teléfono</Label>
              <Input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} placeholder="999999999" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} placeholder="correo@ejemplo.com" />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Notas</Label>
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones adicionales" />
      </div>
    </>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Estudiantes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{total} estudiantes registrados</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { resetForm(); setCreateOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Estudiante
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Lista de Estudiantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, código, DNI..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : students.length === 0 ? (
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
                    {students.map((s) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4 font-medium font-mono text-xs">{s.code}</td>
                        <td className="p-4">{s.first_name} {s.last_name}</td>
                        <td className="p-4 text-sm">{s.grade_name || "-"}</td>
                        <td className="p-4 text-sm">{s.institution_name || "-"}</td>
                        <td className="p-4">{getStatusBadge(s.status)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Ver" onClick={() => openView(s)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" title="Eliminar" onClick={() => openDelete(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {students.map((s) => (
                  <div key={s.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.code}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(s)}><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDelete(s)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-muted-foreground">{s.grade_name || "Sin grado"}</span>
                      <span>•</span>
                      <span className="text-muted-foreground">{s.institution_name || "Sin institución"}</span>
                    </div>
                    {getStatusBadge(s.status)}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {/* Dialog: Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Estudiante</DialogTitle>
            <DialogDescription>Registrar un nuevo estudiante en el sistema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">{studentForm}</div>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Estudiante</DialogTitle>
            <DialogDescription>Modificar datos del estudiante</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {studentForm}
            <div className="space-y-1.5">
              <Label className="text-sm">Estado</Label>
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
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
            <DialogTitle>Detalle del Estudiante</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-lg">{selected.first_name?.[0]}{selected.last_name?.[0]}</span>
                </div>
                <div>
                  <p className="font-medium">{selected.first_name} {selected.last_name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{selected.code}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Institución:</span><span>{selected.institution_name || "-"}</span>
                <span className="text-muted-foreground">Grado:</span><span>{selected.grade_name || "-"}</span>
                <span className="text-muted-foreground">Nivel:</span><span>{selected.level_name || "-"}</span>
                <span className="text-muted-foreground">Sección:</span><span>{selected.current_section || "-"}</span>
                <span className="text-muted-foreground">Género:</span><span>{selected.gender === "M" ? "Masculino" : selected.gender === "F" ? "Femenino" : "-"}</span>
                <span className="text-muted-foreground">Edad:</span><span>{selected.age || "-"}</span>
                <span className="text-muted-foreground">DNI:</span><span>{selected.document_number || "-"}</span>
                <span className="text-muted-foreground">Año Escolar:</span><span>{selected.school_year || "-"}</span>
                <span className="text-muted-foreground">Estado:</span><span>{getStatusBadge(selected.status)}</span>
                {selected.guardian_name && <><span className="text-muted-foreground">Apoderado:</span><span>{selected.guardian_name}</span></>}
                {selected.guardian_phone && <><span className="text-muted-foreground">Tel. Apoderado:</span><span>{selected.guardian_phone}</span></>}
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
            <DialogTitle>Eliminar Estudiante</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar a <strong>{selected?.first_name} {selected?.last_name}</strong>?
              Esta acción eliminará también evaluaciones, informes y citas asociadas.
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