"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PsychologistSettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Configuración</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Mi perfil y configuración</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Datos Personales</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Información de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Nombre</Label>
              <Input defaultValue="Ana" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Apellido</Label>
              <Input defaultValue="Martínez López" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Email</Label>
            <Input defaultValue="psicologo@tdah.com" disabled />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Teléfono</Label>
            <Input defaultValue="988888888" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Especialidad</Label>
            <Input defaultValue="Psicología Clínica" />
          </div>
          <Button>Guardar Cambios</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Cambiar Contraseña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Contraseña Actual</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Nueva Contraseña</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Confirmar Contraseña</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <Button>Actualizar Contraseña</Button>
        </CardContent>
      </Card>
    </div>
  )
}