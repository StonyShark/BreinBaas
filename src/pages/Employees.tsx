import { useState } from 'react';
import { useStore } from '../store';
import type { Employee, Page } from '../types';
import {
  Avatar,
  Modal,
  FormField,
  primaryBtn,
  ghostBtn,
  inputStyle,
  textareaStyle,
  newId,
  formatDate,
} from '../shared';

interface Props {
  onNavigate: (p: Page) => void;
}

type EmployeeForm = Omit<Employee, 'id'>;

const EMPTY_FORM: EmployeeForm = {
  name: '',
  role: '',
  department: '',
  email: '',
  phone: '',
  startDate: '',
  notes: '',
};

export default function Employees({ onNavigate }: Props) {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);

  const filtered = state.employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModal('add');
  }

  function openEdit(e: Employee) {
    const { id: _id, ...rest } = e;
    setForm(rest);
    setEditing(e);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (modal === 'edit' && editing) {
      dispatch({ type: 'UPDATE_EMPLOYEE', employee: { ...form, id: editing.id } });
    } else {
      dispatch({ type: 'ADD_EMPLOYEE', employee: { ...form, id: newId() } });
    }
    closeModal();
  }

  function handleDelete(id: string) {
    const emp = state.employees.find((e) => e.id === id);
    if (!emp) return;
    if (confirm(`Delete ${emp.name}? This will also remove all their qualifications and meetings.`)) {
      dispatch({ type: 'DELETE_EMPLOYEE', id });
    }
  }

  function set<K extends keyof EmployeeForm>(key: K, value: EmployeeForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Employees
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
            {state.employees.length} team members
          </p>
        </div>
        <button onClick={openAdd} style={primaryBtn}>
          + Add Employee
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, role, or department…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          ...inputStyle,
          marginBottom: 20,
          padding: '10px 14px',
        }}
      />

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          {search
            ? 'No employees match your search.'
            : 'No employees yet. Add your first team member.'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              qualCount={state.qualifications.filter((q) => q.employeeId === emp.id).length}
              meetCount={state.meetings.filter((m) => m.employeeId === emp.id).length}
              lastMeeting={
                state.meetings
                  .filter((m) => m.employeeId === emp.id)
                  .sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? null
              }
              onView={() => onNavigate({ name: 'employee-detail', employeeId: emp.id })}
              onEdit={() => openEdit(emp)}
              onDelete={() => handleDelete(emp.id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <Modal
          title={modal === 'edit' ? 'Edit Employee' : 'Add Employee'}
          onClose={closeModal}
          maxWidth={600}
        >
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
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
            </div>
            <div style={{ marginBottom: 20 }}>
              <FormField label="Notes">
                <textarea
                  style={textareaStyle}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                />
              </FormField>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={closeModal} style={ghostBtn}>
                Cancel
              </button>
              <button type="submit" style={primaryBtn}>
                {modal === 'edit' ? 'Save Changes' : 'Add Employee'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Employee Card ────────────────────────────────────────────────────────────

function EmployeeCard({
  employee,
  qualCount,
  meetCount,
  lastMeeting,
  onView,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  qualCount: number;
  meetCount: number;
  lastMeeting: string | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 10,
        padding: 20,
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
      onClick={onView}
    >
      {/* Top row: avatar + name + menu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={employee.name} size={44} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{employee.name}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 1 }}>{employee.role}</div>
          </div>
        </div>
        <div
          style={{ display: 'flex', gap: 4 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            title="Edit"
            onClick={onEdit}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#94a3b8',
              fontSize: 14,
            }}
          >
            ✎
          </button>
          <button
            title="Delete"
            onClick={onDelete}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: '#94a3b8',
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Department tag */}
      <div style={{ marginTop: 14 }}>
        <span
          style={{
            fontSize: 12,
            background: '#f1f5f9',
            color: '#475569',
            padding: '3px 10px',
            borderRadius: 20,
          }}
        >
          {employee.department}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          <strong style={{ color: '#1e293b' }}>{qualCount}</strong> qualifications
        </span>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          <strong style={{ color: '#1e293b' }}>{meetCount}</strong> meetings
        </span>
      </div>

      {/* Last meeting */}
      {lastMeeting && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
          Last meeting: {formatDate(lastMeeting)}
        </div>
      )}
    </div>
  );
}
