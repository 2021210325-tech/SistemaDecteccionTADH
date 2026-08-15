"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react"

interface Question {
  id: string; code: string; context: string; text: string
  questionType: string; required: boolean
  allowsExamples: boolean; allowsObservation: boolean
  options: { id: string; code: string; text: string; value: number; score: number }[]
  examples: { id: string; text: string; score: number }[]
}

interface Criterion {
  id: string; code: string; number: number; name: string
  officialText: string; description?: string
  questions: Question[]
}

interface Domain {
  id: string; code: string; name: string; description?: string
  criteria: Criterion[]
}

interface Part {
  id: string; code: string; name: string; description?: string; order: number
  domains: Domain[]
}

interface AnswerState {
  optionId?: string; textAnswer?: string; numericValue?: number
  booleanValue?: boolean; examples: { exampleId: string; selected: boolean; observation?: string }[]
  observation?: string
}

interface QuestionRendererProps {
  question: Question
  criterion: Criterion
  part: Part
  answer?: AnswerState
  onSave: (questionId: string, answer: AnswerState) => Promise<void>
  progress?: { answered: number; total: number }
}

export function QuestionRenderer({ question, criterion, part, answer, onSave, progress }: QuestionRendererProps) {
  const [selectedOption, setSelectedOption] = useState<string>(answer?.optionId || "")
  const [selectedExamples, setSelectedExamples] = useState<Record<string, boolean>>(
    answer?.examples?.reduce((acc, ex) => ({ ...acc, [ex.exampleId]: ex.selected }), {}) || {}
  )
  const [observation, setObservation] = useState(answer?.observation || "")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSelectedOption(answer?.optionId || "")
    setSelectedExamples(answer?.examples?.reduce((acc, ex) => ({ ...acc, [ex.exampleId]: ex.selected }), {} as Record<string, boolean>) || {} as Record<string, boolean>)
    setObservation(answer?.observation || "")
  }, [answer, question.id])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await onSave(question.id, {
        optionId: selectedOption || undefined,
        examples: Object.entries(selectedExamples).map(([exampleId, selected]) => ({
          exampleId, selected, observation: undefined
        })),
        observation: observation || undefined
      })
    } finally { setSaving(false) }
  }, [selectedOption, selectedExamples, observation, question.id, onSave])

  // Auto-save on option change
  useEffect(() => {
    if (selectedOption) {
      const timer = setTimeout(handleSave, 500)
      return () => clearTimeout(timer)
    }
  }, [selectedOption])

  return (
    <div className="space-y-4">
      {/* Header con contexto */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline">{part.code}</Badge>
        <Badge variant="secondary">{criterion.code}</Badge>
        <Badge variant="default">{question.context === "CURRENT" ? "Etapa Actual" : question.context === "CHILDHOOD" ? "Infancia" : "General"}</Badge>
        {progress && (
          <span className="text-xs text-muted-foreground ml-auto">{progress.answered}/{progress.total} respondidas</span>
        )}
      </div>

      {/* Criterio */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Criterio {criterion.code} - {criterion.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{criterion.officialText}</p>
        </CardContent>
      </Card>

      {/* Pregunta */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{question.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Opciones Sí/No */}
          {question.questionType === "CHOICE_WITH_EXAMPLES" && (
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {question.options.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.id} id={opt.id} />
                  <Label htmlFor={opt.id} className="text-sm">{opt.text}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Ejemplos */}
          {question.allowsExamples && question.examples.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ejemplos reconocidos:</Label>
              <div className="grid gap-2">
                {question.examples.map((ex) => (
                  <div key={ex.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ex-${ex.id}`}
                      checked={selectedExamples[ex.id] || false}
                      onCheckedChange={(checked) => {
                        setSelectedExamples((prev) => ({ ...prev, [ex.id]: checked as boolean }))
                      }}
                    />
                    <Label htmlFor={`ex-${ex.id}`} className="text-sm">{ex.text}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observación */}
          {question.allowsObservation && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observación del psicólogo:</Label>
              <Textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Agregar observación profesional..."
                rows={2}
              />
            </div>
          )}

          {/* Botón guardar manual */}
          <Button onClick={handleSave} disabled={saving} variant="outline" size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}