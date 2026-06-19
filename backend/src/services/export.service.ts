import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase.js';

// ─── Mappers (duplicated from students.controller to avoid circular dep) ───
const genderFromDb: Record<string, string> = { 'M': 'MASCULINO', 'F': 'FEMENINO', 'O': 'OTRO' };
const maritalFromDb: Record<string, string> = { 'S': 'SOLTERO', 'C': 'CASADO', 'D': 'DIVORCIADO', 'V': 'VIUDO' };
const typeFromDb: Record<string, string> = { 'CIV': 'CIVIL', 'MIL': 'MILITAR' };

// ─── Types ───

export interface ExportEnvelope<T> {
  exportVersion: string;
  exportedAt: string;
  entity: string;
  total: number;
  data: T[];
}

export interface ExportedStudent {
  STUDENTS_ID: number;
  person_id: number | null;
  identificationPrefix: string;
  identificationNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  email: string;
  phone: string | null;
  gender: string;
  birthdate: string | null;
  address: string | null;
  maritalStatus: string;
  studentType: string;
  militaryRank: string | null;
  employment: string;
  registrationDate: string | null;
  status: number;
  practices: ExportedPractice[];
  documents: ExportedDocument[];
  requests: ExportedRequest[];
  evaluations: ExportedEvaluation[];
  activityLogs: ExportedActivityLog[];
  addresses: ExportedAddress[];
  prospectListItems: ExportedProspectItem[];
}

interface ExportedPractice {
  PROFESSIONAL_PRACTICE_ID: number;
  START_DATE: string;
  END_DATE: string | null;
  PERIOD_ID: number;
  INSTITUTION_ID: number | null;
  CAREER_ID: number;
  INTERNSHIP_TYPE_ID: number;
  PRACTICES_STATUS: number;
  INTERNSHIP_STATUS: number;
  SEMESTER: string;
  SECTION: string;
  REGIME: string;
  GRADE: number | null;
  tutors: ExportedPracticeTutor[];
  activityLogs: ExportedActivityLog[];
  evaluations: ExportedEvaluation[];
}

interface ExportedPracticeTutor {
  TUTOR_ID: number;
  TUTOR_TYPE: string;
}

interface ExportedDocument {
  DOCUMENT_ID: number;
  DOCUMENT_TYPE: string;
  TITLE: string;
  FILE_NAME: string;
  STATUS: string;
  UPLOADED_AT: string;
}

interface ExportedRequest {
  REQUEST_ID: number;
  REQUEST_TYPE_ID: number;
  SUBJECT: string;
  DESCRIPTION: string;
  STATUS: string;
  RESPONSE: string | null;
  CREATION_DATE: string;
}

interface ExportedEvaluation {
  EVALUATION_ID: number;
  PROFESSIONAL_PRACTICE_ID: number | null;
  STATUS: number | null;
  GRADE: number | null;
  CREATED_AT: string | null;
}

interface ExportedActivityLog {
  ACTIVITY_LOG_ID: number;
  PROFESSIONAL_PRACTICE_ID: number;
  ACTIVITY_DATE: string;
  WEEK_NUMBER: number | null;
  HOURS_WORKED: number;
  ACTIVITY_TYPE: string;
  ACTIVITY_DESCRIPTION: string;
  STATUS: number;
}

interface ExportedAddress {
  person_address_id: number;
  address_id: number;
  address_type_id: number;
  is_primary: boolean;
}

interface ExportedProspectItem {
  PROSPECT_LIST_ITEM_ID: number;
  LIST_ID: number;
  STATUS: number;
}

export interface ExportedTutor {
  TUTOR_ID: number;
  identificationPrefix: string;
  identificationNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  email: string;
  phone: string | null;
  profession: string;
  condition: string;
  dedication: string;
  category: string;
  status: number;
  assignedPractices: {
    PROFESSIONAL_PRACTICES_TUTOR_ID: number;
    PROFESSIONAL_PRACTICE_ID: number;
    TUTOR_TYPE: string;
    student: {
      STUDENTS_ID: number;
      studentName: string;
      studentCi: string;
    } | null;
  }[];
}

export interface ExportedInstitution {
  INSTITUTION_ID: number;
  INSTITUTION_NAME: string;
  INSTITUTION_ADDRESS: string;
  INSTITUTION_CONTACT: string;
  PRACTICE_TYPE: string;
  REGION: string;
  NUCLEUS: string;
  EXTENSION: string;
  INSTITUTION_TYPE: string;
  RIF: string;
  INSTITUTION_CODE: string;
  STATUS: number;
  managers: ExportedManager[];
  careers: ExportedInstitutionCareer[];
}

export interface ExportedManager {
  MANAGER_ID: number;
  ci: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  cargo: string | null;
  STATUS: number;
}

interface ExportedInstitutionCareer {
  CAREER_ID: number;
  INTERNSHIP_TYPE_ID: number;
  NAME: string;
}

// ─── Helpers ───

/** Mapea gender DB → frontend */
function mapGender(g: string | null): string {
  if (!g) return '';
  return genderFromDb[g.trim()] || g;
}

/** Mapea marital status DB → frontend */
function mapMarital(m: string | null): string {
  if (!m) return 'SOLTERO';
  return maritalFromDb[m.trim()] || m;
}

/** Mapea student type DB → frontend */
function mapStudentType(t: string | null): string {
  if (!t) return 'CIVIL';
  return typeFromDb[t.trim()] || t;
}

// ─── EXPORT: Students ───

export async function exportStudents(): Promise<ExportEnvelope<ExportedStudent>> {
  const { data: rawStudents, error } = await supabase
    .from('t_students')
    .select(`
      STUDENTS_ID, STUDENT_TYPE, MILITARY_RANK, EMPLOYMENT, REGISTRATION_DATE, STATUS, person_id,
      t_persons!inner(ci, first_name, middle_name, last_name, second_last_name, email, phone, gender, birthdate, address, marital_status)
    `);

  if (error) throw error;

  const studentIds = rawStudents!.map(s => s.STUDENTS_ID);
  const personIds = rawStudents!.map(s => s.person_id).filter(Boolean);

  // Fetch all related data in parallel
  const [
    practices,
    documents,
    requests,
    evaluations,
    activityLogs,
    addresses,
    prospectItems,
  ] = await Promise.all([
    getPractices(studentIds),
    getStudentDocs(studentIds),
    getStudentRequests(studentIds),
    getEvaluations(studentIds),
    getActivityLogs(studentIds),
    getPersonAddresses(personIds),
    getProspectItems(studentIds),
  ]);

  // Group by student
  const practicesByStudent = groupBy(practices, 'STUDENTS_ID');
  const docsByStudent = groupBy(documents, 'STUDENT_ID');
  const requestsByStudent = groupBy(requests, 'STUDENT_ID');
  const evalsByStudent = groupBy(evaluations, 'STUDENT_ID');
  const logsByStudent = groupBy(activityLogs, 'STUDENT_ID');
  const addressesByPerson = groupBy(addresses, 'person_id');
  const prospectsByStudent = groupBy(prospectItems, 'STUDENTS_ID');

  // Group logs and evals by practice too
  const logsByPractice = groupBy(activityLogs, 'PROFESSIONAL_PRACTICE_ID');
  const evalsByPractice = groupBy(evaluations, 'PROFESSIONAL_PRACTICE_ID');

  // Get practice tutors
  const practiceIds = practices.map(p => p.PROFESSIONAL_PRACTICE_ID);
  const tutorsByPractice = await getPracticeTutors(practiceIds);

  const data = (rawStudents as any[]).map(s => {
    const p = s.t_persons as any;
    const studentPractices = (practicesByStudent[s.STUDENTS_ID] || []).map(pr => ({
      PROFESSIONAL_PRACTICE_ID: pr.PROFESSIONAL_PRACTICE_ID,
      START_DATE: pr.START_DATE,
      END_DATE: pr.END_DATE,
      PERIOD_ID: pr.PERIOD_ID,
      INSTITUTION_ID: pr.INSTITUTION_ID,
      CAREER_ID: pr.CAREER_ID,
      INTERNSHIP_TYPE_ID: pr.INTERNSHIP_TYPE_ID,
      PRACTICES_STATUS: pr.PRACTICES_STATUS,
      INTERNSHIP_STATUS: pr.INTERNSHIP_STATUS,
      SEMESTER: pr.SEMESTER,
      SECTION: pr.SECTION,
      REGIME: pr.REGIME,
      GRADE: pr.GRADE,
      tutors: tutorsByPractice[pr.PROFESSIONAL_PRACTICE_ID] || [],
      activityLogs: logsByPractice[pr.PROFESSIONAL_PRACTICE_ID] || [],
      evaluations: evalsByPractice[pr.PROFESSIONAL_PRACTICE_ID] || [],
    }));

    return {
      STUDENTS_ID: s.STUDENTS_ID,
      person_id: s.person_id,
      identificationPrefix: p.ci?.split('-')[0] || 'V',
      identificationNumber: p.ci?.split('-')[1] || '',
      firstName: p.first_name,
      middleName: p.middle_name,
      lastName: p.last_name,
      secondLastName: p.second_last_name,
      email: p.email,
      phone: p.phone,
      gender: mapGender(p.gender),
      birthdate: p.birthdate,
      address: p.address,
      maritalStatus: mapMarital(p.marital_status),
      studentType: mapStudentType(s.STUDENT_TYPE),
      militaryRank: s.MILITARY_RANK,
      employment: s.EMPLOYMENT,
      registrationDate: s.REGISTRATION_DATE,
      status: s.STATUS,
      practices: studentPractices,
      documents: (docsByStudent[s.STUDENTS_ID] || []).map(d => ({
        DOCUMENT_ID: d.DOCUMENT_ID,
        DOCUMENT_TYPE: d.DOCUMENT_TYPE,
        TITLE: d.TITLE,
        FILE_NAME: d.FILE_NAME,
        STATUS: d.STATUS,
        UPLOADED_AT: d.UPLOADED_AT,
      })),
      requests: (requestsByStudent[s.STUDENTS_ID] || []).map(r => ({
        REQUEST_ID: r.REQUEST_ID,
        REQUEST_TYPE_ID: r.REQUEST_TYPE_ID,
        SUBJECT: r.SUBJECT,
        DESCRIPTION: r.DESCRIPTION,
        STATUS: r.STATUS,
        RESPONSE: r.RESPONSE,
        CREATION_DATE: r.CREATION_DATE,
      })),
      evaluations: evalsByStudent[s.STUDENTS_ID] || [],
      activityLogs: logsByStudent[s.STUDENTS_ID] || [],
      addresses: (addressesByPerson[s.person_id] || []).map(a => ({
        person_address_id: a.person_address_id,
        address_id: a.address_id,
        address_type_id: a.address_type_id,
        is_primary: a.is_primary,
      })),
      prospectListItems: (prospectsByStudent[s.STUDENTS_ID] || []).map(pr => ({
        PROSPECT_LIST_ITEM_ID: pr.PROSPECT_LIST_ITEM_ID,
        LIST_ID: pr.LIST_ID,
        STATUS: pr.STATUS,
      })),
    };
  });

  return envelope('students', data);
}

// ─── EXPORT: Tutors ───

export async function exportTutors(): Promise<ExportEnvelope<ExportedTutor>> {
  const { data: rawTutors, error } = await supabase
    .from('t_tutors')
    .select(`
      TUTOR_ID, TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, CONTACT_PHONE, EMAIL,
      PROFESSION, CONDITION, DEDICATION, CATEGORY, STATUS, person_id,
      t_persons!left(ci, first_name, middle_name, last_name, second_last_name, email, phone)
    `);

  if (error) throw error;

  const tutorIds = rawTutors!.map(t => t.TUTOR_ID);

  // Get assigned practices for all tutors
  const { data: practiceAssignments } = await supabase
    .from('t_professional_practices_tutor')
    .select(`
      PROFESSIONAL_PRACTICES_TUTOR_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_ID, TUTOR_TYPE,
      t_professional_practices!left(STUDENTS_ID)
    `)
    .in('TUTOR_ID', tutorIds);

  // Get student names for the assignments
  const assignmentStudentIds = (practiceAssignments || [])
    .map(a => (a.t_professional_practices as any)?.STUDENTS_ID)
    .filter(Boolean);

  const { data: studentRefs } = assignmentStudentIds.length > 0 ? await supabase
    .from('t_students')
    .select(`
      STUDENTS_ID,
      t_persons!inner(ci, first_name, last_name)
    `)
    .in('STUDENTS_ID', assignmentStudentIds) : { data: [] };

  const studentMap = new Map(
    (studentRefs || []).map((s: any) => [s.STUDENTS_ID, {
      STUDENTS_ID: s.STUDENTS_ID,
      studentName: `${(s.t_persons as any).first_name} ${(s.t_persons as any).last_name}`.trim(),
      studentCi: (s.t_persons as any).ci,
    }])
  );

  const assignmentsByTutor = groupBy(practiceAssignments || [], 'TUTOR_ID');

  const data = (rawTutors as any[]).map(t => {
    const p = t.t_persons as any;
    const ci = t.TUTOR_CI || p?.ci || '';
    return {
      TUTOR_ID: t.TUTOR_ID,
      identificationPrefix: ci.split('-')[0] || 'V',
      identificationNumber: ci.split('-')[1] || '',
      firstName: p?.first_name || t.NAME || '',
      middleName: p?.middle_name || t.SECOND_NAME || null,
      lastName: p?.last_name || t.SURNAME || '',
      secondLastName: p?.second_last_name || t.SECOND_SURNAME || null,
      email: t.EMAIL || p?.email || '',
      phone: t.CONTACT_PHONE || p?.phone || null,
      profession: t.PROFESSION,
      condition: t.CONDITION,
      dedication: t.DEDICATION,
      category: t.CATEGORY,
      status: t.STATUS,
      assignedPractices: (assignmentsByTutor[t.TUTOR_ID] || []).map(a => {
        const practice = a.t_professional_practices as any;
        return {
          PROFESSIONAL_PRACTICES_TUTOR_ID: a.PROFESSIONAL_PRACTICES_TUTOR_ID,
          PROFESSIONAL_PRACTICE_ID: a.PROFESSIONAL_PRACTICE_ID,
          TUTOR_TYPE: a.TUTOR_TYPE,
          student: practice?.STUDENTS_ID ? studentMap.get(practice.STUDENTS_ID) || null : null,
        };
      }),
    };
  });

  return envelope('tutors', data);
}

// ─── EXPORT: Institutions ───

export async function exportInstitutions(): Promise<ExportEnvelope<ExportedInstitution>> {
  const { data: rawInstitutions, error } = await supabase
    .from('t_institution')
    .select('*');

  if (error) throw error;

  const instIds = rawInstitutions!.map(i => i.INSTITUTION_ID);

  const [managersResult, careersResult] = await Promise.all([
    supabase
      .from('t_institution_manager')
      .select('*')
      .in('INSTITUTION_ID', instIds),
    supabase
      .from('t_institution_career')
      .select('*')
      .in('INSTITUTION_ID', instIds),
  ]);

  if (managersResult.error) throw managersResult.error;
  if (careersResult.error) throw careersResult.error;

  const managersByInst = groupBy(managersResult.data || [], 'INSTITUTION_ID');
  const careersByInst = groupBy(careersResult.data || [], 'INSTITUTION_ID');

  const data = rawInstitutions!.map(i => ({
    INSTITUTION_ID: i.INSTITUTION_ID,
    INSTITUTION_NAME: i.INSTITUTION_NAME,
    INSTITUTION_ADDRESS: i.INSTITUTION_ADDRESS,
    INSTITUTION_CONTACT: i.INSTITUTION_CONTACT,
    PRACTICE_TYPE: i.PRACTICE_TYPE,
    REGION: i.REGION,
    NUCLEUS: i.NUCLEUS,
    EXTENSION: i.EXTENSION,
    INSTITUTION_TYPE: i.INSTITUTION_TYPE,
    RIF: i.RIF,
    INSTITUTION_CODE: i.INSTITUTION_CODE,
    STATUS: i.STATUS,
    managers: (managersByInst[i.INSTITUTION_ID] || []).map(m => ({
      MANAGER_ID: m.MANAGER_ID,
      ci: m.MANAGER_CI || null,
      name: m.NAME ? `${m.NAME} ${m.SURNAME || ''}`.trim() : null,
      phone: m.CONTACT_PHONE || null,
      email: m.EMAIL || null,
      cargo: m.cargo || null,
      STATUS: m.STATUS,
    })),
    careers: (careersByInst[i.INSTITUTION_ID] || []).map(c => ({
      CAREER_ID: c.CAREER_ID,
      INTERNSHIP_TYPE_ID: c.INTERNSHIP_TYPE_ID,
      NAME: c.NAME,
    })),
  }));

  return envelope('institutions', data);
}

// ─── Data fetching helpers ───

async function getPractices(studentIds: number[]) {
  if (studentIds.length === 0) return [];
  const { data } = await supabase
    .from('t_professional_practices')
    .select('*')
    .in('STUDENTS_ID', studentIds);
  return data || [];
}

async function getPracticeTutors(practiceIds: number[]) {
  const map: Record<number, ExportedPracticeTutor[]> = {};
  if (practiceIds.length === 0) return map;
  const { data } = await supabase
    .from('t_professional_practices_tutor')
    .select('PROFESSIONAL_PRACTICE_ID, TUTOR_ID, TUTOR_TYPE')
    .in('PROFESSIONAL_PRACTICE_ID', practiceIds);
  if (data) {
    for (const t of data) {
      if (!map[t.PROFESSIONAL_PRACTICE_ID]) map[t.PROFESSIONAL_PRACTICE_ID] = [];
      map[t.PROFESSIONAL_PRACTICE_ID].push({ TUTOR_ID: t.TUTOR_ID, TUTOR_TYPE: t.TUTOR_TYPE });
    }
  }
  return map;
}

async function getStudentDocs(studentIds: number[]) {
  if (studentIds.length === 0) return [];
  const { data } = await supabase
    .from('t_student_documents')
    .select('DOCUMENT_ID, STUDENT_ID, DOCUMENT_TYPE, TITLE, FILE_NAME, STATUS, UPLOADED_AT')
    .in('STUDENT_ID', studentIds);
  return data || [];
}

async function getStudentRequests(studentIds: number[]) {
  if (studentIds.length === 0) return [];
  const { data } = await supabase
    .from('t_student_requests')
    .select('REQUEST_ID, STUDENT_ID, REQUEST_TYPE_ID, SUBJECT, DESCRIPTION, STATUS, RESPONSE, CREATION_DATE')
    .in('STUDENT_ID', studentIds);
  return data || [];
}

async function getEvaluations(studentIds: number[]) {
  if (studentIds.length === 0) return [];
  const { data } = await supabase
    .from('t_evaluations')
    .select('EVALUATION_ID, STUDENT_ID, PROFESSIONAL_PRACTICE_ID, STATUS, GRADE, CREATED_AT')
    .in('STUDENT_ID', studentIds);
  return data || [];
}

async function getActivityLogs(studentIds: number[]) {
  if (studentIds.length === 0) return [];
  const { data } = await supabase
    .from('t_activity_logs')
    .select('*')
    .in('STUDENT_ID', studentIds);
  return data || [];
}

async function getPersonAddresses(personIds: number[]) {
  if (personIds.length === 0) return [];
  const { data } = await supabase
    .from('t_person_address')
    .select('*')
    .in('person_id', personIds);
  return data || [];
}

async function getProspectItems(studentIds: number[]) {
  if (studentIds.length === 0) return [];
  const { data } = await supabase
    .from('t_prospect_list_items')
    .select('PROSPECT_LIST_ITEM_ID, STUDENTS_ID, LIST_ID, STATUS')
    .in('STUDENTS_ID', studentIds);
  return data || [];
}

// ─── Utilities ───

function groupBy<T extends Record<string, any>>(arr: T[], key: string): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of arr) {
    const k = String(item[key]);
    if (!map[k]) map[k] = [];
    map[k].push(item);
  }
  return map;
}

function envelope<T>(entity: string, data: T[]): ExportEnvelope<T> {
  return {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    entity,
    total: data.length,
    data,
  };
}

// ─── SQL Generator ───

function sqlVal(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function sqlInsert(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return `-- ${table}: sin datos\n`;
  const cols = Object.keys(rows[0]);
  const lines = rows.map(r => {
    const vals = cols.map(c => sqlVal(r[c])).join(',');
    return `INSERT INTO "${table}" ("${cols.join('","')}") VALUES (${vals});`;
  });
  return `-- ${table}: ${rows.length} registros\n${lines.join('\n')}\n\n`;
}

function sqlHeader(entity: string): string {
  return `--
-- Exportación de ${entity} — ${new Date().toLocaleDateString('es-VE')}
-- Generado automáticamente para limpieza y recarga de BD
--

BEGIN;

`;
}

function sqlFooter(): string {
  return 'COMMIT;';
}

// ─── CSV Generator ───

function csvRow(values: string[]): string {
  return values.map(v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',') + '\n';
}

function toCsv(headers: string[], rows: any[], getRow: (r: any) => string[]): string {
  let out = csvRow(headers);
  for (const r of rows) out += csvRow(getRow(r));
  return out;
}

// ─── EXPORT: Students SQL ───

export async function exportStudentsSql(): Promise<string> {
  let sql = sqlHeader('estudiantes');

  const { data: persons } = await supabase.from('t_persons').select('*').order('person_id', { ascending: true });
  const { data: students } = await supabase.from('t_students').select('*').order('STUDENTS_ID', { ascending: true });
  const { data: practices } = await supabase.from('t_professional_practices').select('*').order('PROFESSIONAL_PRACTICE_ID', { ascending: true });
  const { data: tutors } = await supabase.from('t_professional_practices_tutor').select('*').order('PROFESSIONAL_PRACTICES_TUTOR_ID', { ascending: true });
  const { data: docs } = await supabase.from('t_student_documents').select('*').order('DOCUMENT_ID', { ascending: true });
  const { data: requests } = await supabase.from('t_student_requests').select('*').order('REQUEST_ID', { ascending: true });
  const { data: evals } = await supabase.from('t_evaluations').select('*').order('EVALUATION_ID', { ascending: true });
  const { data: logs } = await supabase.from('t_activity_logs').select('*').order('ACTIVITY_LOG_ID', { ascending: true });
  const { data: addresses } = await supabase.from('t_person_address').select('*').order('person_address_id', { ascending: true });
  const { data: prospects } = await supabase.from('t_prospect_list_items').select('*').order('PROSPECT_LIST_ITEM_ID', { ascending: true });

  sql += sqlInsert('t_persons', persons || []);
  sql += sqlInsert('t_students', students || []);
  sql += sqlInsert('t_professional_practices', practices || []);
  sql += sqlInsert('t_professional_practices_tutor', tutors || []);
  sql += sqlInsert('t_student_documents', docs || []);
  sql += sqlInsert('t_student_requests', requests || []);
  sql += sqlInsert('t_evaluations', evals || []);
  sql += sqlInsert('t_activity_logs', logs || []);
  sql += sqlInsert('t_person_address', addresses || []);
  sql += sqlInsert('t_prospect_list_items', prospects || []);

  sql += sqlFooter();
  return sql;
}

// ─── EXPORT: Tutors SQL ───

export async function exportTutorsSql(): Promise<string> {
  let sql = sqlHeader('tutores');

  const { data: tutors } = await supabase.from('t_tutors').select('*').order('TUTOR_ID', { ascending: true });
  const { data: tutorAssignments } = await supabase.from('t_professional_practices_tutor').select('*').order('PROFESSIONAL_PRACTICES_TUTOR_ID', { ascending: true });

  sql += sqlInsert('t_tutors', tutors || []);
  sql += sqlInsert('t_professional_practices_tutor', tutorAssignments || []);

  sql += sqlFooter();
  return sql;
}

// ─── EXPORT: Institutions SQL ───

export async function exportInstitutionsSql(): Promise<string> {
  let sql = sqlHeader('instituciones');

  const { data: institutions } = await supabase.from('t_institution').select('*').order('INSTITUTION_ID', { ascending: true });
  const { data: managers } = await supabase.from('t_institution_manager').select('*').order('MANAGER_ID', { ascending: true });
  const { data: careers } = await supabase.from('t_institution_career').select('*').order('INSTITUTION_CAREER_ID', { ascending: true });

  sql += sqlInsert('t_institution', institutions || []);
  sql += sqlInsert('t_institution_manager', managers || []);
  sql += sqlInsert('t_institution_career', careers || []);

  sql += sqlFooter();
  return sql;
}

// ─── EXPORT: Students XLSX (import-compatible) ───

export async function exportStudentsXlsx(): Promise<Buffer> {
  const json = await exportStudents();

  // Cache de carreras: careerId -> name
  const careerIds = new Set<number>();
  json.data.forEach((s: any) => {
    (s.practices || []).forEach((p: any) => {
      if (p.CAREER_ID) careerIds.add(p.CAREER_ID);
    });
  });

  const careerMap = new Map<number, string>();
  if (careerIds.size > 0) {
    const { data: careers } = await supabase
      .from('t_career')
      .select('CAREER_ID, CAREER_NAME')
      .in('CAREER_ID', [...careerIds]);
    (careers || []).forEach((c: any) => careerMap.set(c.CAREER_ID, c.CAREER_NAME));
  }

  const headers = [
    'PREFIJO_CI', 'CEDULA', 'PRIMER_NOMBRE', 'SEGUNDO_NOMBRE', 'APELLIDO', 'SEGUNDO_APELLIDO',
    'SEXO', 'FECHA_NACIMIENTO', 'ESTADO_CIVIL', 'PREFIJO_TELEFONO', 'TELEFONO',
    'CORREO', 'DIRECCION', 'CARRERA', 'REGIMEN', 'SEMESTRE', 'SECCION',
    'TIPO_ESTUDIANTE', 'RANGO_MILITAR', 'TRABAJA'
  ];

  const rows: string[][] = json.data.map((s: any) => {
    const practices = (s.practices || []);
    const latest = practices.length > 0
      ? practices.reduce((a: any, b: any) =>
          new Date(a.START_DATE || 0) > new Date(b.START_DATE || 0) ? a : b
        )
      : null;

    const careerName = latest?.CAREER_ID ? (careerMap.get(latest.CAREER_ID) || '') : '';
    const phoneParts = (s.phone || '').split('-');

    return [
      s.identificationPrefix,
      s.identificationNumber,
      s.firstName,
      s.middleName || '',
      s.lastName,
      s.secondLastName || '',
      s.gender,
      s.birthdate || '',
      s.maritalStatus,
      phoneParts[0] || '',
      phoneParts[1] || '',
      s.email,
      s.address || '',
      careerName,
      latest?.REGIME || '',
      latest?.SEMESTER || '',
      latest?.SECTION || '',
      s.studentType,
      s.militaryRank || '',
      s.employment === 'SI' ? 'SI' : 'NO',
    ];
  });

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  sheet['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 30 }, { wch: 40 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 6 },
    { wch: 14 }, { wch: 14 }, { wch: 6 }
  ];

  XLSX.utils.book_append_sheet(workbook, sheet, 'Importar');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

// ─── EXPORT: Students CSV ───

export async function exportStudentsCsv(): Promise<string> {
  const json = await exportStudents();
  const headers = ['Cédula', 'Nombres', 'Apellidos', 'Email', 'Teléfono', 'Sexo', 'Fecha Nac.', 'Tipo', 'Rango Militar', 'Trabaja', 'Estado'];
  const rows = json.data as any[];
  return toCsv(headers, rows, r => [
    `${r.identificationPrefix}-${r.identificationNumber}`,
    [r.firstName, r.middleName].filter(Boolean).join(' '),
    [r.lastName, r.secondLastName].filter(Boolean).join(' '),
    r.email,
    r.phone || '',
    r.gender,
    r.birthdate || '',
    r.studentType,
    r.militaryRank || '',
    r.employment,
    r.status ? 'Activo' : 'Inactivo',
  ]);
}

// ─── EXPORT: Tutors CSV ───

export async function exportTutorsCsv(): Promise<string> {
  const json = await exportTutors();
  const headers = ['Cédula', 'Nombres', 'Apellidos', 'Email', 'Teléfono', 'Profesión', 'Condición', 'Dedicación', 'Categoría', 'Estado'];
  const rows = json.data as any[];
  return toCsv(headers, rows, r => [
    `${r.identificationPrefix}-${r.identificationNumber}`,
    [r.firstName, r.middleName].filter(Boolean).join(' '),
    [r.lastName, r.secondLastName].filter(Boolean).join(' '),
    r.email,
    r.phone || '',
    r.profession,
    r.condition,
    r.dedication,
    r.category,
    r.status ? 'Activo' : 'Inactivo',
  ]);
}

// ─── EXPORT: Institutions CSV ───

export async function exportInstitutionsCsv(): Promise<string> {
  const json = await exportInstitutions();
  const headers = ['RIF', 'Nombre', 'Dirección', 'Teléfono', 'Tipo', 'Región', 'Núcleo', 'Estado'];
  const rows = json.data as any[];
  return toCsv(headers, rows, r => [
    r.RIF,
    r.INSTITUTION_NAME,
    r.INSTITUTION_ADDRESS,
    r.INSTITUTION_CONTACT,
    r.INSTITUTION_TYPE,
    r.REGION,
    r.NUCLEUS,
    r.STATUS ? 'Activo' : 'Inactivo',
  ]);
}
