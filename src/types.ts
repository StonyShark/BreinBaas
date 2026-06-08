export type ID = string;

export type QualificationCategory =
  | 'Safety'
  | 'Technical'
  | 'Compliance'
  | 'Leadership'
  | 'Soft Skills'
  | 'Other';

export type QualificationLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type MeetingSentiment = 'Positive' | 'Neutral' | 'Negative';

export interface ActionItem {
  id: ID;
  text: string;
  done: boolean;
}

export interface Meeting {
  id: ID;
  employeeId: ID;
  date: string;
  durationMinutes: number;
  agenda: string;
  notes: string;
  sentiment: MeetingSentiment;
  actionItems: ActionItem[];
}

export interface Qualification {
  id: ID;
  employeeId: ID;
  name: string;
  category: QualificationCategory;
  level: QualificationLevel;
  dateAcquired: string;
  expiryDate: string | null;
  certNumber: string;
  notes: string;
}

export interface Employee {
  id: ID;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  startDate: string;
  notes: string;
}

export interface AppState {
  employees: Employee[];
  qualifications: Qualification[];
  meetings: Meeting[];
}

export type Page =
  | { name: 'dashboard' }
  | { name: 'employees' }
  | { name: 'employee-detail'; employeeId: ID };
