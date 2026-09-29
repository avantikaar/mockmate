import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const api = axios.create({ baseURL: API_URL })

export interface Answer {
  id: number
  question_text: string
  question_order: number
  transcript: string
  structure_score: number | null
  specificity_score: number | null
  impact_score: number | null
  clarity_score: number | null
  overall_score: number | null
  strengths: string[]
  improvements: string[]
  summary: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface Question {
  id: number
  order: number
  text: string
  created_at: string
  answer: Answer | null
}

export interface PracticeSession {
  id: number
  session_key: string
  role: string
  status: 'in_progress' | 'completed'
  overall_score: number | null
  summary: string
  questions: Question[]
  created_at: string
  completed_at: string | null
}

export const sessionsApi = {
  create: (role: string) => api.post<PracticeSession>('/sessions/', { role }),
  get: (id: number) => api.get<PracticeSession>(`/sessions/${id}/`),
  submitAnswer: (sessionId: number, questionId: number, audio: Blob, filename: string) => {
    const form = new FormData()
    form.append('audio', audio, filename)
    return api.post<PracticeSession>(
      `/sessions/${sessionId}/questions/${questionId}/answer/`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },
}

export const ROLE_LABELS: Record<string, string> = {
  swe_intern: 'Software Engineer Intern',
  swe_full: 'Software Engineer Full-Time',
  pm_intern: 'Product Manager Intern',
  data_intern: 'Data Analyst Intern',
}