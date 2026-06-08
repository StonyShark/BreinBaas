import { useState } from 'react';
import { StoreProvider, useStore } from './store';
import type { Page } from './types';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'dashboard' });

  return (
    <StoreProvider>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: 14,
          color: '#0f172a',
        }}
      >
        <Sidebar page={page} onNavigate={setPage} />
        <main style={{ flex: 1, overflow: 'auto', background: '#f8fafc' }}>
          {page.name === 'dashboard' && <Dashboard onNavigate={setPage} />}
          {page.name === 'employees' && <Employees onNavigate={setPage} />}
          {page.name === 'employee-detail' && (
            <EmployeeDetail employeeId={page.employeeId} onNavigate={setPage} />
          )}
        </main>
      </div>
    </StoreProvider>
  );
}

const NAV: Array<{ label: string; target: { name: 'dashboard' } | { name: 'employees' }; icon: string }> = [
  { label: 'Dashboard', target: { name: 'dashboard' }, icon: '⊞' },
  { label: 'Employees', target: { name: 'employees' }, icon: '◎' },
];

function Sidebar({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  const { state } = useStore();

  return (
    <aside
      style={{
        width: 224,
        background: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: '1px solid #0f172a',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #334155' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>
          MyProthya Portal
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '8px 0', flex: 1 }}>
        {NAV.map((item) => {
          const active = page.name === item.target.name;
          return (
            <button
              key={item.target.name}
              onClick={() => onNavigate(item.target)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 20px',
                background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                border: 'none',
                borderLeft: `3px solid ${active ? '#3b82f6' : 'transparent'}`,
                cursor: 'pointer',
                color: active ? '#93c5fd' : '#94a3b8',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                textAlign: 'left',
                transition: 'color 0.15s',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #334155' }}>
        <div style={{ fontSize: 12, color: '#475569' }}>
          {state.employees.length}{' '}
          {state.employees.length === 1 ? 'employee' : 'employees'}
        </div>
      </div>
    </aside>
  );
}
