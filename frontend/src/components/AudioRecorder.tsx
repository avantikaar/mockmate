import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, Send } from 'lucide-react'

interface Props {
  onSubmit: (blob: Blob) => Promise<void>
  submitting: boolean
}

export default function AudioRecorder({ onSubmit, submitting }: Props) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    setError('')
    setAudioBlob(null)
    setAudioUrl('')
    setSeconds(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }

      mr.start()
      setRecording(true)

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s >= 89) {
            stopRecording()
            return 90
          }
          return s + 1
        })
      }, 1000)
    } catch (e) {
      setError('Microphone access denied. Please allow microphone and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleSubmit = async () => {
    if (!audioBlob) return
    await onSubmit(audioBlob)
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          {error}
        </div>
      )}

      {!audioBlob ? (
        <div className="flex flex-col items-center py-6">
          {recording ? (
            <>
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-rose-400 pulse-ring"></div>
                <button
                  onClick={stopRecording}
                  className="relative w-20 h-20 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition"
                >
                  <Square className="w-8 h-8" fill="currentColor" />
                </button>
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {mm}:{ss}
              </div>
              <p className="text-sm text-slate-500 mt-2">Recording... click to stop</p>
              <div className="w-full max-w-xs mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all"
                  style={{ width: `${(seconds / 90) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <button
                onClick={startRecording}
                className="w-20 h-20 rounded-full gradient-hero hover:shadow-xl text-white flex items-center justify-center shadow-lg shadow-brand-500/30 transition"
              >
                <Mic className="w-8 h-8" />
              </button>
              <p className="text-sm text-slate-500 mt-4">Tap to start recording</p>
              <p className="text-xs text-slate-400 mt-1">Aim for 45–90 seconds</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-brand-50 border border-brand-100 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <Mic className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">Recording ready</div>
              <div className="text-xs text-slate-500">{mm}:{ss} · {audioBlob.size > 1024 ? `${Math.round(audioBlob.size / 1024)} KB` : ''}</div>
            </div>
          </div>

          <audio src={audioUrl} controls className="w-full" />

          <div className="flex gap-2">
            <button
              onClick={() => { setAudioBlob(null); setAudioUrl('') }}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-60"
            >
              Re-record
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 gradient-hero text-white font-semibold py-3 rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Answer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}