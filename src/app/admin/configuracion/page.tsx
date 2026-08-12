"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Configuración</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Configuración general del sistema</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex h-auto sm:h-10">
          <TabsTrigger value="general" className="text-xs sm:text-sm">General</TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">Seguridad</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notificaciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Información del Sistema</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configuración general de la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name" className="text-sm">Nombre de la Aplicación</Label>
                  <Input id="app-name" defaultValue="TDAH System" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-url" className="text-sm">URL de la Aplicación</Label>
                  <Input id="app-url" defaultValue="http://localhost:3000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-year" className="text-sm">Año Escolar Actual</Label>
                  <Input id="school-year" defaultValue="2026" />
                </div>
              </div>
              <Button className="w-full sm:w-auto">Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Configuración de Seguridad</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Opciones de seguridad y autenticación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Autenticación de Dos Factores</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Requerir 2FA para administradores</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Bloqueo de Cuenta</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Bloquear cuenta después de 5 intentos fallidos</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timeout" className="text-sm">Tiempo de Expiración de Sesión (minutos)</Label>
                <Input id="session-timeout" type="number" defaultValue="60" />
              </div>
              <Button className="w-full sm:w-auto">Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Configuración de Notificaciones</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Preferencias de notificaciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Notificaciones por Email</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Enviar notificaciones importantes por correo</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Notificaciones de Evaluaciones</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Notificar cuando se complete una evaluación</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Notificaciones de Citas</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Recordar citas próximas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button className="w-full sm:w-auto">Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}