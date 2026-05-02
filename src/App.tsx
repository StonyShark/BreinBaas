import { useState, useRef } from 'react'

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

// ── Helpers ────────────────────────────────────────────────────────────────

function fileToBase64(
  file: File,
): Promise<{ data: string; mediaType: 'image/jpeg' | 'image/png' }> {
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
const MODEL = 'claude-sonnet-4-20250514'

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

async function gradeCard(frontFile: File, backFile: File): Promise<GradeResult> {
  const [front, back] = await Promise.all([
    fileToBase64(frontFile),
    fileToBase64(backFile),
  ])

  // Future (camera input): the images here come from file uploads.
  // To support live camera capture, replace the file input with
  // navigator.mediaDevices.getUserMedia() and draw frames to a canvas,
  // then call canvas.toDataURL() to get the base64 data.
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

  // Future (camera input): add a "Use camera" toggle here that activates
  // a <video> element with navigator.mediaDevices.getUserMedia({ video: true })
  // and a capture button instead of the file input.
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p
        style={{
          margin: '0 0 8px',
          fontWeight: 600,
          fontSize: 14,
          color: '#374151',
        }}
      >
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
          <div
            style={{
              textAlign: 'center',
              color: '#9ca3af',
              userSelect: 'none',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 10 }}>📷</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Click to upload</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>JPG or PNG</div>
          </div>
        )}
      </div>

      {file && (
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 11,
            color: '#6b7280',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
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

// ── GradeDisplay component ─────────────────────────────────────────────────

function GradeDisplay({ result }: { result: GradeResult }) {
  const s = GRADE_STYLES[result.grade]
  const gradeIndex = GRADE_LABELS.indexOf(result.grade)

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 14,
        }}
      >
        Overall Grade
      </div>

      {/* Grade badge */}
      <div
        style={{
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
        }}
      >
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
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background:
                  i === gradeIndex
                    ? s.color
                    : i < gradeIndex
                      ? '#cbd5e1'
                      : '#f1f5f9',
              }}
            />
            <div
              style={{
                fontSize: 9,
                textAlign: 'center',
                marginTop: 4,
                color: i === gradeIndex ? s.color : '#94a3b8',
                fontWeight: i === gradeIndex ? 700 : 400,
              }}
            >
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
      const res = await gradeCard(frontFile, backFile)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const canGrade = !!frontFile && !!backFile && !loading

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '18px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 700,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
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

        {/* ── Upload panel ── */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              margin: '0 0 16px',
              fontSize: 15,
              fontWeight: 600,
              color: '#1e293b',
            }}
          >
            Upload Card Images
          </h2>

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
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '28px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              textAlign: 'center',
              marginBottom: 20,
              color: '#64748b',
              fontSize: 14,
            }}
          >
            Evaluating centering, corners, edges, and surface…
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div
            style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 12,
              padding: '14px 18px',
              color: '#be123c',
              fontSize: 14,
              marginBottom: 20,
              wordBreak: 'break-word',
            }}
          >
            {error}
          </div>
        )}

        {/* ── Grade result ── */}
        {result && !loading && <GradeDisplay result={result} />}

        {/* ── Grading categories info (shown before first grade) ── */}
        {!result && !loading && (
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 14,
              }}
            >
              What gets evaluated
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
            >
              {(
                [
                  ['Centering', 'Border symmetry on all sides'],
                  ['Corners', 'Sharpness vs. wear or rounding'],
                  ['Edges', 'Clean vs. chipped or frayed'],
                  ['Surface', 'Scratches, stains, print defects'],
                ] as [string, string][]
              ).map(([name, desc]) => (
                <div
                  key={name}
                  style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}
                  >
                    {name}
                  </div>
                  <div
                    style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}
                  >
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
