import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Code2, BarChart3, Briefcase, Loader2, Sparkles, ChevronRight } from 'lucide-react'
import { sessionsApi, ROLE_LABELS } from '../api/client'

const ROLES = [
  { id: 'swe_intern', icon: Code2, desc: 'DSA, projects, internships' },
  { id: 'swe_full', icon: Briefcase, desc: 'System design, architecture' },
  { id: 'pm_intern', icon: Sparkles, desc: 'Product thinking, metrics' },
  { id: 'data_intern', icon: BarChart3, desc: 'SQL, analytics, stats' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('swe_intern')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const start = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await sessionsApi.create(selected)
      navigate(`/session/${res.data.id}`)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="gradient-hero text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, white 2px, transparent 2px), radial-gradient(circle at 80% 70%, white 2px, transparent 2px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
          {/* Brand badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-sm font-semibold mb-6">
            <Mic className="w-4 h-4" />
            MockMate · AI Interview Coach
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 px-4">
            Practice interviews
            <br />
            out loud.
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-10">
            Record your answers. Get instant feedback scored on structure, specificity, impact, and
            clarity. Like a real interview coach — without the cost.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice-first practice
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Rubric-based scoring
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Adaptive follow-ups
            </div>
          </div>
        </div>
      </div>

      {/* Role picker */}
      <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pick your role</h2>
          <p className="text-slate-500 mb-6">Questions will be tailored to this position</p>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`text-left p-4 rounded-2xl border-2 transition ${
                  selected === r.id
                    ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/10'
                    : 'border-slate-200 bg-white hover:border-brand-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selected === r.id
                        ? 'gradient-hero text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <r.icon className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-slate-900">{ROLE_LABELS[r.id]}</div>
                </div>
                <div className="text-sm text-slate-500 pl-13">{r.desc}</div>
              </button>
            ))}
          </div>

          <button
            onClick={start}
            disabled={loading}
            className="w-full gradient-hero text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/30 hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing your first question...
              </>
            ) : (
              <>
                Start Practice Session
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span>3 questions · ~5 minutes</span>
            <span>No signup required</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: '1', title: 'Record', desc: 'Answer out loud. Just like the real thing.' },
            { n: '2', title: 'Get scored', desc: 'AI transcribes and evaluates on 4 dimensions.' },
            { n: '3', title: 'Improve', desc: 'Read specific feedback with cited moments.' },
          ].map((s) => (
            <div key={s.n} className="bg-white rounded-2xl border border-slate-200 p-6 card-hover">
              <div className="w-10 h-10 rounded-xl gradient-hero text-white font-bold flex items-center justify-center mb-4">
                {s.n}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center pb-12 text-sm text-slate-400">
        MockMate · Built with Django, Gemini, and React
      </div>
    </div>
  )
}