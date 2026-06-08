import { useStore } from '../store';
import type { Meeting, Qualification, Page } from '../types';
import { Avatar, SentimentBadge, formatDate, expiryLabel } from '../shared';

interface Props {
  onNavigate: (p: Page) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const { state } = useStore();
  const { employees, qualifications, meetings } = state;

  const now = new Date();

  const expiredOrExpiring = qualifications.filter((q) => {
    if (!q.expiryDate) return false;
    const days = Math.ceil((new Date(q.expiryDate + 'T00:00:00').getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days <= 90;
  });

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const meetingsThisMonth = meetings.filter((m) => {
    const d = new Date(m.date + 'T00:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const pendingActions = meetings.reduce(
    (sum, m) => sum + m.actionItems.filter((a) => !a.done).length,
    0
  );

  const recentMeetings = [...meetings]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const alertQuals = [...expiredOrExpiring]
    .sort((a, b) => {
      if (!a.expiryDate || !b.expiryDate) return 0;
      return a.expiryDate.localeCompare(b.expiryDate);
    })
    .slice(0, 6);

  function empName(id: string): string {
    return employees.find((e) => e.id === id)?.name ?? 'Unknown';
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
          {now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Total Employees"
          value={employees.length}
          sub={`${qualifications.length} qualifications`}
          dot="#3b82f6"
          onClick={() => onNavigate({ name: 'employees' })}
        />
        <StatCard
          label="Meetings This Month"
          value={meetingsThisMonth.length}
          sub={`${meetings.length} total`}
          dot="#10b981"
        />
        <StatCard
          label="Expiring Soon"
          value={expiredOrExpiring.filter((q) => {
            if (!q.expiryDate) return false;
            const d = Math.ceil((new Date(q.expiryDate + 'T00:00:00').getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return d >= 0 && d <= 30;
          }).length}
          sub={`${expiredOrExpiring.filter((q) => q.expiryDate && new Date(q.expiryDate + 'T00:00:00') < now).length} expired`}
          dot="#f59e0b"
        />
        <StatCard
          label="Pending Actions"
          value={pendingActions}
          sub="across all employees"
          dot="#ef4444"
        />
      </div>

      {/* Two-column panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent meetings */}
        <Panel title="Recent 1-on-1 Meetings">
          {recentMeetings.length === 0 ? (
            <Empty text="No meetings recorded yet." />
          ) : (
            recentMeetings.map((m) => (
              <MeetingRow
                key={m.id}
                meeting={m}
                name={empName(m.employeeId)}
                onClickEmployee={() =>
                  onNavigate({ name: 'employee-detail', employeeId: m.employeeId })
                }
              />
            ))
          )}
        </Panel>

        {/* Qualification alerts */}
        <Panel title="Qualification Alerts">
          {alertQuals.length === 0 ? (
            <Empty text="No qualifications expiring within 90 days." />
          ) : (
            alertQuals.map((q) => (
              <QualRow
                key={q.id}
                qual={q}
                name={empName(q.employeeId)}
                onClickEmployee={() =>
                  onNavigate({ name: 'employee-detail', employeeId: q.employeeId })
                }
              />
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  dot,
  onClick,
}: {
  label: string;
  value: number;
  sub: string;
  dot: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: 10,
        padding: '18px 20px',
        border: '1px solid #e2e8f0',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dot,
          marginBottom: 12,
        }}
      />
      <div style={{ fontSize: 30, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        padding: '18px 20px',
      }}
    >
      <h2 style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0', margin: 0 }}>
      {text}
    </p>
  );
}

function MeetingRow({
  meeting,
  name,
  onClickEmployee,
}: {
  meeting: Meeting;
  name: string;
  onClickEmployee: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <Avatar name={name} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', cursor: 'pointer' }}
          onClick={onClickEmployee}
        >
          {name}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(meeting.date)}</div>
      </div>
      <SentimentBadge sentiment={meeting.sentiment} />
    </div>
  );
}

function QualRow({
  qual,
  name,
  onClickEmployee,
}: {
  qual: Qualification;
  name: string;
  onClickEmployee: () => void;
}) {
  const label = expiryLabel(qual.expiryDate);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{qual.name}</div>
        <div
          style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}
          onClick={onClickEmployee}
        >
          {name}
        </div>
      </div>
      {label && (
        <span
          style={{
            fontSize: 12,
            background: label.bg,
            color: label.color,
            padding: '2px 8px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {label.text}
        </span>
      )}
    </div>
  );
}
