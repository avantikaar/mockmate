<div align="center">



\# 🎙️ MockMate



\### Voice-first AI interview coach with rubric-based scoring



\[!\[Live Demo](https://img.shields.io/badge/Live\_Demo-Visit\_App-8b5cf6?style=for-the-badge\&logo=vercel)](https://mockmate-pied.vercel.app)

\[!\[GitHub](https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge\&logo=github)](https://github.com/avantikaar/mockmate)

\[!\[Backend API](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge\&logo=render)](https://mockmate-backend-bf8t.onrender.com)



\*\*Live App:\*\* \[mockmate-pied.vercel.app](https://mockmate-pied.vercel.app) — no signup required



</div>



\---



\## 📸 Screenshots



\### Landing — Pick your role and start



!\[Landing](docs/landing.png)



\### Recording — AI analyzes your spoken answer



!\[Analyzing](docs/analyzing.png)



\### Report — Score breakdown and adaptive follow-up



!\[Report](docs/report.png)



\---



\## 📌 Overview



\*\*MockMate\*\* is a voice-first interview practice platform. Users record spoken answers to AI-generated interview questions and receive instant, structured feedback scored on four dimensions: \*\*structure, specificity, impact, and clarity\*\*.



Unlike generic "ChatGPT tells you your answer was good" tools, MockMate:

\- Accepts \*\*audio input\*\* (not text) using the browser's MediaRecorder API

\- \*\*Transcribes and evaluates in one Gemini call\*\* using multimodal input

\- Scores answers against a \*\*rubric\*\* and cites specific moments with timestamps

\- Generates \*\*adaptive follow-up questions\*\* based on what the candidate actually said

\- Produces a \*\*session report\*\* with an overall score and coach summary



\*\*The core insight:\*\* Interview practice is only useful if it feels like a real interview. Text chatbots don't. Voice does.



\---



\## ✨ Features



| Feature | Description |

|---|---|

| 🎙️ \*\*Voice recording\*\* | Browser-native MediaRecorder captures spoken answers up to 90 seconds |

| 🧠 \*\*Multimodal transcription + evaluation\*\* | Single Gemini 2.5 Flash call takes audio input and returns transcript + scores |

| 📊 \*\*4-dimension rubric\*\* | Structure, Specificity, Impact, Clarity — each scored 0–10 |

| 🔁 \*\*Adaptive follow-ups\*\* | LLM reads the candidate's answer and asks a probing follow-up question |

| 🎯 \*\*Coach summary\*\* | End-of-session wrap-up with named strengths and specific improvements |

| 💬 \*\*Cited feedback\*\* | Strengths and improvements reference timestamps in the audio (e.g., "0:24–0:52") |

| 🔓 \*\*No signup\*\* | Anonymous session via session\_key — open and start practicing immediately |

| 📱 \*\*Mobile-friendly\*\* | Fully responsive; works on phones where voice input is most natural |



\---





\### The AI Pipeline



Every submitted answer flows through a \*\*4-stage Celery chain\*\*:



| Stage | Task | Responsibility |

|-------|------|----------------|

| 1 | `transcribe\_and\_score` | Send audio to Gemini → get transcript + rubric scores + strengths/improvements |

| 2 | `save\_answer\_results` | Persist scores, transcript, and feedback |

| 3 | `prepare\_next\_step` | Decide: generate next adaptive question \*\*or\*\* end the session |

| 4 | `generate\_session\_summary` | If 3 questions answered, produce final coach summary |



This design keeps the HTTP response fast while LLM processing runs asynchronously.



> \*\*Production note:\*\* The free-tier deployment runs the pipeline synchronously via `.run()` to avoid background-worker costs. The Celery + Redis architecture is fully implemented and can be enabled by setting `USE\_CELERY=true`.



\---



\## 🛠️ Tech Stack



\*\*Backend\*\*

\- Django 5.1 + Django REST Framework

\- PostgreSQL (Neon — free tier, Singapore region)

\- Celery 5.4 + Redis for async task pipelines

\- Gunicorn + WhiteNoise for production serving

\- dj-database-url for environment-based DB config



\*\*AI Layer\*\*

\- Google Gemini 2.5 Flash — multimodal (audio + text)

\- Structured JSON output with regex-based extraction

\- Rubric scoring + adaptive question generation in a single SDK



\*\*Frontend\*\*

\- React 18 + TypeScript

\- Vite build system

\- Tailwind CSS design system

\- MediaRecorder API for browser-native audio capture

\- Lucide icon set



\---



\## 🔌 API Reference



| Method | Endpoint | Description |

|---|---|---|

| POST | `/api/sessions/` | Create a new session, generate first question |

| GET | `/api/sessions/{id}/` | Get session state with all questions and answers |

| POST | `/api/sessions/{id}/questions/{qid}/answer/` | Upload audio answer, trigger pipeline |



\*\*Example — create a session:\*\*



```bash

curl -X POST https://mockmate-backend-bf8t.onrender.com/api/sessions/ \\

&#x20; -H "Content-Type: application/json" \\

&#x20; -d '{"role": "swe\_intern"}'

