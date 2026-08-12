"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"

interface Institution {
  id: string
  modularCode: string
  name: string
  district: string
  level: string
  status: string
}

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setInstitutions([
      { id: "1", modularCode: "33356", name: "I.E. Estatal N.° 33356", district: "Amarilis", level: "Primaria", status: "active" },
      { id: "2", modularCode: "33357", name: "I.E. José Carlos Mariátegui", district: "Amarilis", level: "Secundaria", status: "active" },
    ])
  }, [])

  const filteredInstitutions = institutions.filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.modularCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.district.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Instituciones Educativas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestión de instituciones educativas registradas</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Institución
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Lista de Instituciones</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{institutions.length} instituciones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, código modular, distrito..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          <div className="hidden md:block rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium">Código Modular</th>
                  <th className="h-10 px-4 text-left font-medium">Nombre</th>
                  <th className="h-10 px-4 text-left font-medium">Distrito</th>
                  <th className="h-10 px-4 text-left font-medium">Nivel</th>
                  <th className="h-10 px-4 text-left font-medium">Estado</th>
                  <th className="h-10 px-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstitutions.map((inst) => (
                  <tr key={inst.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{inst.modularCode}</td>
                    <td className="p-4">{inst.name}</td>
                    <td className="p-4">{inst.district}</td>
                    <td className="p-4">{inst.level}</td>
                    <td className="p-4">
                      <Badge variant={inst.status === "active" ? "default" : "secondary"}>
                        {inst.status === "active" ? "Activa" : "Inactiva"}
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
            {filteredInstitutions.map((inst) => (
              <div key={inst.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{inst.name}</p>
                    <p className="text-xs text-muted-foreground">Cód. {inst.modularCode}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">{inst.district}</span>
                  <span>•</span>
                  <span className="text-muted-foreground">{inst.level}</span>
                </div>
                <Badge variant={inst.status === "active" ? "default" : "secondary"} className="w-fit">
                  {inst.status === "active" ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}