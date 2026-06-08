export type ID = string;

export type QualificationCategory =
  | 'W048 - B&S Vial Rinse'
  | 'W047 - B&S Filling A'
  | 'W047 - B&S Filling B'
  | 'W046 - B&S Capping'
  | 'W017 - GT180 Lyophilizer'
  | 'W017 - GT220 Lyophilizer'
  | 'W024 - INOVA Vial Rinse'
  | 'W027 - INOVA Filling A'
  | 'W027 - INOVA Filling B'
  | 'W024 - INOVA Capping'
  | 'W021 - Item Preparation'
  | 'W021 - W08 Autoclave'
  | 'W021 - W09 Autoclave';

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

export interface Supervisor {
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
}

export interface WikiDoc {
  id: ID;
  title: string;
  url: string;
  description: string;
  category: string;
  createdAt: string;
}

export interface AppState {
  supervisor: Supervisor;
  employees: Employee[];
  qualifications: Qualification[];
  meetings: Meeting[];
  wikiDocs: WikiDoc[];
}

export type Page =
  | { name: 'dashboard' }
  | { name: 'employees' }
  | { name: 'employee-detail'; employeeId: ID }
  | { name: 'profile' }
  | { name: 'wiki' };
