import { createContext, useContext, useReducer, useEffect, createElement } from 'react';
import type { ReactNode, Dispatch } from 'react';
import type { AppState, Employee, Qualification, Meeting, Supervisor, ID } from './types';
import { SEED_STATE, DEFAULT_SUPERVISOR } from './seed';

type Action =
  | { type: 'UPDATE_SUPERVISOR'; supervisor: Supervisor }
  | { type: 'ADD_EMPLOYEE'; employee: Employee }
  | { type: 'UPDATE_EMPLOYEE'; employee: Employee }
  | { type: 'DELETE_EMPLOYEE'; id: ID }
  | { type: 'ADD_QUALIFICATION'; qualification: Qualification }
  | { type: 'UPDATE_QUALIFICATION'; qualification: Qualification }
  | { type: 'DELETE_QUALIFICATION'; id: ID }
  | { type: 'ADD_MEETING'; meeting: Meeting }
  | { type: 'UPDATE_MEETING'; meeting: Meeting }
  | { type: 'DELETE_MEETING'; id: ID };

export type StoreDispatch = Dispatch<Action>;

const STORAGE_KEY = 'employee_portal_v2';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        supervisor: parsed.supervisor ?? DEFAULT_SUPERVISOR,
        employees: parsed.employees ?? [],
        qualifications: parsed.qualifications ?? [],
        meetings: parsed.meetings ?? [],
      };
    }
  } catch {
    // corrupted data — fall through to seed
  }
  return SEED_STATE;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'UPDATE_SUPERVISOR':
      return { ...state, supervisor: action.supervisor };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.employee] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map((e) =>
          e.id === action.employee.id ? action.employee : e
        ),
      };
    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter((e) => e.id !== action.id),
        qualifications: state.qualifications.filter((q) => q.employeeId !== action.id),
        meetings: state.meetings.filter((m) => m.employeeId !== action.id),
      };
    case 'ADD_QUALIFICATION':
      return { ...state, qualifications: [...state.qualifications, action.qualification] };
    case 'UPDATE_QUALIFICATION':
      return {
        ...state,
        qualifications: state.qualifications.map((q) =>
          q.id === action.qualification.id ? action.qualification : q
        ),
      };
    case 'DELETE_QUALIFICATION':
      return {
        ...state,
        qualifications: state.qualifications.filter((q) => q.id !== action.id),
      };
    case 'ADD_MEETING':
      return { ...state, meetings: [...state.meetings, action.meeting] };
    case 'UPDATE_MEETING':
      return {
        ...state,
        meetings: state.meetings.map((m) =>
          m.id === action.meeting.id ? action.meeting : m
        ),
      };
    case 'DELETE_MEETING':
      return {
        ...state,
        meetings: state.meetings.filter((m) => m.id !== action.id),
      };
  }
}

interface StoreContextValue {
  state: AppState;
  dispatch: StoreDispatch;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (ctx === null) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, loadState());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return createElement(StoreContext.Provider, { value: { state, dispatch } }, children);
}
