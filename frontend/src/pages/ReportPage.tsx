import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, Trophy, Target, RotateCcw, Quote } from 'lucide-react'
import { sessionsApi, ROLE_LABELS } from '../api/client'
import type { PracticeSession } from '../api/client'

export default function ReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    sessionsApi
      .get(Number(id))
      .then((res) => {
        setSession(res.data)
        setLoading(false)
      })
      .catch(() => navigate('/'))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!session) return null

  const score = session.overall_score ?? 0
  const scoreColor =
    score >= 8 ? 'text-brand-600' : score >= 6 ? 'text-amber-600' : 'text-rose-600'

  const scores = session.questions
    .map((q) => q.answer?.overall_score ?? 0)
    .filter((s) => s > 0)

  const topScore = scores.length ? Math.max(...scores) : 0
  const weakScore = scores.length ? Math.min(...scores) : 0

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero */}
      <div className="gradient-hero text-white py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="text-sm uppercase tracking-wider opacity-90 mb-2">Session Complete</div>
          <h1 className="text-4xl md:text-5xl font-black mb-3">
            You scored <span className="text-white">{score}/10</span>
          </h1>
          <p className="opacity-90 max-w-2xl mx-auto">{ROLE_LABELS[session.role]}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        {/* Summary card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Coach's Summary</h2>
          </div>
          <p className="text-slate-700 leading-relaxed">{session.summary}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Questions</div>
              <div className="text-2xl font-bold text-slate-900">{session.questions.length}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avg Score</div>
              <div className="text-2xl font-bold text-slate-900">{score}/10</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Top Score</div>
              <div className="text-2xl font-bold text-slate-900">{topScore}/10</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Weakest</div>
              <div className="text-2xl font-bold text-slate-900">{weakScore}/10</div>
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <h2 className="text-xl font-bold text-slate-900 mb-4">Question Breakdown</h2>
        <div className="space-y-5">
          {session.questions.map((q) => {
            const a = q.answer
            if (!a) return null
            return (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
                      Question {q.order}
                    </div>
                    <h3 className="font-semibold text-slate-900 leading-snug">{q.text}</h3>
                  </div>
                  <div className={`text-3xl font-bold ${scoreColor} flex-shrink-0`}>
                    {a.overall_score}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Structure', value: a.structure_score },
                    { label: 'Specificity', value: a.specificity_score },
                    { label: 'Impact', value: a.impact_score },
                    { label: 'Clarity', value: a.clarity_score },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-hero transition-all duration-700"
                          style={{ width: `${((s.value ?? 0) / 10) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mt-1">{s.value}</div>
                    </div>
                  ))}
                </div>

                {a.transcript && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5" />
                      Show transcript
                    </summary>
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl text-sm text-slate-600 italic leading-relaxed">
                      "{a.transcript}"
                    </div>
                  </details>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-10">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-4 rounded-2xl gradient-hero text-white font-bold shadow-lg shadow-brand-500/30 hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Practice Again
          </button>
        </div>
      </div>
    </div>
  )
}