import type { CSSProperties, ReactNode } from 'react';

// ── Styles ─────────────────────────────────────────────────────────────────

export const primaryBtn: CSSProperties = {
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

export const ghostBtn: CSSProperties = {
  background: 'white',
  color: '#374151',
  border: '1px solid #d1d5db',
  padding: '8px 16px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
};

export const smallBtn: CSSProperties = {
  background: 'none',
  border: '1px solid #e2e8f0',
  padding: '4px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  color: '#64748b',
};

export const dangerBtn: CSSProperties = {
  background: 'none',
  color: '#ef4444',
  border: '1px solid #fecaca',
  padding: '4px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
};

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  background: 'white',
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: 84,
};

// ── Avatar ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#0ea5e9', '#14b8a6'];

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const bg = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.36),
        fontWeight: 700,
        color: 'white',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials || '?'}
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────

export function Modal({
  title,
  onClose,
  children,
  maxWidth = 560,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          width: '100%',
          maxWidth,
          maxHeight: '92vh',
          overflow: 'auto',
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 22,
              color: '#9ca3af',
              lineHeight: 1,
              padding: '0 2px',
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── FormField ────────────────────────────────────────────────────────────────

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: '#6b7280',
          marginBottom: 5,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Badges ───────────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  Beginner:     { bg: '#f1f5f9', color: '#475569' },
  Intermediate: { bg: '#eff6ff', color: '#2563eb' },
  Advanced:     { bg: '#faf5ff', color: '#7c3aed' },
  Expert:       { bg: '#fffbeb', color: '#b45309' },
};

export function LevelBadge({ level }: { level: string }) {
  const s = LEVEL_STYLE[level] ?? { bg: '#f1f5f9', color: '#475569' };
  return (
    <span
      style={{
        fontSize: 12,
        background: s.bg,
        color: s.color,
        padding: '2px 8px',
        borderRadius: 20,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {level}
    </span>
  );
}

const SENTIMENT_STYLE: Record<string, { bg: string; color: string }> = {
  Positive: { bg: '#f0fdf4', color: '#16a34a' },
  Neutral:  { bg: '#f8fafc', color: '#475569' },
  Negative: { bg: '#fef2f2', color: '#dc2626' },
};

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  const s = SENTIMENT_STYLE[sentiment] ?? SENTIMENT_STYLE.Neutral;
  return (
    <span
      style={{
        fontSize: 12,
        background: s.bg,
        color: s.color,
        padding: '2px 10px',
        borderRadius: 20,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {sentiment}
    </span>
  );
}

// ── Utilities ────────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysUntil(iso: string): number {
  return Math.ceil(
    (new Date(iso + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

export function expiryLabel(expiryDate: string | null): { text: string; bg: string; color: string } | null {
  if (!expiryDate) return null;
  const days = daysUntil(expiryDate);
  if (days < 0) return { text: 'Expired', bg: '#fef2f2', color: '#dc2626' };
  if (days <= 30) return { text: `${days}d left`, bg: '#fffbeb', color: '#b45309' };
  if (days <= 90) return { text: `${days}d left`, bg: '#fefce8', color: '#ca8a04' };
  return { text: formatDate(expiryDate), bg: '#f0fdf4', color: '#16a34a' };
}

export function newId(): string {
  return crypto.randomUUID();
}
