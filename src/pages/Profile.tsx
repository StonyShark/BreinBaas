import { useState } from 'react';
import { useStore } from '../store';
import type { Supervisor, Page } from '../types';
import {
  Avatar,
  Modal,
  FormField,
  primaryBtn,
  ghostBtn,
  inputStyle,
} from '../shared';

interface Props {
  onNavigate: (p: Page) => void;
}

export default function Profile({ onNavigate }: Props) {
  const { state, dispatch } = useStore();
  const { supervisor, employees, qualifications, meetings } = state;
  const [editing, setEditing] = useState(false);

  // Team breakdown by role
  const roleCounts = employees.reduce<Record<string, number>>((acc, e) => {
    acc[e.role] = (acc[e.role] ?? 0) + 1;
    return acc;
  }, {});

  const roleOrder = ['Senior Operator', 'Process Operator A', 'Process Operator B', 'Process Operator C'];
  const sortedRoles = [
    ...roleOrder.filter((r) => roleCounts[r]),
    ...Object.keys(roleCounts).filter((r) => !roleOrder.includes(r)),
  ];

  const totalQuals = qualifications.length;
  const totalMeetings = meetings.length;
  const pendingActions = meetings.reduce(
    (sum, m) => sum + m.actionItems.filter((a) => !a.done).length,
    0
  );

  const now = new Date();
  const meetingsThisMonth = meetings.filter((m) => {
    const d = new Date(m.date + 'T00:00:00');
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const expiringSoon = qualifications.filter((q) => {
    if (!q.expiryDate) return false;
    const days = Math.ceil(
      (new Date(q.expiryDate + 'T00:00:00').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return days >= 0 && days <= 30;
  }).length;

  return (
    <div style={{ padding: '32px 36px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 24px' }}>
        My Profile
      </h1>

      {/* Profile card */}
      <div
        style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {/* Banner */}
        <div style={{ height: 80, background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }} />

        {/* Info row */}
        <div style={{ padding: '0 28px 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            {/* Avatar with white ring */}
            <div
              style={{
                borderRadius: '50%',
                border: '4px solid white',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <Avatar name={supervisor.name} size={72} />
            </div>
            <div style={{ paddingBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {supervisor.name}
              </h2>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
                {supervisor.role}
                {supervisor.department ? ` · ${supervisor.department}` : ''}
              </div>
            </div>
          </div>
          <button onClick={() => setEditing(true)} style={{ ...ghostBtn, marginBottom: 4 }}>
            Edit Profile
          </button>
        </div>

        {/* Contact row */}
        {(supervisor.email || supervisor.phone) && (
          <div
            style={{
              padding: '12px 28px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              gap: 24,
            }}
          >
            {supervisor.email && (
              <span style={{ fontSize: 13, color: '#64748b' }}>✉ {supervisor.email}</span>
            )}
            {supervisor.phone && (
              <span style={{ fontSize: 13, color: '#64748b' }}>☎ {supervisor.phone}</span>
            )}
          </div>
        )}
      </div>

      {/* Team stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Team Size', value: employees.length, dot: '#3b82f6' },
          { label: 'Meetings This Month', value: meetingsThisMonth, dot: '#10b981' },
          { label: 'Expiring Soon', value: expiringSoon, dot: '#f59e0b' },
          { label: 'Pending Actions', value: pendingActions, dot: '#ef4444' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '16px 18px',
            }}
          >
            <div
              style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, marginBottom: 10 }}
            />
            <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two columns: team breakdown + all-time stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Team composition */}
        <div
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '18px 20px',
          }}
        >
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
              margin: '0 0 14px',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Team Composition
          </h3>
          {sortedRoles.length === 0 ? (
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No employees yet.</p>
          ) : (
            sortedRoles.map((role) => {
              const count = roleCounts[role] ?? 0;
              const pct = Math.round((count / employees.length) * 100);
              return (
                <div key={role} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: '#374151',
                      marginBottom: 4,
                    }}
                  >
                    <span>{role}</span>
                    <span style={{ color: '#64748b' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: '#f1f5f9',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: '#3b82f6',
                        borderRadius: 4,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* All-time overview */}
        <div
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '18px 20px',
          }}
        >
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
              margin: '0 0 14px',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            All-Time Overview
          </h3>
          {[
            { label: 'Total qualifications tracked', value: totalQuals },
            { label: 'Total 1-on-1 meetings logged', value: totalMeetings },
            { label: 'Total action items pending', value: pendingActions },
            {
              label: 'Avg. qualifications per employee',
              value:
                employees.length > 0
                  ? (totalQuals / employees.length).toFixed(1)
                  : '—',
            },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f8fafc',
              }}
            >
              <span style={{ fontSize: 13, color: '#64748b' }}>{row.label}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick link */}
      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <button
          onClick={() => onNavigate({ name: 'employees' })}
          style={{ ...ghostBtn, fontSize: 13 }}
        >
          View All Employees →
        </button>
      </div>

      {/* Edit modal */}
      {editing && (
        <EditSupervisorModal
          supervisor={supervisor}
          onSave={(updated) => {
            dispatch({ type: 'UPDATE_SUPERVISOR', supervisor: updated });
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditSupervisorModal({
  supervisor,
  onSave,
  onClose,
}: {
  supervisor: Supervisor;
  onSave: (s: Supervisor) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Supervisor>({ ...supervisor });

  function set<K extends keyof Supervisor>(key: K, value: Supervisor[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Modal title="Edit Profile" onClose={onClose} maxWidth={500}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <FormField label="Full Name *">
            <input
              required
              style={inputStyle}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </FormField>
          <FormField label="Role *">
            <input
              required
              style={inputStyle}
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
            />
          </FormField>
          <FormField label="Department">
            <input
              style={inputStyle}
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
            />
          </FormField>
          <FormField label="Email">
            <input
              type="email"
              style={inputStyle}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </FormField>
          <FormField label="Phone">
            <input
              style={inputStyle}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </FormField>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={ghostBtn}>
            Cancel
          </button>
          <button type="submit" style={primaryBtn}>
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
