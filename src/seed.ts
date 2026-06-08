import type { AppState, Employee, Supervisor } from './types';


export const DEFAULT_SUPERVISOR: Supervisor = {
  name: 'Michael Stouten',
  role: 'Teamlead',
  department: 'Operations',
  email: '',
  phone: '',
};

function emp(id: string, name: string, role: string): Employee {
  return {
    id,
    name,
    role,
    department: 'Operations',
    email: '',
    phone: '',
    startDate: '',
    notes: '',
  };
}

export const SEED_STATE: AppState = {
  supervisor: DEFAULT_SUPERVISOR,
  employees: [
    emp('seed-01', 'Lahcen Ait Ali',           'Senior Operator'),
    emp('seed-02', 'Steve Bhagwandin',          'Process Operator A'),
    emp('seed-03', 'Aart van Essen',            'Process Operator B'),
    emp('seed-04', 'Marion Hasselbaink',        'Process Operator C'),
    emp('seed-05', 'Arthur van Heningen',       'Process Operator A'),
    emp('seed-06', 'Benjamin Hurenkamp',        'Process Operator B'),
    emp('seed-07', 'Linda Jermukli',            'Senior Operator'),
    emp('seed-08', 'Mohamed Kountich',          'Process Operator B'),
    emp('seed-09', 'Rennie Marcos',             'Process Operator B'),
    emp('seed-10', 'Elizabeth Mensah',          'Process Operator C'),
    emp('seed-11', 'Tin Mestrovic',             'Process Operator B'),
    emp('seed-12', 'Nagham Serafi',             'Process Operator B'),
    emp('seed-13', 'Marcela da Silva Amaral',   'Process Operator B'),
    emp('seed-14', 'Mithurshan Sivanantha',     'Process Operator B'),
    emp('seed-15', 'Klaudia Szymczak',          'Process Operator A'),
    emp('seed-16', 'Sheritsa Thomas',           'Process Operator B'),
    emp('seed-17', 'Craig Young',               'Process Operator B'),
  ],
  qualifications: [],
  meetings: [],
  wikiDocs: [],
};
