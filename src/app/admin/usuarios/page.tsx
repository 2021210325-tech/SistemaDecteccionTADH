"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, Edit, Trash2, Eye, Shield, Loader2, X } from "lucide-react"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  roles: string[]
  is_active: boolean
  created_at: string
  last_login_at?: string
  phone?: string
  specialization?: string
  license_number?: string
  institution_id?: string
}

const ROLES = [
  { value: "ADMIN_GENERAL", label: "Administrador General" },
  { value: "PSICOLOGO", label: "Psicólogo" },
  { value: "ENTIDAD_GOBIERNO", label: "Entidad Gubernamental" },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [formData, setFormData] = useState({
    email: "", password: "", firstName: "", lastName: "", role: "ADMIN_GENERAL",
    phone: "", specialization: "", licenseNumber: "",
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      const res = await fetch(`/api/admin/usuarios?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch {
      console.error("Error fetching users")
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300)
    return () => clearTimeout(timer)
  }, [searchTerm, fetchUsers])

  const resetForm = () => {
    setFormData({ email: "", password: "", firstName: "", lastName: "", role: "ADMIN_GENERAL", phone: "", specialization: "", licenseNumber: "" })
    setFormError("")
  }

  const handleCreate = async () => {
    setFormError("")
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setFormError("Email, contraseña, nombre y apellido son requeridos")
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setCreateOpen(false)
      resetForm()
      fetchUsers()
    } catch { setFormError("Error de conexión") }
    finally { setFormLoading(false) }
  }

  const handleEdit = async () => {
    if (!selectedUser) return
    setFormError("")
    if (!formData.firstName || !formData.lastName) {
      setFormError("Nombre y apellido son requeridos")
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setEditOpen(false)
      setSelectedUser(null)
      resetForm()
      fetchUsers()
    } catch { setFormError("Error de conexión") }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setFormLoading(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${selectedUser.id}`, { method: "DELETE" })
      if (!res.ok) { const d = await res.json(); setFormError(d.error); return }
      setDeleteOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch { setFormError("Error de conexión") }
    finally { setFormLoading(false) }
  }

  const handleToggleActive = async (user: User) => {
    try {
      await fetch(`/api/admin/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.is_active }),
      })
      fetchUsers()
    } catch { console.error("Error toggling user") }
  }

  const openEdit = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email, password: "", firstName: user.first_name, lastName: user.last_name,
      role: user.roles[0] || "ADMIN_GENERAL", phone: user.phone || "",
      specialization: user.specialization || "", licenseNumber: user.license_number || "",
    })
    setFormError("")
    setEditOpen(true)
  }

  const openView = (user: User) => { setSelectedUser(user); setViewOpen(true) }
  const openDelete = (user: User) => { setSelectedUser(user); setDeleteOpen(true) }

  const getRoleBadge = (role: string, key?: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      ADMIN_GENERAL: { variant: "destructive", label: "Admin General" },
      PSICOLOGO: { variant: "default", label: "Psicólogo" },
      ENTIDAD_GOBIERNO: { variant: "secondary", label: "Entidad" },
    }
    const r = map[role] || { variant: "outline" as const, label: role }
    return <Badge key={key} variant={r.variant}>{r.label}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Usuarios</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{total} usuarios registrados</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { resetForm(); setCreateOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por email, nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No se encontraron usuarios</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Email</th>
                      <th className="h-10 px-4 text-left font-medium">Nombre</th>
                      <th className="h-10 px-4 text-left font-medium">Rol</th>
                      <th className="h-10 px-4 text-left font-medium">Estado</th>
                      <th className="h-10 px-4 text-left font-medium">Último Acceso</th>
                      <th className="h-10 px-4 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4 font-medium">{user.email}</td>
                        <td className="p-4">{user.first_name} {user.last_name}</td>
                        <td className="p-4">{user.roles.map((r) => getRoleBadge(r, r))}</td>
                        <td className="p-4">
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Nunca"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Ver" onClick={() => openView(user)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Activar/Desactivar" onClick={() => handleToggleActive(user)}>
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Eliminar" onClick={() => openDelete(user)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(user)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDelete(user)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((r) => getRoleBadge(r, r))}
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Crear Usuario */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>Crear un nuevo usuario en el sistema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Nombre *</Label>
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="Juan" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Apellido *</Label>
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Pérez" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="correo@ejemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Contraseña *</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Rol *</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Teléfono</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Opcional" />
            </div>
            {formData.role === "PSICOLOGO" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm">Especialidad</Label>
                  <Input value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="Ej: Psicología Clínica" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">N° Licencia</Label>
                  <Input value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} placeholder="Opcional" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Usuario */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modificar datos del usuario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Nombre *</Label>
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Apellido *</Label>
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Nueva Contraseña (dejar vacío para no cambiar)</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Dejar vacío si no desea cambiar" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Rol</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Teléfono</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            {formData.role === "PSICOLOGO" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm">Especialidad</Label>
                  <Input value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">N° Licencia</Label>
                  <Input value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Usuario */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del Usuario</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-lg">{selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}</span>
                </div>
                <div>
                  <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Rol:</span></div>
                <div className="flex gap-1">{selectedUser.roles.map((r) => getRoleBadge(r, r))}</div>
                <div><span className="text-muted-foreground">Estado:</span></div>
                <div><Badge variant={selectedUser.is_active ? "default" : "secondary"}>{selectedUser.is_active ? "Activo" : "Inactivo"}</Badge></div>
                <div><span className="text-muted-foreground">Creado:</span></div>
                <div>{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                <div><span className="text-muted-foreground">Último acceso:</span></div>
                <div>{selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString() : "Nunca"}</div>
                {selectedUser.phone && <><div><span className="text-muted-foreground">Teléfono:</span></div><div>{selectedUser.phone}</div></>}
                {selectedUser.specialization && <><div><span className="text-muted-foreground">Especialidad:</span></div><div>{selectedUser.specialization}</div></>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Cerrar</Button>
            {selectedUser && (
              <Button onClick={() => { setViewOpen(false); openEdit(selectedUser) }}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Eliminación */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar a <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
              Esta acción no se puede deshacer.
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