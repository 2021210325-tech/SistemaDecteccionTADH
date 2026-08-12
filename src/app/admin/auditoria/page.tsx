"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuditLog {
  id: string
  user: string
  action: string
  module: string
  details: string
  ipAddress: string
  timestamp: string
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setLogs([
      { id: "1", user: "admin@correo.com", action: "LOGIN", module: "Auth", details: "Inicio de sesión exitoso", ipAddress: "192.168.1.1", timestamp: "2026-08-10 10:30:00" },
      { id: "2", user: "ana.martinez@correo.com", action: "CREATE", module: "Evaluaciones", details: "Creó evaluación para estudiante Juan Pérez", ipAddress: "192.168.1.2", timestamp: "2026-08-10 10:45:00" },
      { id: "3", user: "admin@correo.com", action: "UPDATE", module: "Usuarios", details: "Actualizó perfil de psicólogo Roberto Sánchez", ipAddress: "192.168.1.1", timestamp: "2026-08-10 11:00:00" },
    ])
  }, [])

  const filteredLogs = logs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      LOGIN: "default", LOGOUT: "secondary", CREATE: "default", UPDATE: "secondary", DELETE: "destructive", VIEW: "outline", DOWNLOAD: "outline",
    }
    return <Badge variant={variants[action] || "default"}>{action}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Auditoría</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Registro de actividades del sistema</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Exportar Logs
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Registro de Actividad</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Historial de acciones realizadas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por usuario, acción, módulo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          <div className="hidden md:block rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium">Usuario</th>
                  <th className="h-10 px-4 text-left font-medium">Acción</th>
                  <th className="h-10 px-4 text-left font-medium">Módulo</th>
                  <th className="h-10 px-4 text-left font-medium">Detalles</th>
                  <th className="h-10 px-4 text-left font-medium">IP</th>
                  <th className="h-10 px-4 text-left font-medium">Fecha/Hora</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{log.user}</td>
                    <td className="p-4">{getActionBadge(log.action)}</td>
                    <td className="p-4">{log.module}</td>
                    <td className="p-4">{log.details}</td>
                    <td className="p-4 font-mono text-sm">{log.ipAddress}</td>
                    <td className="p-4">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-sm">{log.user}</p>
                  {getActionBadge(log.action)}
                </div>
                <p className="text-xs text-muted-foreground">{log.details}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{log.module} • {log.ipAddress}</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}