import { useState } from 'react';
import { useStore } from '../store';
import type {
  Employee,
  Qualification,
  Meeting,
  ActionItem,
  QualificationCategory,
  QualificationLevel,
  MeetingSentiment,
  Page,
} from '../types';
import {
  Avatar,
  Modal,
  FormField,
  LevelBadge,
  SentimentBadge,
  primaryBtn,
  ghostBtn,
  smallBtn,
  dangerBtn,
  inputStyle,
  selectStyle,
  textareaStyle,
  formatDate,
  expiryLabel,
  newId,
} from '../shared';

interface Props {
  employeeId: string;
  onNavigate: (p: Page) => void;
}

type Tab = 'qualifications' | 'meetings';

export default function EmployeeDetail({ employeeId, onNavigate }: Props) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<Tab>('qualifications');
  const [editingEmp, setEditingEmp] = useState(false);

  const employee = state.employees.find((e) => e.id === employeeId);

  if (!employee) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <p>Employee not found.</p>
        <button onClick={() => onNavigate({ name: 'employees' })} style={primaryBtn}>
          Back to Employees
        </button>
      </div>
    );
  }

  const qualifications = state.qualifications
    .filter((q) => q.employeeId === employeeId)
    .sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return a.name.localeCompare(b.name);
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    });

  const meetings = state.meetings
    .filter((m) => m.employeeId === employeeId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const pendingActions = meetings.reduce(
    (sum, m) => sum + m.actionItems.filter((a) => !a.done).length,
    0
  );

  return (
    <div style={{ padding: '32px 36px', maxWidth: 960 }}>
      {/* Back */}
      <button
        onClick={() => onNavigate({ name: 'employees' })}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#64748b',
          fontSize: 13,
          padding: 0,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        ← Back to Employees
      </button>

      {/* Employee header */}
      <div
        style={{
          background: 'white',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={employee.name} size={56} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {employee.name}
            </h1>
            <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
              {employee.role} · {employee.department}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {employee.email && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>✉ {employee.email}</span>
              )}
              {employee.phone && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>☎ {employee.phone}</span>
              )}
              {employee.startDate && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Started {formatDate(employee.startDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                {qualifications.length}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Qualifications</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                {meetings.length}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Meetings</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: pendingActions > 0 ? '#ef4444' : '#0f172a',
                }}
              >
                {pendingActions}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Pending</div>
            </div>
          </div>
          <button onClick={() => setEditingEmp(true)} style={ghostBtn}>
            Edit
          </button>
        </div>
      </div>

      {/* Notes */}
      {employee.notes && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 20,
            fontSize: 13,
            color: '#78350f',
          }}
        >
          {employee.notes}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid #e2e8f0',
          marginBottom: 24,
        }}
      >
        {(['qualifications', 'meetings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t ? '#3b82f6' : 'transparent'}`,
              marginBottom: -2,
              cursor: 'pointer',
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? '#3b82f6' : '#64748b',
              textTransform: 'capitalize',
            }}
          >
            {t}
            <span
              style={{
                marginLeft: 6,
                fontSize: 12,
                background: tab === t ? '#eff6ff' : '#f1f5f9',
                color: tab === t ? '#3b82f6' : '#94a3b8',
                padding: '1px 6px',
                borderRadius: 20,
              }}
            >
              {t === 'qualifications' ? qualifications.length : meetings.length}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'qualifications' && (
        <QualificationsTab employeeId={employeeId} qualifications={qualifications} />
      )}
      {tab === 'meetings' && (
        <MeetingsTab employeeId={employeeId} meetings={meetings} />
      )}

      {/* Edit Employee modal */}
      {editingEmp && (
        <EditEmployeeModal
          employee={employee}
          onSave={(updated) => {
            dispatch({ type: 'UPDATE_EMPLOYEE', employee: updated });
            setEditingEmp(false);
          }}
          onClose={() => setEditingEmp(false)}
        />
      )}
    </div>
  );
}

// ── Qualifications Tab ───────────────────────────────────────────────────────

function QualificationsTab({
  employeeId,
  qualifications,
}: {
  employeeId: string;
  qualifications: Qualification[];
}) {
  const { dispatch } = useStore();
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Qualification | null>(null);

  function openAdd() {
    setEditing(null);
    setModal('add');
  }

  function openEdit(q: Qualification) {
    setEditing(q);
    setModal('edit');
  }

  function close() {
    setModal(null);
    setEditing(null);
  }

  function handleDelete(id: string) {
    const q = qualifications.find((x) => x.id === id);
    if (q && confirm(`Remove qualification "${q.name}"?`)) {
      dispatch({ type: 'DELETE_QUALIFICATION', id });
    }
  }

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}
      >
        <span style={{ fontSize: 13, color: '#64748b' }}>
          {qualifications.length} qualification{qualifications.length !== 1 ? 's' : ''}
        </span>
        <button onClick={openAdd} style={primaryBtn}>
          + Add Qualification
        </button>
      </div>

      {qualifications.length === 0 ? (
        <EmptyState text="No qualifications recorded. Add the first one." />
      ) : (
        <div
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Qualification', 'Qualification Type', 'Level', 'Acquired', 'Expires', 'Cert #', ''].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {qualifications.map((q) => {
                const expiry = expiryLabel(q.expiryDate);
                return (
                  <tr
                    key={q.id}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{q.name}</div>
                      {q.notes && (
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{q.notes}</div>
                      )}
                    </td>
                    <td style={tdStyle}>{q.category}</td>
                    <td style={tdStyle}>
                      <LevelBadge level={q.level} />
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(q.dateAcquired)}</td>
                    <td style={tdStyle}>
                      {expiry ? (
                        <span
                          style={{
                            fontSize: 12,
                            background: expiry.bg,
                            color: expiry.color,
                            padding: '2px 8px',
                            borderRadius: 20,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {expiry.text}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>No expiry</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: '#94a3b8' }}>{q.certNumber || '—'}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(q)} style={smallBtn}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(q.id)} style={dangerBtn}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <QualificationModal
          employeeId={employeeId}
          editing={editing}
          onClose={close}
        />
      )}
    </div>
  );
}

const tdStyle = {
  padding: '12px 14px',
  fontSize: 13,
  color: '#374151',
  verticalAlign: 'top' as const,
};

// ── Meetings Tab ──────────────────────────────────────────────────────────────

function MeetingsTab({
  employeeId,
  meetings,
}: {
  employeeId: string;
  meetings: Meeting[];
}) {
  const { dispatch } = useStore();
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Meeting | null>(null);

  function openAdd() {
    setEditing(null);
    setModal('add');
  }

  function openEdit(m: Meeting) {
    setEditing(m);
    setModal('edit');
  }

  function close() {
    setModal(null);
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('Delete this meeting record?')) {
      dispatch({ type: 'DELETE_MEETING', id });
    }
  }

  function toggleAction(meeting: Meeting, actionId: string) {
    dispatch({
      type: 'UPDATE_MEETING',
      meeting: {
        ...meeting,
        actionItems: meeting.actionItems.map((a) =>
          a.id === actionId ? { ...a, done: !a.done } : a
        ),
      },
    });
  }

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}
      >
        <span style={{ fontSize: 13, color: '#64748b' }}>
          {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
        </span>
        <button onClick={openAdd} style={primaryBtn}>
          + Log Meeting
        </button>
      </div>

      {meetings.length === 0 ? (
        <EmptyState text="No 1-on-1 meetings recorded. Log the first one." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {meetings.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onEdit={() => openEdit(m)}
              onDelete={() => handleDelete(m.id)}
              onToggleAction={(actionId) => toggleAction(m, actionId)}
            />
          ))}
        </div>
      )}

      {modal && (
        <MeetingModal
          employeeId={employeeId}
          editing={editing}
          onClose={close}
        />
      )}
    </div>
  );
}

// ── Meeting Card ─────────────────────────────────────────────────────────────

function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  onToggleAction,
}: {
  meeting: Meeting;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAction: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const doneCount = meeting.actionItems.filter((a) => a.done).length;

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid #f1f5f9' : 'none',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            {formatDate(meeting.date)}
          </span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{meeting.durationMinutes} min</span>
          <SentimentBadge sentiment={meeting.sentiment} />
          {meeting.actionItems.length > 0 && (
            <span
              style={{
                fontSize: 12,
                color: doneCount < meeting.actionItems.length ? '#f59e0b' : '#10b981',
                background: doneCount < meeting.actionItems.length ? '#fffbeb' : '#f0fdf4',
                padding: '2px 8px',
                borderRadius: 20,
              }}
            >
              {doneCount}/{meeting.actionItems.length} actions
            </span>
          )}
          {meeting.agenda && (
            <span style={{ fontSize: 13, color: '#475569' }}>— {meeting.agenda}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} style={smallBtn}>
            Edit
          </button>
          <button onClick={onDelete} style={dangerBtn}>
            Delete
          </button>
        </div>
        <span style={{ color: '#94a3b8', fontSize: 12, userSelect: 'none' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Card body */}
      {expanded && (
        <div style={{ padding: '16px' }}>
          {/* Notes */}
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {meeting.notes}
          </div>

          {/* Action items */}
          {meeting.actionItems.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: 8,
                }}
              >
                Action Items
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {meeting.actionItems.map((action) => (
                  <div
                    key={action.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={action.done}
                      onChange={() => onToggleAction(action.id)}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        color: action.done ? '#94a3b8' : '#374151',
                        textDecoration: action.done ? 'line-through' : 'none',
                      }}
                    >
                      {action.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Qualification Modal ───────────────────────────────────────────────────────

const QUAL_CATEGORIES: QualificationCategory[] = [
  'W048 - B&S Vial Rinse',
  'W047 - B&S Filling A',
  'W047 - B&S Filling B',
  'W046 - B&S Capping',
  'W017 - GT180 Lyophilizer',
  'W017 - GT220 Lyophilizer',
  'W024 - INOVA Vial Rinse',
  'W027 - INOVA Filling A',
  'W027 - INOVA Filling B',
  'W024 - INOVA Capping',
  'W021 - Item Preparation',
  'W021 - W08 Autoclave',
  'W021 - W09 Autoclave',
];
const QUAL_LEVELS: QualificationLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

type QualForm = Omit<Qualification, 'id' | 'employeeId'>;

const EMPTY_QUAL: QualForm = {
  name: '',
  category: 'W048 - B&S Vial Rinse',
  level: 'Beginner',
  dateAcquired: '',
  expiryDate: null,
  certNumber: '',
  notes: '',
};

function QualificationModal({
  employeeId,
  editing,
  onClose,
}: {
  employeeId: string;
  editing: Qualification | null;
  onClose: () => void;
}) {
  const { dispatch } = useStore();
  const [form, setForm] = useState<QualForm>(
    editing ? { name: editing.name, category: editing.category, level: editing.level, dateAcquired: editing.dateAcquired, expiryDate: editing.expiryDate, certNumber: editing.certNumber, notes: editing.notes } : EMPTY_QUAL
  );

  function set<K extends keyof QualForm>(key: K, value: QualForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      dispatch({ type: 'UPDATE_QUALIFICATION', qualification: { ...form, id: editing.id, employeeId } });
    } else {
      dispatch({ type: 'ADD_QUALIFICATION', qualification: { ...form, id: newId(), employeeId } });
    }
    onClose();
  }

  return (
    <Modal
      title={editing ? 'Edit Qualification' : 'Add Qualification'}
      onClose={onClose}
      maxWidth={580}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Qualification Name *">
              <input
                required
                style={inputStyle}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. AWS Solutions Architect"
              />
            </FormField>
          </div>
          <FormField label="Qualification *">
            <select
              required
              style={selectStyle}
              value={form.category}
              onChange={(e) => set('category', e.target.value as QualificationCategory)}
            >
              {QUAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Level *">
            <select
              required
              style={selectStyle}
              value={form.level}
              onChange={(e) => set('level', e.target.value as QualificationLevel)}
            >
              {QUAL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Date Acquired *">
            <input
              required
              type="date"
              style={inputStyle}
              value={form.dateAcquired}
              onChange={(e) => set('dateAcquired', e.target.value)}
            />
          </FormField>
          <FormField label="Expiry Date">
            <input
              type="date"
              style={inputStyle}
              value={form.expiryDate ?? ''}
              onChange={(e) => set('expiryDate', e.target.value || null)}
            />
          </FormField>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Certificate / Reference Number">
              <input
                style={inputStyle}
                value={form.certNumber}
                onChange={(e) => set('certNumber', e.target.value)}
                placeholder="e.g. CERT-2024-001"
              />
            </FormField>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Notes">
              <textarea
                style={textareaStyle}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </FormField>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={ghostBtn}>
            Cancel
          </button>
          <button type="submit" style={primaryBtn}>
            {editing ? 'Save Changes' : 'Add Qualification'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Meeting Modal ─────────────────────────────────────────────────────────────

const SENTIMENTS: MeetingSentiment[] = ['Positive', 'Neutral', 'Negative'];

type MeetingForm = Omit<Meeting, 'id' | 'employeeId'>;

const todayIso = new Date().toISOString().split('T')[0];

const EMPTY_MEETING: MeetingForm = {
  date: todayIso,
  durationMinutes: 60,
  agenda: '',
  notes: '',
  sentiment: 'Positive',
  actionItems: [],
};

function MeetingModal({
  employeeId,
  editing,
  onClose,
}: {
  employeeId: string;
  editing: Meeting | null;
  onClose: () => void;
}) {
  const { dispatch } = useStore();
  const [form, setForm] = useState<MeetingForm>(
    editing
      ? {
          date: editing.date,
          durationMinutes: editing.durationMinutes,
          agenda: editing.agenda,
          notes: editing.notes,
          sentiment: editing.sentiment,
          actionItems: editing.actionItems,
        }
      : EMPTY_MEETING
  );
  const [newActionText, setNewActionText] = useState('');

  function setField<K extends keyof MeetingForm>(key: K, value: MeetingForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addAction() {
    const text = newActionText.trim();
    if (!text) return;
    const item: ActionItem = { id: newId(), text, done: false };
    setForm((prev) => ({ ...prev, actionItems: [...prev.actionItems, item] }));
    setNewActionText('');
  }

  function removeAction(id: string) {
    setForm((prev) => ({ ...prev, actionItems: prev.actionItems.filter((a) => a.id !== id) }));
  }

  function toggleAction(id: string) {
    setForm((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((a) => (a.id === id ? { ...a, done: !a.done } : a)),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      dispatch({ type: 'UPDATE_MEETING', meeting: { ...form, id: editing.id, employeeId } });
    } else {
      dispatch({ type: 'ADD_MEETING', meeting: { ...form, id: newId(), employeeId } });
    }
    onClose();
  }

  return (
    <Modal
      title={editing ? 'Edit Meeting' : 'Log 1-on-1 Meeting'}
      onClose={onClose}
      maxWidth={600}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <FormField label="Date *">
            <input
              required
              type="date"
              style={inputStyle}
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
            />
          </FormField>
          <FormField label="Duration (minutes) *">
            <input
              required
              type="number"
              min={5}
              max={480}
              style={inputStyle}
              value={form.durationMinutes}
              onChange={(e) => setField('durationMinutes', Number(e.target.value))}
            />
          </FormField>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Agenda">
              <input
                style={inputStyle}
                value={form.agenda}
                onChange={(e) => setField('agenda', e.target.value)}
                placeholder="e.g. Career development, Q2 goals"
              />
            </FormField>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Meeting Notes *">
              <textarea
                required
                style={{ ...textareaStyle, minHeight: 120 }}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Key discussion points, outcomes, observations…"
              />
            </FormField>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Overall Sentiment *">
              <div style={{ display: 'flex', gap: 8 }}>
                {SENTIMENTS.map((s) => {
                  const selected = form.sentiment === s;
                  const colors: Record<string, { border: string; bg: string; text: string }> = {
                    Positive: { border: '#86efac', bg: selected ? '#f0fdf4' : 'white', text: '#16a34a' },
                    Neutral:  { border: '#cbd5e1', bg: selected ? '#f8fafc' : 'white', text: '#475569' },
                    Negative: { border: '#fca5a5', bg: selected ? '#fef2f2' : 'white', text: '#dc2626' },
                  };
                  const c = colors[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setField('sentiment', s)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: `2px solid ${selected ? c.border : '#e2e8f0'}`,
                        borderRadius: 8,
                        background: c.bg,
                        color: selected ? c.text : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: selected ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </FormField>
          </div>
        </div>

        {/* Action items */}
        <div style={{ marginBottom: 20 }}>
          <FormField label="Action Items">
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                placeholder="Add an action item…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAction();
                  }
                }}
              />
              <button type="button" onClick={addAction} style={ghostBtn}>
                Add
              </button>
            </div>
            {form.actionItems.length > 0 && (
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                {form.actionItems.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderBottom: '1px solid #f1f5f9',
                      background: 'white',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={a.done}
                      onChange={() => toggleAction(a.id)}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: a.done ? '#94a3b8' : '#374151',
                        textDecoration: a.done ? 'line-through' : 'none',
                      }}
                    >
                      {a.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAction(a.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        fontSize: 16,
                        lineHeight: 1,
                        padding: 2,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormField>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={ghostBtn}>
            Cancel
          </button>
          <button type="submit" style={primaryBtn}>
            {editing ? 'Save Changes' : 'Log Meeting'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Employee Modal ───────────────────────────────────────────────────────

function EditEmployeeModal({
  employee,
  onSave,
  onClose,
}: {
  employee: Employee;
  onSave: (updated: Employee) => void;
  onClose: () => void;
}) {
  type EmpForm = Omit<Employee, 'id'>;
  const [form, setForm] = useState<EmpForm>({
    name: employee.name,
    role: employee.role,
    department: employee.department,
    email: employee.email,
    phone: employee.phone,
    startDate: employee.startDate,
    notes: employee.notes,
  });

  function set<K extends keyof EmpForm>(key: K, value: EmpForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ ...form, id: employee.id });
  }

  return (
    <Modal title="Edit Employee" onClose={onClose} maxWidth={600}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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
          <FormField label="Department *">
            <input
              required
              style={inputStyle}
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
            />
          </FormField>
          <FormField label="Email *">
            <input
              required
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
          <FormField label="Start Date *">
            <input
              required
              type="date"
              style={inputStyle}
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </FormField>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Notes">
              <textarea
                style={textareaStyle}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </FormField>
          </div>
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

// ── Shared ────────────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#94a3b8',
        background: 'white',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        fontSize: 13,
      }}
    >
      {text}
    </div>
  );
}
