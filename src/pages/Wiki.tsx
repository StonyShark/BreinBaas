import { useState, useMemo } from 'react';
import { useStore } from '../store';
import type { WikiDoc } from '../types';
import {
  Modal,
  FormField,
  primaryBtn,
  ghostBtn,
  smallBtn,
  dangerBtn,
  inputStyle,
  textareaStyle,
  newId,
  formatDate,
} from '../shared';

type DocForm = Omit<WikiDoc, 'id' | 'createdAt'>;

const EMPTY_FORM: DocForm = {
  title: '',
  url: '',
  description: '',
  category: '',
};

export default function Wiki() {
  const { state, dispatch } = useStore();
  const { wikiDocs } = state;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<WikiDoc | null>(null);
  const [form, setForm] = useState<DocForm>(EMPTY_FORM);

  // All unique categories, sorted
  const categories = useMemo(
    () => [...new Set(wikiDocs.map((d) => d.category).filter(Boolean))].sort(),
    [wikiDocs]
  );

  // Filtered documents
  const filtered = useMemo(() => {
    let docs = [...wikiDocs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (activeCategory) docs = docs.filter((d) => d.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }
    return docs;
  }, [wikiDocs, activeCategory, search]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal('add');
  }

  function openEdit(doc: WikiDoc) {
    setEditing(doc);
    setForm({ title: doc.title, url: doc.url, description: doc.description, category: doc.category });
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modal === 'edit' && editing) {
      dispatch({ type: 'UPDATE_WIKI_DOC', doc: { ...form, id: editing.id, createdAt: editing.createdAt } });
    } else {
      dispatch({
        type: 'ADD_WIKI_DOC',
        doc: { ...form, id: newId(), createdAt: new Date().toISOString().split('T')[0] },
      });
    }
    closeModal();
  }

  function handleDelete(id: string) {
    const doc = wikiDocs.find((d) => d.id === id);
    if (doc && confirm(`Remove "${doc.title}" from the library?`)) {
      dispatch({ type: 'DELETE_WIKI_DOC', id });
    }
  }

  function set<K extends keyof DocForm>(key: K, value: DocForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            MyWiki — Document Library
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
            {wikiDocs.length} document{wikiDocs.length !== 1 ? 's' : ''} across{' '}
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <button onClick={openAdd} style={primaryBtn}>
          + Add Document
        </button>
      </div>

      {/* Search + category filters */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by title, description, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        />

        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <CategoryPill
              label="All"
              active={activeCategory === null}
              count={wikiDocs.length}
              onClick={() => setActiveCategory(null)}
            />
            {categories.map((cat) => (
              <CategoryPill
                key={cat}
                label={cat}
                active={activeCategory === cat}
                count={wikiDocs.filter((d) => d.category === cat).length}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Document grid */}
      {filtered.length === 0 ? (
        <EmptyState search={search} hasAny={wikiDocs.length > 0} onAdd={openAdd} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onEdit={() => openEdit(doc)}
              onDelete={() => handleDelete(doc.id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <Modal
          title={modal === 'edit' ? 'Edit Document' : 'Add Document'}
          onClose={closeModal}
          maxWidth={520}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <FormField label="Title *">
                <input
                  required
                  style={inputStyle}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. B&S Vial Rinse SOP"
                />
              </FormField>
              <FormField label="URL / Link *">
                <input
                  required
                  style={inputStyle}
                  value={form.url}
                  onChange={(e) => set('url', e.target.value)}
                  placeholder="https://…"
                  type="url"
                />
              </FormField>
              <FormField label="Category">
                <input
                  style={inputStyle}
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="e.g. SOPs, Training, Safety"
                  list="wiki-categories"
                />
                {/* Suggest existing categories */}
                <datalist id="wiki-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </FormField>
              <FormField label="Description">
                <textarea
                  style={{ ...textareaStyle, minHeight: 72 }}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Short description of what this document contains…"
                />
              </FormField>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={closeModal} style={ghostBtn}>
                Cancel
              </button>
              <button type="submit" style={primaryBtn}>
                {modal === 'edit' ? 'Save Changes' : 'Add Document'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Document card ─────────────────────────────────────────────────────────────

function DocCard({
  doc,
  onEdit,
  onDelete,
}: {
  doc: WikiDoc;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Pick an accent colour based on category name
  const accent = categoryAccent(doc.category);

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Colour bar */}
      <div style={{ height: 4, background: accent }} />

      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#0f172a',
              textDecoration: 'none',
              lineHeight: 1.3,
              flex: 1,
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#2563eb')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#0f172a')}
          >
            {doc.title}
          </a>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>↗</span>
        </div>

        {/* Description */}
        {doc.description && (
          <p
            style={{
              fontSize: 13,
              color: '#64748b',
              margin: 0,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {doc.description}
          </p>
        )}

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {doc.category && (
              <span
                style={{
                  fontSize: 11,
                  background: accent + '20',
                  color: accent,
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {doc.category}
              </span>
            )}
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatDate(doc.createdAt)}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onEdit} style={smallBtn}>
              Edit
            </button>
            <button onClick={onDelete} style={dangerBtn}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Category pill ─────────────────────────────────────────────────────────────

function CategoryPill({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#2563eb' : 'white',
        color: active ? 'white' : '#374151',
        border: `1px solid ${active ? '#2563eb' : '#d1d5db'}`,
        padding: '5px 12px',
        borderRadius: 20,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.15s',
      }}
    >
      {label}
      <span
        style={{
          fontSize: 11,
          background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
          color: active ? 'white' : '#64748b',
          padding: '0 5px',
          borderRadius: 10,
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  search,
  hasAny,
  onAdd,
}: {
  search: string;
  hasAny: boolean;
  onAdd: () => void;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 20px',
        color: '#94a3b8',
        background: 'white',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
      {search ? (
        <p style={{ fontSize: 14, margin: 0 }}>No documents match your search.</p>
      ) : hasAny ? (
        <p style={{ fontSize: 14, margin: 0 }}>No documents in this category.</p>
      ) : (
        <>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#64748b', margin: '0 0 8px' }}>
            Your document library is empty
          </p>
          <p style={{ fontSize: 13, margin: '0 0 20px' }}>
            Add SOPs, training materials, safety sheets, or any link you want quick access to.
          </p>
          <button onClick={onAdd} style={primaryBtn}>
            + Add First Document
          </button>
        </>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCENT_PALETTE = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#0ea5e9', '#14b8a6',
  '#f97316', '#84cc16',
];

function categoryAccent(category: string): string {
  if (!category) return '#94a3b8';
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length];
}
