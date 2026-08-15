"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function PsychologistSettingsPage() {
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", phone: "", specialization: "" })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState("")
  const [profileError, setProfileError] = useState("")

  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/psicologo/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          specialization: data.specialization || "",
        })
      }
    } catch { console.error("Error fetching profile") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleSaveProfile = async () => {
    setProfileError(""); setProfileSuccess("")
    if (!profile.firstName || !profile.lastName) {
      setProfileError("Nombre y apellido son requeridos"); return
    }
    setSavingProfile(true)
    try {
      const res = await fetch("/api/psicologo/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!res.ok) { setProfileError(data.error); return }
      setProfileSuccess("Perfil actualizado correctamente")
      setTimeout(() => setProfileSuccess(""), 3000)
    } catch { setProfileError("Error de conexión") }
    finally { setSavingProfile(false) }
  }

  const handleChangePassword = async () => {
    setPasswordError(""); setPasswordSuccess("")
    if (!passwords.current || !passwords.new) {
      setPasswordError("Complete todos los campos"); return
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError("Las contraseñas nuevas no coinciden"); return
    }
    if (passwords.new.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres"); return
    }
    setSavingPassword(true)
    try {
      const res = await fetch("/api/psicologo/password", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new }),
      })
      const data = await res.json()
      if (!res.ok) { setPasswordError(data.error); return }
      setPasswordSuccess("Contraseña actualizada correctamente")
      setPasswords({ current: "", new: "", confirm: "" })
      setTimeout(() => setPasswordSuccess(""), 3000)
    } catch { setPasswordError("Error de conexión") }
    finally { setSavingPassword(false) }
  }

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
          {profileSuccess && <Alert><AlertDescription>{profileSuccess}</AlertDescription></Alert>}
          {profileError && <Alert variant="destructive"><AlertDescription>{profileError}</AlertDescription></Alert>}
          {loading ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Nombre</Label>
                  <Input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Apellido</Label>
                  <Input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Email</Label>
                <Input value={profile.email} disabled />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Teléfono</Label>
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Especialidad</Label>
                <Input value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} placeholder="Opcional" />
              </div>
              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar Cambios
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Cambiar Contraseña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordSuccess && <Alert><AlertDescription>{passwordSuccess}</AlertDescription></Alert>}
          {passwordError && <Alert variant="destructive"><AlertDescription>{passwordError}</AlertDescription></Alert>}
          <div className="space-y-1.5">
            <Label className="text-sm">Contraseña Actual</Label>
            <Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Nueva Contraseña</Label>
            <Input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Confirmar Contraseña</Label>
            <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="••••••••" />
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword}>
            {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Actualizar Contraseña
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}