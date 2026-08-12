"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Loader2 } from "lucide-react"

interface Student {
  id: string
  code: string
  first_name: string
  last_name: string
  institution_name: string
  grade_name: string
  status: string
}

export default function PsychologistStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setStudents([
      { id: "1", code: "EST33356-001", first_name: "Juan", last_name: "Pérez García", institution_name: "I.E. 33356", grade_name: "3° Primaria", status: "active" },
      { id: "2", code: "EST33356-002", first_name: "María", last_name: "López Ramírez", institution_name: "I.E. 33356", grade_name: "4° Primaria", status: "active" },
      { id: "3", code: "EST33356-003", first_name: "Carlos", last_name: "Mendoza Silva", institution_name: "I.E. 33356", grade_name: "2° Primaria", status: "active" },
    ])
    setLoading(false)
  }, [])

  const filtered = students.filter((s) =>
    s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
                        <td className="p-4">{s.grade_name}</td>
                        <td className="p-4">{s.institution_name}</td>
                        <td className="p-4"><Badge variant="default">Activo</Badge></td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon" title="Ver"><Eye className="h-4 w-4" /></Button>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3 w-3" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-muted-foreground">{s.grade_name}</span>
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
    </div>
  )
}