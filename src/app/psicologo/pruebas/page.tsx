"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText, CheckCircle2, ArrowRight, Info, Play } from "lucide-react"

interface Test {
  id: string; code: string; name: string; description: string
  population: string; min_age: number | null; max_age: number | null
  versions: { id: string; version: string; is_current: boolean; parts: { id: string; code: string; name: string }[] }[]
}

interface Student {
  id: string; code: string; first_name: string; last_name: string
  date_of_birth: string | null; institution_name: string
}

export default function PruebasPage() {
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [studentSearch, setStudentSearch] = useState("")
  const [error, setError] = useState("")
  const [starting, setStarting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [testRes, stRes] = await Promise.all([
        fetch("/api/admin/tests"),
        fetch("/api/admin/estudiantes"),
      ])
      if (testRes.ok) setTests((await testRes.json()).tests || [])
      if (stRes.ok) setStudents((await stRes.json()).students || [])
    } catch { console.error("Error fetching data") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openDetail = (test: Test) => { setSelectedTest(test); setDetailOpen(true) }

  const openStart = (test: Test) => {
    setSelectedTest(test); setSelectedStudent(""); setStudentSearch(""); setError(""); setStartOpen(true)
  }

  const handleStart = async () => {
    if (!selectedTest || !selectedStudent) { setError("Selecciona un estudiante"); return }
    setStarting(true); setError("")
    try {
      const res = await fetch("/api/evaluations/engine/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: selectedTest.id, studentId: selectedStudent }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setStartOpen(false)
      router.push(`/psicologo/evaluacion-diva?evaluationId=${data.evaluation.id}&testId=${selectedTest.id}`)
    } catch { setError("Error de conexión") }
    finally { setStarting(false) }
  }

  const filteredStudents = students.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.code}`.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const getPopulationBadge = (test: Test) => {
    if (test.code === "DIVA5") return <Badge variant="default">Adultos (18+)</Badge>
    if (test.code === "YOUNG_DIVA5") return <Badge variant="secondary">Niños/Adolescentes (5-17)</Badge>
    if (test.min_age && test.max_age) return <Badge variant="outline">{test.min_age}-{test.max_age} años</Badge>
    return <Badge variant="outline">{test.population || "General"}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Pruebas</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Instrumentos de evaluación psicológica disponibles</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : tests.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hay pruebas disponibles</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card key={test.id} className="hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{test.name}</CardTitle>
                      <CardDescription className="text-xs">{test.code}</CardDescription>
                    </div>
                  </div>
                  {getPopulationBadge(test)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{test.description || "Sin descripción"}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => openStart(test)}>
                    <Play className="h-4 w-4 mr-1" /> Iniciar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetail(test)}>
                    <Info className="h-4 w-4 mr-1" /> Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Iniciar evaluación */}
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Iniciar Evaluación</DialogTitle>
            <DialogDescription>{selectedTest?.name} — Seleccionar estudiante</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-2">
              <Label>Buscar estudiante</Label>
              <Input placeholder="Nombre, apellido o código..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No se encontraron estudiantes</p>
              ) : (
                filteredStudents.map((s) => (
                  <div key={s.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedStudent === s.id ? "border-primary bg-primary/5" : "hover:border-muted-foreground/50"}`}
                    onClick={() => setSelectedStudent(s.id)}
                  >
                    <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-muted-foreground">{s.code} • {s.institution_name}</p>
                    {s.date_of_birth && (
                      <p className="text-xs text-muted-foreground">
                        Edad: {Math.floor((Date.now() - new Date(s.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} años
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)}>Cancelar</Button>
            <Button onClick={handleStart} disabled={!selectedStudent || starting}>
              {starting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Iniciar Evaluación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalles */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedTest?.name}
            </DialogTitle>
            <DialogDescription>{selectedTest?.code}</DialogDescription>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Código:</span> <span className="font-mono">{selectedTest.code}</span></div>
                <div><span className="text-muted-foreground">Población:</span> {getPopulationBadge(selectedTest)}</div>
                {selectedTest.min_age && <div><span className="text-muted-foreground">Edad mínima:</span> {selectedTest.min_age} años</div>}
                {selectedTest.max_age && <div><span className="text-muted-foreground">Edad máxima:</span> {selectedTest.max_age} años</div>}
              </div>
              <div>
                <p className="text-sm font-medium">Descripción</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedTest.description || "Sin descripción"}</p>
              </div>
              {selectedTest.versions?.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Versiones</p>
                  <div className="space-y-2 mt-2">
                    {selectedTest.versions.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Badge variant={v.is_current ? "default" : "outline"}>v{v.version}</Badge>
                          {v.is_current && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </div>
                        <span className="text-xs text-muted-foreground">{v.parts?.length || 0} partes</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(selectedTest.code === "DIVA5" || selectedTest.code === "YOUNG_DIVA5") && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Estructura del Instrumento</span>
                  </div>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-6">
                    <li>• Parte 1: Déficit de Atención (A1a-A1i) — 9 criterios</li>
                    <li>• Parte 2: Hiperactividad/Impulsividad (A2a-A2i) — 9 criterios</li>
                    <li>• Parte 3: Inicio, Disfunción, Criterios B-E, Información Colateral</li>
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cerrar</Button>
            <Button onClick={() => { setDetailOpen(false); openStart(selectedTest!) }}>Iniciar Evaluación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}