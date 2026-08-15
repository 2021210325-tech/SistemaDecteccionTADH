"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Loader2, FileText, CheckCircle2, ArrowRight, Info } from "lucide-react"

interface Test {
  id: string; code: string; name: string; description: string
  population: string; min_age: number | null; max_age: number | null
  versions: { id: string; version: string; is_current: boolean; parts: { id: string; code: string; name: string }[] }[]
}

export default function AdminPruebasPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/tests")
      if (res.ok) {
        const data = await res.json()
        setTests(data.tests || [])
      }
    } catch { console.error("Error fetching tests") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTests() }, [fetchTests])

  const openDetail = (test: Test) => { setSelectedTest(test); setDetailOpen(true) }

  const getPopulationBadge = (test: Test) => {
    if (test.code === "DIVA5") return <Badge variant="default">Adultos (18+)</Badge>
    if (test.code === "YOUNG_DIVA5") return <Badge variant="secondary">Niños/Adolescentes (5-17)</Badge>
    if (test.min_age && test.max_age) return <Badge variant="outline">{test.min_age}-{test.max_age} años</Badge>
    if (test.min_age) return <Badge variant="outline">{test.min_age}+ años</Badge>
    return <Badge variant="outline">{test.population || "General"}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Pruebas</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Instrumentos de evaluación psicológica configurados en el sistema</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : tests.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hay pruebas configuradas</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Card key={test.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => openDetail(test)}>
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
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {test.versions?.length || 0} versión(es) • {test.versions?.[0]?.parts?.length || 0} partes
                  </span>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDetail(test) }}>
                    Ver más <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                <p className="text-sm text-muted-foreground mt-1">{selectedTest.description || "Sin descripción disponible"}</p>
              </div>

              {selectedTest.versions && selectedTest.versions.length > 0 && (
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}