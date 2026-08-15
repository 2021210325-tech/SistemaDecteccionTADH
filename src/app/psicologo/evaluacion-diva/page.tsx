"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { QuestionRenderer } from "@/components/evaluations/QuestionRenderer"
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react"

interface Structure {
  id: string; version: string; parts: {
    id: string; code: string; name: string; description: string; order: number
    domains: { id: string; code: string; name: string; criteria: {
      id: string; code: string; number: number; name: string; officialText: string
      questions: { id: string; code: string; context: string; text: string; questionType: string; required: boolean; allowsExamples: boolean; allowsObservation: boolean; options: { id: string; code: string; text: string; value: number; score: number }[]; examples: { id: string; text: string; score: number }[] }[]
    }[] }[]
  }[]
}

interface AnswerState {
  optionId?: string; examples: { exampleId: string; selected: boolean }[]
  observation?: string
}

interface Evaluation {
  id: string; status: string; student_name: string; student_code: string
  test_id: string; test_name: string; institution_name: string; created_at: string
}

export default function EvaluationPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [selectedEval, setSelectedEval] = useState<string | null>(null)
  const [structure, setStructure] = useState<Structure | null>(null)
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({})
  const [currentPartIndex, setCurrentPartIndex] = useState(0)
  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [results, setResults] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState("")
  const [professionalConclusion, setProfessionalConclusion] = useState("")
  const [recommendations, setRecommendations] = useState("")

  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/evaluaciones")
      if (res.ok) {
        const data = await res.json()
        setEvaluations((data.evaluations || []).filter((e: Evaluation) => e.status === "in_progress" || e.status === "pending"))
      }
    } catch { console.error("Error fetching evaluations") }
    finally { setLoading(false) }
  }, [])

  const loadStructure = useCallback(async (testId: string, evaluationId: string) => {
    try {
      setLoading(true)
      const [structRes, evalRes] = await Promise.all([
        fetch(`/api/evaluations/engine?testId=${testId}`),
        fetch(`/api/evaluations/engine/load?id=${evaluationId}`)
      ])
      if (structRes.ok) {
        const data = await structRes.json()
        setStructure(data.structure[0])
      }
      if (evalRes.ok) {
        const data = await evalRes.json()
        const existingAnswers: Record<string, AnswerState> = {}
        for (const ans of data.evaluation.answers) {
          existingAnswers[ans.question_id] = {
            optionId: ans.option_id,
            examples: [],
            observation: undefined
          }
        }
        setAnswers(existingAnswers)
        if (data.evaluation.results) {
          const r = data.evaluation.results
          setResults({
            inattention: { current: r.inattention_current || 0, childhood: r.inattention_childhood || 0 },
            hyperactivity: { current: r.hyperactivity_current || 0, childhood: r.hyperactivity_childhood || 0 },
            overallResult: r.overall_result || "No determinado"
          })
        }
      }
    } catch { console.error("Error loading structure") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const evalId = params.get("evaluationId")
    const testId = params.get("testId")
    if (evalId && testId) {
      setSelectedEval(evalId)
      loadStructure(testId, evalId)
    } else {
      fetchEvaluations()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartEvaluation = async (testId: string, studentId: string) => {
    try {
      setLoading(true)
      const res = await fetch("/api/evaluations/engine/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, studentId })
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedEval(data.evaluation.id)
        await loadStructure(testId, data.evaluation.id)
      }
    } finally { setLoading(false) }
  }

  const handleSelectEvaluation = async (evalId: string, testId: string) => {
    setSelectedEval(evalId)
    await loadStructure(testId, evalId)
  }

  const handleSaveAnswer = async (questionId: string, answer: AnswerState) => {
    if (!selectedEval) return
    try {
      const saveRes = await fetch("/api/evaluations/engine/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId: selectedEval, questionId, ...answer })
      })
      if (saveRes.ok) setAnswers((prev) => ({ ...prev, [questionId]: answer }))
    } catch { console.error("Error saving answer") }
  }

  const handleCalculateResults = async () => {
    if (!selectedEval) return
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/evaluations/engine/save", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId: selectedEval, action: "calculate" })
      })
      const data = await res.json()
      if (res.ok) {
        setResults(data)
      } else {
        setError(data.error || "Error al calcular resultados")
      }
    } catch { setError("Error de conexión al calcular resultados") }
    finally { setSaving(false) }
  }

  const handleComplete = async () => {
    if (!selectedEval) return
    setSaving(true)
    try {
      await fetch("/api/evaluations/engine/save", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId: selectedEval, action: "complete" })
      })
      setSelectedEval(null); setStructure(null); setAnswers({}); setResults(null)
      fetchEvaluations()
    } finally { setSaving(false) }
  }

  // Vista selección de evaluación
  if (!selectedEval) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Evaluación DIVA</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Seleccionar una evaluación en proceso</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : evaluations.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No hay evaluaciones en proceso</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {evaluations.map((ev) => (
              <Card key={ev.id} className="cursor-pointer hover:border-primary" onClick={() => handleSelectEvaluation(ev.id, ev.test_id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ev.student_name}</p>
                    <p className="text-sm text-muted-foreground">{ev.test_name}</p>
                  </div>
                  <Badge variant={ev.status === "in_progress" ? "secondary" : "outline"}>
                    {ev.status === "in_progress" ? "En Proceso" : "Pendiente"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Vista de evaluación
  if (!structure) {
    return (
      <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    )
  }

  const currentPart = structure.parts[currentPartIndex]
  const currentDomain = currentPart?.domains[0]
  const currentCriterion = currentDomain?.criteria[currentCriterionIndex]
  const currentQuestion = currentCriterion?.questions[currentQuestionIndex]

  // Calcular progreso
  let totalQ = 0; let answeredQ = 0
  for (const part of structure.parts) {
    for (const domain of part.domains) {
      for (const criterion of domain.criteria) {
        totalQ += criterion.questions.length
        for (const q of criterion.questions) {
          if (answers[q.id]?.optionId) answeredQ++
        }
      }
    }
  }
  const progress = totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0

  // Vista de resultados
  if (results) {
    const r = results as { inattention: { current: number; childhood: number }; hyperactivity: { current: number; childhood: number }; overallResult: string }
    const inattPct = Math.round((r.inattention.current / 9) * 100)
    const hyperPct = Math.round((r.hyperactivity.current / 9) * 100)
    const totalCurrent = r.inattention.current + r.hyperactivity.current
    const totalPossible = 18
    const overallPct = Math.round((totalCurrent / totalPossible) * 100)
    const inattChildPct = Math.round((r.inattention.childhood / 9) * 100)
    const hyperChildPct = Math.round((r.hyperactivity.childhood / 9) * 100)

    const getSeverity = (pct: number) => {
      if (pct >= 78) return { label: "Severo", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" }
      if (pct >= 56) return { label: "Moderado", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" }
      if (pct >= 33) return { label: "Leve", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" }
      return { label: "Mínimo", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" }
    }

    const inattSev = getSeverity(inattPct)
    const hyperSev = getSeverity(hyperPct)
    const overallSev = getSeverity(overallPct)

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Resultado de Evaluación</h1>
          <Button variant="outline" onClick={() => { setResults(null); setSelectedEval(null); setStructure(null) }}>
            Volver
          </Button>
        </div>

        {/* Diagnóstico General */}
        <Card className={`border-2 ${r.overallResult !== "No cumple criterios" ? "border-red-300 bg-red-50/50" : "border-green-300 bg-green-50/50"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Diagnóstico Preliminar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant={r.overallResult !== "No cumple criterios" ? "destructive" : "outline"} className="text-base px-4 py-1">
                {r.overallResult}
              </Badge>
              <span className={`text-2xl font-bold ${overallSev.color}`}>{overallPct}%</span>
              <span className={`text-sm px-2 py-0.5 rounded-full ${overallSev.bg} ${overallSev.color} border ${overallSev.border}`}>
                Severidad: {overallSev.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {totalCurrent} de 18 criterios cumplidos actualmente
              {r.overallResult !== "No cumple criterios"
                ? " — Se recomienda evaluación completa y seguimiento especializado."
                : " — No se cumplen los criterios mínimos para diagnóstico de TDAH."}
            </p>
          </CardContent>
        </Card>

        {/* Déficit de Atención */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Déficit de Atención (Inatención)</span>
              <span className={`text-lg font-bold ${inattSev.color}`}>{inattPct}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Síntomas actuales:</span>
                <span className="font-medium">{r.inattention.current}/9 criterios</span>
              </div>
              <Progress value={inattPct} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span><span>3</span><span>6 (umbral)</span><span>9</span>
              </div>
            </div>
            {r.inattention.current >= 6 && (
              <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">
                Se cumplen {r.inattention.current}/9 criterios — <strong>umbral diagnóstico: 6+</strong>
              </div>
            )}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Síntomas en infancia:</span>
                <span className="font-medium">{r.inattention.childhood}/9 criterios ({inattChildPct}%)</span>
              </div>
              <Progress value={inattChildPct} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Hiperactividad/Impulsividad */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Hiperactividad / Impulsividad</span>
              <span className={`text-lg font-bold ${hyperSev.color}`}>{hyperPct}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Síntomas actuales:</span>
                <span className="font-medium">{r.hyperactivity.current}/9 criterios</span>
              </div>
              <Progress value={hyperPct} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span><span>3</span><span>6 (umbral)</span><span>9</span>
              </div>
            </div>
            {r.hyperactivity.current >= 6 && (
              <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">
                Se cumplen {r.hyperactivity.current}/9 criterios — <strong>umbral diagnóstico: 6+</strong>
              </div>
            )}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Síntomas en infancia:</span>
                <span className="font-medium">{r.hyperactivity.childhood}/9 criterios ({hyperChildPct}%)</span>
              </div>
              <Progress value={hyperChildPct} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Resumen de criterios DSM-5 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Criterios DSM-5 Cumplidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className={`p-3 rounded-lg border ${r.inattention.current >= 6 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                <div className="font-medium">A. Inatención</div>
                <div className={r.inattention.current >= 6 ? "text-red-600 font-bold" : "text-muted-foreground"}>
                  {r.inattention.current >= 6 ? "CUMPLE" : "No cumple"} ({r.inattention.current}/6 mínimo)
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${r.hyperactivity.current >= 6 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                <div className="font-medium">B. Hiperactividad</div>
                <div className={r.hyperactivity.current >= 6 ? "text-red-600 font-bold" : "text-muted-foreground"}>
                  {r.hyperactivity.current >= 6 ? "CUMPLE" : "No cumple"} ({r.hyperactivity.current}/6 mínimo)
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${r.inattention.childhood >= 6 || r.hyperactivity.childhood >= 6 ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
                <div className="font-medium">C. Inicio antes de 12 años</div>
                <div className={r.inattention.childhood >= 6 || r.hyperactivity.childhood >= 6 ? "text-orange-600 font-bold" : "text-muted-foreground"}>
                  {r.inattention.childhood >= 6 || r.hyperactivity.childhood >= 6 ? "INDICADO" : "No indicado"}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                <div className="font-medium">D. Disfunción</div>
                <div className="text-blue-600 font-bold">Requiere evaluación clínica</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conclusión Profesional</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Conclusión</Label><Textarea value={professionalConclusion} onChange={(e) => setProfessionalConclusion(e.target.value)} rows={4} placeholder="Escriba su conclusión profesional..." /></div>
            <div><Label>Recomendaciones</Label><Textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={3} placeholder="Recomendaciones..." /></div>
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Finalizar Evaluación
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vista de evaluación paso a paso
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Evaluación en Curso</h1>
        <div className="flex gap-2">
          {progress === 100 && (
            <Button onClick={handleCalculateResults} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Ver Resultados
            </Button>
          )}
          <Button variant="outline" onClick={() => { setSelectedEval(null); setStructure(null); setAnswers({}) }}>Salir</Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{currentPart?.name}</span>
          <span>{answeredQ}/{totalQ} ({progress}%)</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Navegación por partes */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {structure.parts.map((part, idx) => (
          <Button
            key={part.id}
            variant={idx === currentPartIndex ? "default" : "outline"}
            size="sm"
            onClick={() => { setCurrentPartIndex(idx); setCurrentCriterionIndex(0); setCurrentQuestionIndex(0) }}
          >
            {part.name}
          </Button>
        ))}
      </div>

      {/* Criterios de la parte actual */}
      {currentPart && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {currentPart.domains.map((domain) =>
            domain.criteria.map((criterion, cIdx) => {
              const isAnswered = criterion.questions.some((q) => answers[q.id]?.optionId)
              return (
                <Badge
                  key={criterion.id}
                  variant={cIdx === currentCriterionIndex ? "default" : isAnswered ? "secondary" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => { setCurrentCriterionIndex(cIdx); setCurrentQuestionIndex(0) }}
                >
                  {criterion.code}
                </Badge>
              )
            })
          )}
        </div>
      )}

      {/* Pregunta actual */}
      {currentQuestion && currentCriterion && currentPart && (
        <QuestionRenderer
          key={currentQuestion.id}
          question={currentQuestion}
          criterion={currentCriterion}
          part={currentPart}
          answer={answers[currentQuestion.id]}
          onSave={handleSaveAnswer}
          progress={{ answered: answeredQ, total: totalQ }}
        />
      )}

      {/* Navegación */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (currentQuestionIndex > 0) setCurrentQuestionIndex((p) => p - 1)
            else if (currentCriterionIndex > 0) { setCurrentCriterionIndex((p) => p - 1); setCurrentQuestionIndex(0) }
            else if (currentPartIndex > 0) { setCurrentPartIndex((p) => p - 1); setCurrentCriterionIndex(0); setCurrentQuestionIndex(0) }
          }}
          disabled={currentPartIndex === 0 && currentCriterionIndex === 0 && currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        <Button
          onClick={() => {
            if (currentQuestion && currentCriterion && currentQuestionIndex < currentCriterion.questions.length - 1) setCurrentQuestionIndex((p) => p + 1)
            else if (currentCriterion && currentPart) {
              const domain = currentPart.domains[0]
              if (currentCriterionIndex < domain.criteria.length - 1) { setCurrentCriterionIndex((p) => p + 1); setCurrentQuestionIndex(0) }
              else if (currentPartIndex < structure.parts.length - 1) { setCurrentPartIndex((p) => p + 1); setCurrentCriterionIndex(0); setCurrentQuestionIndex(0) }
              else handleCalculateResults()
            }
          }}
        >
          {currentPartIndex === structure.parts.length - 1 && currentCriterion && currentCriterionIndex === (currentPart?.domains[0]?.criteria.length || 0) - 1 ? "Ver Resultados" : "Siguiente"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}