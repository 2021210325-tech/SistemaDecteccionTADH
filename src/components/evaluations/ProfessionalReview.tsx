"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, FileText, ArrowLeft } from "lucide-react"

interface EvaluationData {
  id: string; status: string
  student: { firstName: string; lastName: string; code: string; dateOfBirth: string; institutionName: string }
  test: { name: string; version: string }
  results: {
    inattention: { current: number; childhood: number }
    hyperactivity: { current: number; childhood: number }
    overallResult: string
  }
  answers: { questionCode: string; context: string; optionText: string }[]
  observations: { questionCode: string; observation: string }[]
  collateralInfo: { sourceName: string; content: string }[]
}

interface ProfessionalReviewProps {
  evaluation: EvaluationData
  onComplete: (conclusion: string, recommendations: string) => Promise<void>
  onBack: () => void
}

export function ProfessionalReview({ evaluation, onComplete, onBack }: ProfessionalReviewProps) {
  const [conclusion, setConclusion] = useState("")
  const [recommendations, setRecommendations] = useState("")
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleComplete = async () => {
    setSaving(true)
    try {
      await onComplete(conclusion, recommendations)
      setCompleted(true)
    } finally { setSaving(false) }
  }

  if (completed) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Evaluación finalizada correctamente. El informe ha sido generado.</AlertDescription>
        </Alert>
        <Button onClick={onBack}>Volver a evaluaciones</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <h2 className="text-xl font-bold">Revisión Profesional</h2>
      </div>

      {/* Resumen de datos */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Datos del Evaluado</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Estudiante:</span><span>{evaluation.student.firstName} {evaluation.student.lastName}</span>
            <span className="text-muted-foreground">Código:</span><span className="font-mono">{evaluation.student.code}</span>
            <span className="text-muted-foreground">Institución:</span><span>{evaluation.student.institutionName}</span>
            <span className="text-muted-foreground">Instrumento:</span><span>{evaluation.test.name}</span>
            <span className="text-muted-foreground">Resultado:</span>
            <span><Badge variant={evaluation.results.overallResult !== "No cumple criterios" ? "default" : "outline"}>
              {evaluation.results.overallResult}
            </Badge></span>
          </div>
        </CardContent>
      </Card>

      {/* Resultados numéricos */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Criterios Sintomáticos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Déficit de Atención:</p>
              <p>Actual: <span className="font-bold">{evaluation.results.inattention.current}/9</span></p>
              <p>Infancia: <span className="font-bold">{evaluation.results.inattention.childhood}/9</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Hiperactividad/Impulsividad:</p>
              <p>Actual: <span className="font-bold">{evaluation.results.hyperactivity.current}/9</span></p>
              <p>Infancia: <span className="font-bold">{evaluation.results.hyperactivity.childhood}/9</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conclusión profesional */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Conclusión Profesional</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Conclusión clínica</Label>
            <Textarea value={conclusion} onChange={(e) => setConclusion(e.target.value)} rows={5}
              placeholder="Escriba su conclusión profesional basada en los resultados del instrumento y su valoración clínica..." />
          </div>
          <div className="space-y-2">
            <Label>Recomendaciones</Label>
            <Textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={4}
              placeholder="Recomendaciones para el estudiante, la familia y la institución educativa..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>Volver</Button>
        <Button onClick={handleComplete} disabled={saving || !conclusion}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Finalizar y Generar Informe
        </Button>
      </div>
    </div>
  )
}