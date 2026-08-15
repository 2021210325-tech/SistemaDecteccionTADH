"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Plus, Trash2 } from "lucide-react"

interface CollateralSource {
  id: string; code: string; name: string
}

interface CollateralEntry {
  sourceId: string; sourceName: string; relationship: string
  informationDate: string; content: string; observations: string
}

interface DysfunctionArea {
  area: string; description: string
}

interface CriterionData {
  present: boolean | null
  description: string
}

interface Part3Data {
  symptomOnset: {
    presentSinceChildhood: boolean | null
    approximateAge: string
    sources: string
    observations: string
  }
  dysfunction: {
    current: DysfunctionArea[]
    childhood: DysfunctionArea[]
  }
  criteriaB: CriterionData
  criteriaC: CriterionData
  criteriaD: CriterionData
  criteriaE: CriterionData
  collateralInfo: CollateralEntry[]
}

interface Part3SectionProps {
  evaluationId: string
  onSave: (data: Part3Data) => Promise<void>
  initialData?: Partial<Part3Data>
}

const dysfunctionAreas = [
  "Educación/Trabajo",
  "Relaciones/Vida familiar",
  "Contactos sociales",
  "Actividades de ocio",
  "Seguridad en sí mismo/Autoimagen",
  "Otras áreas"
]

export function Part3Section({ evaluationId, onSave, initialData }: Part3SectionProps) {
  const [sources, setSources] = useState<CollateralSource[]>([])
  const [data, setData] = useState<Part3Data>({
    symptomOnset: initialData?.symptomOnset || { presentSinceChildhood: null, approximateAge: "", sources: "", observations: "" },
    dysfunction: initialData?.dysfunction || { current: dysfunctionAreas.map((a) => ({ area: a, description: "" })), childhood: dysfunctionAreas.map((a) => ({ area: a, description: "" })) },
    criteriaB: initialData?.criteriaB || { present: null, description: "" },
    criteriaC: initialData?.criteriaC || { present: null, description: "" },
    criteriaD: initialData?.criteriaD || { present: null, description: "" },
    criteriaE: initialData?.criteriaE || { present: null, description: "" },
    collateralInfo: initialData?.collateralInfo || []
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/collateral-sources").then((r) => r.json()).then((d) => setSources(d.sources || [])).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(data) } finally { setSaving(false) }
  }

  const addCollateralEntry = () => {
    setData((prev) => ({
      ...prev,
      collateralInfo: [...prev.collateralInfo, { sourceId: "", sourceName: "", relationship: "", informationDate: "", content: "", observations: "" }]
    }))
  }

  const removeCollateralEntry = (index: number) => {
    setData((prev) => ({
      ...prev,
      collateralInfo: prev.collateralInfo.filter((_, i) => i !== index)
    }))
  }

  const updateCollateral = (index: number, field: keyof CollateralEntry, value: string | null) => {
    setData((prev) => ({
      ...prev,
      collateralInfo: prev.collateralInfo.map((entry, i) => i === index ? { ...entry, [field]: value || "" } : entry)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Inicio de síntomas */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Inicio de Síntomas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>¿Los síntomas estuvieron presentes desde la infancia?</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="onset-yes" checked={data.symptomOnset.presentSinceChildhood === true}
                  onCheckedChange={() => setData((p) => ({ ...p, symptomOnset: { ...p.symptomOnset, presentSinceChildhood: true } }))} />
                <Label htmlFor="onset-yes">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="onset-no" checked={data.symptomOnset.presentSinceChildhood === false}
                  onCheckedChange={() => setData((p) => ({ ...p, symptomOnset: { ...p.symptomOnset, presentSinceChildhood: false } }))} />
                <Label htmlFor="onset-no">No</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Edad aproximada de inicio</Label>
            <Input value={data.symptomOnset.approximateAge} onChange={(e) => setData((p) => ({ ...p, symptomOnset: { ...p.symptomOnset, approximateAge: e.target.value } }))} placeholder="Ej: 7 años" />
          </div>
          <div className="space-y-2">
            <Label>Fuentes de información</Label>
            <Input value={data.symptomOnset.sources} onChange={(e) => setData((p) => ({ ...p, symptomOnset: { ...p.symptomOnset, sources: e.target.value } }))} placeholder="Ej: Padres, informes escolares" />
          </div>
          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea value={data.symptomOnset.observations} onChange={(e) => setData((p) => ({ ...p, symptomOnset: { ...p.symptomOnset, observations: e.target.value } }))} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Disfunción */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Áreas de Disfunción</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-medium">Etapa Actual</Label>
            <div className="space-y-3 mt-2">
              {data.dysfunction.current.map((area, idx) => (
                <div key={idx} className="space-y-1">
                  <Label className="text-sm text-muted-foreground">{area.area}</Label>
                  <Textarea value={area.description} onChange={(e) => {
                    const newCurrent = [...data.dysfunction.current]
                    newCurrent[idx] = { ...newCurrent[idx], description: e.target.value }
                    setData((p) => ({ ...p, dysfunction: { ...p.dysfunction, current: newCurrent } }))
                  }} rows={1} placeholder="Describir nivel de afectación..." />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="font-medium">Infancia</Label>
            <div className="space-y-3 mt-2">
              {data.dysfunction.childhood.map((area, idx) => (
                <div key={idx} className="space-y-1">
                  <Label className="text-sm text-muted-foreground">{area.area}</Label>
                  <Textarea value={area.description} onChange={(e) => {
                    const newChildhood = [...data.dysfunction.childhood]
                    newChildhood[idx] = { ...newChildhood[idx], description: e.target.value }
                    setData((p) => ({ ...p, dysfunction: { ...p.dysfunction, childhood: newChildhood } }))
                  }} rows={1} placeholder="Describir nivel de afectación..." />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criterios B, C, D, E */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Criterios Adicionales</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "B" as const, label: "Criterio B", desc: "Presencia de un patrón de síntomas y limitaciones a lo largo de la vida" },
            { key: "C" as const, label: "Criterio C", desc: "Presencia de síntomas en diferentes etapas" },
            { key: "D" as const, label: "Criterio D", desc: "Manifestación en diferentes ámbitos de la vida" },
            { key: "E" as const, label: "Criterio E", desc: "Valorar explicaciones alternativas" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="space-y-2">
              <Label className="font-medium">{label} - {desc}</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={data[`criteria${key}`].present === true}
                    onCheckedChange={() => setData((p) => ({ ...p, [`criteria${key}`]: { ...p[`criteria${key}`], present: true } }))} />
                  <Label>Sí</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={data[`criteria${key}`].present === false}
                    onCheckedChange={() => setData((p) => ({ ...p, [`criteria${key}`]: { ...p[`criteria${key}`], present: false } }))} />
                  <Label>No</Label>
                </div>
              </div>
              <Textarea value={data[`criteria${key}`].description}
                onChange={(e) => setData((p) => ({ ...p, [`criteria${key}`]: { ...p[`criteria${key}`], description: e.target.value } }))}
                rows={2} placeholder="Descripción..." />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Información colateral */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Información Colateral</CardTitle>
          <Button size="sm" variant="outline" onClick={addCollateralEntry}><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.collateralInfo.length === 0 && <p className="text-sm text-muted-foreground">Sin información colateral registrada</p>}
          {data.collateralInfo.map((entry, idx) => (
            <div key={idx} className="p-3 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <Badge variant="outline">Fuente {idx + 1}</Badge>
                <Button variant="ghost" size="icon" onClick={() => removeCollateralEntry(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Fuente</Label>
                  <Select value={entry.sourceId} onValueChange={(v) => updateCollateral(idx, "sourceId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input value={entry.sourceName} onChange={(e) => updateCollateral(idx, "sourceName", e.target.value)} placeholder="Nombre" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Relación</Label>
                  <Input value={entry.relationship} onChange={(e) => updateCollateral(idx, "relationship", e.target.value)} placeholder="Ej: Madre, Profesor" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha</Label>
                  <Input type="date" value={entry.informationDate} onChange={(e) => updateCollateral(idx, "informationDate", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Información</Label>
                <Textarea value={entry.content} onChange={(e) => updateCollateral(idx, "content", e.target.value)} rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Observaciones</Label>
                <Input value={entry.observations} onChange={(e) => updateCollateral(idx, "observations", e.target.value)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Guardar Parte 3
      </Button>
    </div>
  )
}