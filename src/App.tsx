import { useState, useRef, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

// Ordered from lowest to highest — the order matters for the grade scale bar.
const GRADE_LABELS = ['Poor', 'Fair', 'Good', 'Excellent', 'Gem Mint'] as const
type Grade = (typeof GRADE_LABELS)[number]

interface GradeResult {
  grade: Grade
  explanation: string
  // Future (BGS subgrades): expand with per-category numeric scores, e.g.:
  // subgrades?: { centering: number; corners: number; edges: number; surface: number }
}

type ImagePayload = { data: string; mediaType: 'image/jpeg' | 'image/png' }

// ── Helpers ────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<ImagePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      const mediaType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      resolve({ data: base64, mediaType })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function parseGradeResponse(text: string): GradeResult | null {
  // Expect the model to respond with:
  //   GRADE: <label>
  //   EXPLANATION: <text>
  const gradeMatch = text.match(/GRADE:\s*(Gem Mint|Excellent|Good|Fair|Poor)/i)
  if (!gradeMatch) return null

  const grade = GRADE_LABELS.find(
    (g) => g.toLowerCase() === gradeMatch[1].toLowerCase(),
  )
  if (!grade) return null

  const explanationMatch = text.match(/EXPLANATION:\s*([\s\S]+)/i)
  const explanation = explanationMatch
    ? explanationMatch[1].trim().replace(/\n+/g, ' ')
    : text.replace(/GRADE:.*\n?/i, '').trim()

  return { grade, explanation }
}

// ── Claude API ─────────────────────────────────────────────────────────────

// Model as specified. The Vite dev-server proxy (vite.config.ts) adds the
// API key header and forwards /api → https://api.anthropic.com.
const MODEL = 'claude-haiku-4-5-20251001'

const GRADING_SYSTEM_PROMPT = `You are an expert Pokémon card grader. \
Examine the front and back of the card carefully across all four standard \
grading categories:

1. Centering — Border symmetry front and back
2. Corners — Sharpness vs. wear or rounding
3. Edges — Clean vs. chipped, nicked, or frayed
4. Surface — Free of scratches, stains, print lines, or indentations

Assign ONE overall grade using exactly this scale:
- Poor: Heavy damage, major wear across multiple categories
- Fair: Significant wear, multiple visible issues
- Good: Moderate wear, some visible flaws
- Excellent: Light wear only, near mint
- Gem Mint: Perfect or near-perfect, no visible defects

Respond in EXACTLY this format with no extra text before the GRADE line:
GRADE: [one of: Poor / Fair / Good / Excellent / Gem Mint]
EXPLANATION: [2–3 sentences explaining what most influenced the grade]`

async function gradeCard(front: ImagePayload, back: ImagePayload): Promise<GradeResult> {
  const response = await fetch('/api/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: GRADING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: front.mediaType,
                data: front.data,
              },
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: back.mediaType,
                data: back.data,
              },
            },
            { type: 'text', text: 'Please grade this Pokémon card.' },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`API error ${response.status}: ${body}`)
  }

  const data = await response.json()
  const text: string = (data.content?.[0]?.text as string) ?? ''
  const result = parseGradeResponse(text)

  if (!result) {
    throw new Error(`Could not parse a grade from the response.\n\n${text}`)
  }

  return result
}

// ── Grade styling ──────────────────────────────────────────────────────────

interface GradeStyle {
  bg: string
  color: string
  border: string
}

const GRADE_STYLES: Record<Grade, GradeStyle> = {
  Poor: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  Fair: { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
  Good: { bg: '#fefce8', color: '#a16207', border: '#fde047' },
  Excellent: { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
  'Gem Mint': { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
}

// ── UploadBox component ────────────────────────────────────────────────────

interface UploadBoxProps {
  label: string
  file: File | null
  previewUrl: string | null
  onFileChange: (file: File) => void
  disabled: boolean
}

function UploadBox({ label, file, previewUrl, onFileChange, disabled }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const trigger = () => {
    if (!disabled) inputRef.current?.click()
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>
        {label}
      </p>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Upload ${label}`}
        onClick={trigger}
        onKeyDown={(e) => e.key === 'Enter' && trigger()}
        style={{
          border: previewUrl ? '2px solid #6366f1' : '2px dashed #d1d5db',
          borderRadius: 12,
          height: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          overflow: 'hidden',
          background: previewUrl ? '#111827' : '#fafafa',
          transition: 'border-color 0.15s',
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${label} preview`}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', userSelect: 'none', padding: 16 }}>
            <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 10 }}>📷</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Click to upload</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>JPG or PNG</div>
          </div>
        )}
      </div>

      {file && (
        <p style={{
          margin: '6px 0 0',
          fontSize: 11,
          color: '#6b7280',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {file.name}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFileChange(f)
        }}
        disabled={disabled}
        style={{ display: 'none' }}
      />
    </div>
  )
}

// ── CameraCapture component ────────────────────────────────────────────────

type CaptureStep = 'front' | 'back' | 'ready'

interface CameraCaptureProps {
  onGrade: (front: ImagePayload, back: ImagePayload) => void
  disabled: boolean
}

function CameraCapture({ onGrade, disabled }: CameraCaptureProps) {
  const [step, setStep] = useState<CaptureStep>('front')
  const [capturedFront, setCapturedFront] = useState<ImagePayload | null>(null)
  const [capturedBack, setCapturedBack] = useState<ImagePayload | null>(null)
  const [frontThumb, setFrontThumb] = useState<string | null>(null)
  const [backThumb, setBackThumb] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCamera() {
    setCameraError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access requires HTTPS. Please open the app over a secure connection.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch (err) {
      const name = err instanceof Error ? err.name : ''
      if (name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and try again.')
      } else if (name === 'NotFoundError') {
        setCameraError('No camera found on this device.')
      } else {
        setCameraError('Could not access the camera. Please try again.')
      }
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  function captureFrame(): ImagePayload | null {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return null
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    return { data: dataUrl.split(',')[1], mediaType: 'image/jpeg' }
  }

  function handleCapture() {
    const payload = captureFrame()
    if (!payload) return
    const thumb = `data:image/jpeg;base64,${payload.data}`
    if (step === 'front') {
      setCapturedFront(payload)
      setFrontThumb(thumb)
      setStep('back')
    } else if (step === 'back') {
      setCapturedBack(payload)
      setBackThumb(thumb)
      setStep('ready')
    }
  }

  function handleRetake(side: 'front' | 'back') {
    if (side === 'front') {
      setCapturedFront(null)
      setFrontThumb(null)
    } else {
      setCapturedBack(null)
      setBackThumb(null)
    }
    setStep(side)
  }

  function handleGrade() {
    if (!capturedFront || !capturedBack || disabled) return
    stopCamera()
    onGrade(capturedFront, capturedBack)
  }

  const steps: { key: CaptureStep; label: string }[] = [
    { key: 'front', label: 'Front' },
    { key: 'back', label: 'Back' },
    { key: 'ready', label: 'Ready' },
  ]
  const stepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {steps.map((s, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  background: done ? '#166534' : active ? '#4f46e5' : '#e2e8f0',
                  color: done || active ? '#fff' : '#94a3b8',
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: done ? '#166534' : active ? '#4f46e5' : '#94a3b8',
                }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 20, height: 1, background: '#e2e8f0' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Viewfinder or error */}
      {cameraError ? (
        <div style={{
          border: '1px solid #fecdd3',
          borderRadius: 10,
          padding: '24px 16px',
          background: '#fff1f2',
          color: '#be123c',
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 1.6,
        }}>
          {cameraError}
          <div>
            <button
              onClick={startCamera}
              style={{
                marginTop: 12,
                padding: '8px 20px',
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 10,
              background: '#111827',
            }}
          />
          {/* Card outline guide */}
          <div style={{
            position: 'absolute',
            left: '22.5%',
            top: '11%',
            width: '55%',
            height: '78%',
            border: '2px solid rgba(255,255,255,0.6)',
            borderRadius: 8,
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* Instruction + capture button */}
      {step !== 'ready' && (
        <>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', margin: '12px 0 0' }}>
            {step === 'front' ? 'Hold up the front of the card' : 'Now hold up the back of the card'}
          </p>
          <button
            onClick={handleCapture}
            disabled={!cameraActive}
            style={{
              display: 'block',
              margin: '12px auto 0',
              padding: '11px 32px',
              background: cameraActive ? '#4f46e5' : '#e2e8f0',
              color: cameraActive ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600,
              cursor: cameraActive ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {step === 'front' ? 'Capture Front' : 'Capture Back'}
          </button>
        </>
      )}

      {/* Thumbnails */}
      {(frontThumb || backThumb) && (
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          {(['front', 'back'] as const).map((side) => {
            const thumb = side === 'front' ? frontThumb : backThumb
            return (
              <div key={side} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  height: 110,
                  borderRadius: 8,
                  border: thumb ? '2px solid #6366f1' : '2px dashed #d1d5db',
                  background: thumb ? '#111827' : '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={`${side} capture`}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{side}</span>
                  )}
                </div>
                {thumb && (
                  <button
                    onClick={() => handleRetake(side)}
                    disabled={disabled}
                    style={{
                      marginTop: 6,
                      background: 'none',
                      border: 'none',
                      color: '#4f46e5',
                      fontSize: 12,
                      cursor: disabled ? 'default' : 'pointer',
                      padding: 0,
                    }}
                  >
                    Retake
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Grade button — shown when both sides are captured */}
      {step === 'ready' && (
        <button
          onClick={handleGrade}
          disabled={disabled}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 18,
            padding: '13px 0',
            background: disabled ? '#e2e8f0' : '#4f46e5',
            color: disabled ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {disabled ? 'Grading…' : 'Grade My Card'}
        </button>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

// ── GradeDisplay component ─────────────────────────────────────────────────

function GradeDisplay({ result }: { result: GradeResult }) {
  const s = GRADE_STYLES[result.grade]
  const gradeIndex = GRADE_LABELS.indexOf(result.grade)

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 14,
      }}>
        Overall Grade
      </div>

      {/* Grade badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 22px',
        borderRadius: 999,
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        color: s.color,
        fontWeight: 700,
        fontSize: 22,
        marginBottom: 18,
      }}>
        {result.grade}
      </div>

      {/*
        Grade scale bar — one segment per grade, active segment highlighted.
        Future (BGS subgrades): replace this single bar with four labelled
        category bars showing individual numeric scores for Centering,
        Corners, Edges, and Surface.
      */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {GRADE_LABELS.map((g, i) => (
          <div key={g} style={{ flex: 1 }}>
            <div style={{
              height: 6,
              borderRadius: 3,
              background: i === gradeIndex ? s.color : i < gradeIndex ? '#cbd5e1' : '#f1f5f9',
            }} />
            <div style={{
              fontSize: 9,
              textAlign: 'center',
              marginTop: 4,
              color: i === gradeIndex ? s.color : '#94a3b8',
              fontWeight: i === gradeIndex ? 700 : 400,
            }}>
              {g === 'Gem Mint' ? 'Gem' : g}
            </div>
          </div>
        ))}
      </div>

      {/* 2–3 sentence explanation */}
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#374151' }}>
        {result.explanation}
      </p>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Future (Dutch language toggle): add `const [lang, setLang] = useState<'en'|'nl'>('en')`
  // and a toggle in the header. Wrap all UI strings in a t(key, lang) helper
  // backed by a simple { en: {...}, nl: {...} } dictionary object.

  function handleModeChange(next: 'upload' | 'camera') {
    if (next === mode) return
    if (frontPreview) URL.revokeObjectURL(frontPreview)
    if (backPreview) URL.revokeObjectURL(backPreview)
    setFrontFile(null)
    setFrontPreview(null)
    setBackFile(null)
    setBackPreview(null)
    setResult(null)
    setError(null)
    setMode(next)
  }

  const handleFrontChange = (file: File) => {
    if (frontPreview) URL.revokeObjectURL(frontPreview)
    setFrontFile(file)
    setFrontPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  const handleBackChange = (file: File) => {
    if (backPreview) URL.revokeObjectURL(backPreview)
    setBackFile(file)
    setBackPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  const handleGrade = async () => {
    if (!frontFile || !backFile) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const [front, back] = await Promise.all([
        fileToBase64(frontFile),
        fileToBase64(backFile),
      ])
      const res = await gradeCard(front, back)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const runGrade = (front: ImagePayload, back: ImagePayload) => {
    setLoading(true)
    setResult(null)
    setError(null)
    gradeCard(front, back)
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'An unexpected error occurred.'))
      .finally(() => setLoading(false))
  }

  const canGrade = mode === 'upload' && !!frontFile && !!backFile && !loading

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    }}>
      {/* ── Header ── */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '18px 24px',
      }}>
        <div style={{
          maxWidth: 700,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: '#0f172a' }}>
              Pokémon Card Grader
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
              AI-powered card grading using Claude
            </p>
          </div>
          {/* Future (Dutch language toggle): <LanguageToggle lang={lang} onChange={setLang} /> */}
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Input panel ── */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          marginBottom: 20,
        }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 20,
          }}>
            {(['upload', 'camera'] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  background: mode === m ? '#4f46e5' : '#f8fafc',
                  color: mode === m ? '#fff' : '#64748b',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {m === 'upload' ? '📁  Upload' : '📷  Camera'}
              </button>
            ))}
          </div>

          {mode === 'upload' ? (
            <>
              <div style={{ display: 'flex', gap: 16 }}>
                <UploadBox
                  label="Front"
                  file={frontFile}
                  previewUrl={frontPreview}
                  onFileChange={handleFrontChange}
                  disabled={loading}
                />
                <UploadBox
                  label="Back"
                  file={backFile}
                  previewUrl={backPreview}
                  onFileChange={handleBackChange}
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleGrade}
                disabled={!canGrade}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 18,
                  padding: '13px 0',
                  background: canGrade ? '#4f46e5' : '#e2e8f0',
                  color: canGrade ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: canGrade ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? 'Grading…' : 'Grade My Card'}
              </button>
            </>
          ) : (
            <CameraCapture onGrade={runGrade} disabled={loading} />
          )}
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '28px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            textAlign: 'center',
            marginBottom: 20,
            color: '#64748b',
            fontSize: 14,
          }}>
            Evaluating centering, corners, edges, and surface…
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: 12,
            padding: '14px 18px',
            color: '#be123c',
            fontSize: 14,
            marginBottom: 20,
            wordBreak: 'break-word',
          }}>
            {error}
          </div>
        )}

        {/* ── Grade result ── */}
        {result && !loading && <GradeDisplay result={result} />}

        {/* ── Grading categories info (shown before first grade) ── */}
        {!result && !loading && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '20px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 14,
            }}>
              What gets evaluated
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(
                [
                  ['Centering', 'Border symmetry on all sides'],
                  ['Corners', 'Sharpness vs. wear or rounding'],
                  ['Edges', 'Clean vs. chipped or frayed'],
                  ['Surface', 'Scratches, stains, print defects'],
                ] as [string, string][]
              ).map(([name, desc]) => (
                <div key={name} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
