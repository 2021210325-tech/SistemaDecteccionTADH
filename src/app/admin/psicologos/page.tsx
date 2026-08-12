"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"

interface Psychologist {
  id: string
  firstName: string
  lastName: string
  email: string
  specialization: string
  institution: string
  status: string
}

export default function PsychologistsPage() {
  const [psychologists, setPsychologists] = useState<Psychologist[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setPsychologists([
      { id: "1", firstName: "Ana", lastName: "Martínez López", email: "ana.martinez@correo.com", specialization: "Psicología Clínica", institution: "I.E. 33356", status: "active" },
      { id: "2", firstName: "Roberto", lastName: "Sánchez García", email: "roberto.sanchez@correo.com", specialization: "Psicología Educacional", institution: "I.E. 33356", status: "active" },
    ])
  }, [])

  const filteredPsychologists = psychologists.filter(
    (psych) =>
      psych.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psych.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psych.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Psicólogos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestión de psicólogos registrados en el sistema</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Psicólogo
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Lista de Psicólogos</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{psychologists.length} psicólogos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          <div className="hidden md:block rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium">Nombre</th>
                  <th className="h-10 px-4 text-left font-medium">Email</th>
                  <th className="h-10 px-4 text-left font-medium">Especialidad</th>
                  <th className="h-10 px-4 text-left font-medium">Institución</th>
                  <th className="h-10 px-4 text-left font-medium">Estado</th>
                  <th className="h-10 px-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPsychologists.map((psych) => (
                  <tr key={psych.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{psych.firstName} {psych.lastName}</td>
                    <td className="p-4">{psych.email}</td>
                    <td className="p-4">{psych.specialization}</td>
                    <td className="p-4">{psych.institution}</td>
                    <td className="p-4">
                      <Badge variant={psych.status === "active" ? "default" : "secondary"}>
                        {psych.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filteredPsychologists.map((psych) => (
              <div key={psych.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{psych.firstName} {psych.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{psych.email}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">{psych.specialization}</span>
                  <span>•</span>
                  <span className="text-muted-foreground">{psych.institution}</span>
                </div>
                <Badge variant={psych.status === "active" ? "default" : "secondary"} className="w-fit">
                  {psych.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}