import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle2, TrendingUp, Lightbulb } from 'lucide-react'
import { sessionsApi, ROLE_LABELS } from '../api/client'
import type { PracticeSession, Question } from '../api/client'
import AudioRecorder from '../components/AudioRecorder'

export default function SessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    if (!id) return
    try {
      const res = await sessionsApi.get(Number(id))
      setSession(res.data)
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  // Redirect to report when session is complete
  useEffect(() => {
    if (session?.status === 'completed') {
      navigate(`/report/${session.id}`)
    }
  }, [session?.status])

  const currentQuestion: Question | undefined = session?.questions.find(
    (q) => q.answer === null || q.answer.status === 'failed'
  )

  const submitAudio = async (blob: Blob) => {
    if (!session || !currentQuestion) return
    setSubmitting(true)
    try {
      await sessionsApi.submitAnswer(session.id, currentQuestion.id, blob, 'answer.webm')
      await load()
    } catch (e) {
      alert('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!session) return null

  const answeredCount = session.questions.filter((q) => q.answer?.status === 'completed').length
  const totalQuestions = 3

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit
          </button>
          <div className="text-sm font-semibold text-slate-700">
            Question {Math.min(answeredCount + 1, totalQuestions)} of {totalQuestions}
          </div>
          <div className="text-xs text-slate-500">{ROLE_LABELS[session.role]}</div>
        </div>
        <div className="h-1 bg-slate-100">
          <div
            className="h-full gradient-hero transition-all duration-500"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Prior feedback */}
        {session.questions.map((q) => {
          if (!q.answer || q.answer.status !== 'completed') return null
          return (
            <div key={q.id} className="mb-8">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Question {q.order}
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-3">{q.text}</h3>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">Your answer score</div>
                  <div className="text-2xl font-bold text-brand-700">
                    {q.answer.overall_score}/10
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Structure', value: q.answer.structure_score },
                    { label: 'Specificity', value: q.answer.specificity_score },
                    { label: 'Impact', value: q.answer.impact_score },
                    { label: 'Clarity', value: q.answer.clarity_score },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-2 rounded-lg bg-slate-50">
                      <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                      <div className="font-bold text-slate-900">{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-brand-50 rounded-xl border border-brand-100">
                    <div className="flex items-center gap-1.5 mb-2 text-brand-700 font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Strengths
                    </div>
                    <ul className="text-xs text-brand-900 space-y-1 list-disc list-inside">
                      {q.answer.strengths.slice(0, 3).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-2 text-amber-700 font-semibold text-sm">
                      <Lightbulb className="w-4 h-4" />
                      Improve
                    </div>
                    <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                      {q.answer.improvements.slice(0, 3).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Current question */}
        {currentQuestion && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
              Question {currentQuestion.order}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-snug mb-6">
              {currentQuestion.text}
            </h2>

            <AudioRecorder onSubmit={submitAudio} submitting={submitting} />

            {submitting && (
              <div className="mt-4 p-4 bg-brand-50 border border-brand-100 rounded-xl flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="text-sm text-brand-900">
                  <strong>Analyzing your answer...</strong> Transcribing, scoring, and generating
                  feedback. This takes 15-25 seconds.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}