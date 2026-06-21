/**
 * @file Seed script for report test data.
 *
 * Inserts complete test data into Supabase for ALL report types:
 *   - resumen-pasantias
 *   - tutores-academicos
 *   - relacion-empresas-demandan
 *   - distribucion-tutores / distribucion-tutores-v2
 *   - relacion-individual-docente
 *   - export-excel (per-career worksheets)
 *
 * IDEMPOTENT: uses upsert with fixed CI values so re-running is safe.
 * Cleanup before re-insert: cleanupReportsData() deletes all seed rows
 * identified by CI/RIF patterns, then seedReportsData() inserts fresh.
 *
 * Usage:
 *   import { seedReportsData, cleanupReportsData } from './seed-reports.js';
 *   await cleanupReportsData();
 *   const result = await seedReportsData();
 *   // result.data contains all inserted IDs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ============================================================
// CONSTANTS
// ============================================================

const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/['`"]/g, '');
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/['`"]/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);
const NOW = new Date().toISOString();
const TODAY = NOW.split('T')[0]; // YYYY-MM-DD

/** Next ID for t_institution_career (BIGINT, not SERIAL, needs explicit value) */
let instCareerId = 1;

/** Next ID for t_tutor_career (BIGINT, not SERIAL, needs explicit value) */
let tutorCareerId = 1;

// ============================================================
// FIXED CI / RIF VALUES (deterministic → idempotent upserts)
// ============================================================
// All fit within their VARCHAR column limits:
//   t_persons.ci                = VARCHAR(10) ← "SEED-P01" (8 chars)
//   t_students.STUDENTS_CI      = VARCHAR(10) ← "SEED-S01" (8 chars)
//   t_tutors.TUTOR_CI           = VARCHAR(10) ← "SEED-T01" (8 chars)
//   t_institution_manager.MANAGER_CI = VARCHAR(20)
//   t_institution.RIF           = VARCHAR(11) ← "J-SEED1-X" (9 chars)
//   t_institution.INSTITUTION_CODE = VARCHAR(25)

const PERSON_CI = [
  'SEED-P01', 'SEED-P02', 'SEED-P03', 'SEED-P04', 'SEED-P05',
  'SEED-P06', 'SEED-P07', 'SEED-P08', 'SEED-P09', 'SEED-P10',
  'SEED-P11', 'SEED-P12', 'SEED-P13', 'SEED-P14', 'SEED-P15',
];

const STUDENT_CI = [
  'SEED-S01', 'SEED-S02', 'SEED-S03', 'SEED-S04', 'SEED-S05', 'SEED-S06',
];

const TUTOR_CI = [
  'SEED-T01', 'SEED-T02', 'SEED-T03', 'SEED-T04',
  'SEED-T05', 'SEED-T06', 'SEED-T07', 'SEED-T08',
];

const MANAGER_CI = 'SEED-M01';

const INSTITUTION_RIF = ['J-SEED1-X', 'J-SEED2-X', 'J-SEED3-X'];
const INSTITUTION_CODE = ['COD-SEED1', 'COD-SEED2', 'COD-SEED3'];

// ============================================================
// DATA STRUCTURES
// ============================================================

/** All IDs returned by the seed, mapped by entity index. */
export interface SeedIds {
  personIds: number[];
  studentIds: number[];
  tutorIds: number[];
  /** tutorPersonIds[i] = person_id of tutorIds[i] */
  tutorPersonIds: number[];
  institutionIds: number[];
  practiceIds: number[];
  managerId: number;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Upserts a single row and returns its ID.
 * Uses `onConflict` on the given unique column so the seed is idempotent.
 */
async function upsertAndGetId<T extends Record<string, unknown>>(
  table: string,
  row: T,
  conflictColumn: string,
  selectColumn: string
): Promise<number> {
  const { data, error } = await supabase
    .from(table)
    .upsert(row as any, { onConflict: conflictColumn, ignoreDuplicates: false })
    .select(selectColumn)
    .single();

  if (error) throw new Error(`Upsert ${table} failed: ${error.message}`);
  return (data as any)[selectColumn] as number;
}

/**
 * Insert a row and return its ID. Falls back to select + return on duplicate.
 * Needed for tables where the unique constraint is a partial index
 * (e.g., t_students.STUDENTS_CI uses CREATE UNIQUE INDEX ... WHERE col IS NOT NULL,
 *  which supabase-js onConflict does not support).
 */
async function insertOrSkip<T extends Record<string, unknown>>(
  table: string,
  row: T,
  ciColumn: string,
  ciValue: string,
  selectColumn: string
): Promise<number | null> {
  // Try insert first
  const { data, error } = await supabase
    .from(table)
    .insert(row as any)
    .select(selectColumn)
    .maybeSingle();

  if (!error && data) return (data as any)[selectColumn] as number;

  // If duplicate, select existing
  if (error && error.code === '23505') {
    const { data: existing, error: selErr } = await supabase
      .from(table)
      .select(selectColumn)
      .eq(ciColumn, ciValue)
      .maybeSingle();

    if (selErr || !existing) throw new Error(`Insert ${table} dup + select failed: ${selErr?.message}`);
    return (existing as any)[selectColumn] as number;
  }

  throw new Error(`Insert ${table} failed: ${error?.message}`);
}

// ============================================================
// SEED MAIN FUNCTION
// ============================================================

/**
 * Inserts all seed data for reports testing.
 * First deletes any existing seed data to guarantee a clean state.
 */
export async function seedReportsData(): Promise<{ success: boolean; data: SeedIds; error?: string }> {
  const ids: SeedIds = {
    personIds: [],
    studentIds: [],
    tutorIds: [],
    tutorPersonIds: [],
    institutionIds: [],
    practiceIds: [],
    managerId: 0,
  };

  try {
    // ---------- Step 0: Clean any previous seed data ----------
    console.log('[SeedReports] Limpiando datos previos...');
    await cleanupReportsData();
    console.log('[SeedReports] Previos eliminados (si existían).');

    // ---------- Step 1: t_persons — 15 persons ----------
    console.log('[SeedReports] Insertando personas (t_persons)...');
    const personRows = [
      { ci: PERSON_CI[0], first_name: 'Carlos',    last_name: 'Mendoza',  email: 'carlos.mendoza@test.com',  gender: 'MASCULINO', status: 1 },
      { ci: PERSON_CI[1], first_name: 'Maria',     last_name: 'Gonzalez', email: 'maria.gonzalez@test.com',  gender: 'FEMENINO',  status: 1 },
      { ci: PERSON_CI[2], first_name: 'Jose',      last_name: 'Rodriguez',email: 'jose.rodriguez@test.com', gender: 'MASCULINO', status: 1 },
      { ci: PERSON_CI[3], first_name: 'Ana',       last_name: 'Martinez', email: 'ana.martinez@test.com',    gender: 'FEMENINO',  status: 1 },
      { ci: PERSON_CI[4], first_name: 'Luis',      last_name: 'Perez',    email: 'luis.perez@test.com',      gender: 'MASCULINO', status: 1 },
      { ci: PERSON_CI[5], first_name: 'Carmen',    last_name: 'Lopez',    email: 'carmen.lopez@test.com',    gender: 'FEMENINO',  status: 1 },
      // Tutors (persons 7-14 → indexes 6-13)
      { ci: PERSON_CI[6],  first_name: 'Pedro',    last_name: 'Ramirez',   email: 'pedro.ramirez@tutor.test.com',   gender: 'MASCULINO', status: 1 },
      { ci: PERSON_CI[7],  first_name: 'Sofia',    last_name: 'Castillo',  email: 'sofia.castillo@tutor.test.com',  gender: 'FEMENINO',  status: 1 },
      { ci: PERSON_CI[8],  first_name: 'Ricardo',  last_name: 'Torrealba', email: 'ricardo.torrealba@tutor.test.com', gender: 'MASCULINO', status: 1 },
      { ci: PERSON_CI[9],  first_name: 'Diana',    last_name: 'Contreras', email: 'diana.contreras@tutor.test.com',  gender: 'FEMENINO',  status: 1 },
      { ci: PERSON_CI[10], first_name: 'Alberto',  last_name: 'Moreno',    email: 'alberto.moreno@tutor.test.com',  gender: 'MASCULINO', status: 1 },
      { ci: PERSON_CI[11], first_name: 'Laura',    last_name: 'Medina',    email: 'laura.medina@tutor.test.com',    gender: 'FEMENINO',  status: 1 },
      { ci: PERSON_CI[12], first_name: 'Fernando', last_name: 'Castro',    email: 'fernando.castro@tutor.test.com', gender: 'MASCULINO', status: 1 },
      { ci: PERSON_CI[13], first_name: 'Patricia', last_name: 'Rivas',     email: 'patricia.rivas@tutor.test.com',  gender: 'FEMENINO',  status: 1 },
      // Manager (person 15 → index 14)
      { ci: PERSON_CI[14], first_name: 'Miguel',   last_name: 'Soto',      email: 'miguel.soto@manager.test.com',   gender: 'MASCULINO', status: 1 },
    ];

    for (const p of personRows) {
      const pid = await upsertAndGetId('t_persons', p, 'ci', 'person_id');
      ids.personIds.push(pid);
    }
    // Build a quick lookup map: CI → person_id
    const personByCi = new Map<string, number>();
    for (let i = 0; i < PERSON_CI.length; i++) {
      personByCi.set(PERSON_CI[i], ids.personIds[i]);
    }
    console.log(`  → ${ids.personIds.length} personas (IDs: ${ids.personIds.join(', ')})`);

    // ---------- Step 2: t_students — 6 students ----------
    console.log('[SeedReports] Insertando estudiantes (t_students)...');
    const studentRows = [
      { person_id: personByCi.get(PERSON_CI[0])!, STUDENTS_CI: STUDENT_CI[0], NAME: 'Carlos', SECOND_NAME: 'Andres', SURNAME: 'Mendoza', SECOND_SURNAME: 'Rojas', GENDER: 'M', BIRTHDATE: '2000-01-15', CONTACT_PHONE: '04121230001', EMAIL: 'carlos.mendoza@est.test.com', ADDRESS: 'Av. Principal, Acarigua', MARITAL_STATUS: 'S', STUDENT_TYPE: 'CIVIL', EMPLOYMENT: 'NO', STATUS: 1, REGISTRATION_DATE: NOW },
      { person_id: personByCi.get(PERSON_CI[1])!, STUDENTS_CI: STUDENT_CI[1], NAME: 'Maria', SECOND_NAME: 'Isabel', SURNAME: 'Gonzalez', SECOND_SURNAME: 'Diaz', GENDER: 'F', BIRTHDATE: '2000-03-20', CONTACT_PHONE: '04121230002', EMAIL: 'maria.gonzalez@est.test.com', ADDRESS: 'Calle 5, Guanare', MARITAL_STATUS: 'S', STUDENT_TYPE: 'CIVIL', EMPLOYMENT: 'NO', STATUS: 1, REGISTRATION_DATE: NOW },
      { person_id: personByCi.get(PERSON_CI[2])!, STUDENTS_CI: STUDENT_CI[2], NAME: 'Jose', SECOND_NAME: 'Rafael', SURNAME: 'Rodriguez', SECOND_SURNAME: null, GENDER: 'M', BIRTHDATE: '1999-07-10', CONTACT_PHONE: '04121230003', EMAIL: 'jose.rodriguez@est.test.com', ADDRESS: 'Urb. Las Flores, Biscucuy', MARITAL_STATUS: 'S', STUDENT_TYPE: 'CIVIL', EMPLOYMENT: 'SI', STATUS: 1, REGISTRATION_DATE: NOW },
      { person_id: personByCi.get(PERSON_CI[3])!, STUDENTS_CI: STUDENT_CI[3], NAME: 'Ana', SECOND_NAME: 'Victoria', SURNAME: 'Martinez', SECOND_SURNAME: 'Linares', GENDER: 'F', BIRTHDATE: '2001-11-05', CONTACT_PHONE: '04121230004', EMAIL: 'ana.martinez@est.test.com', ADDRESS: 'Av. Bolívar, Acarigua', MARITAL_STATUS: 'S', STUDENT_TYPE: 'MILITAR', EMPLOYMENT: 'NO', STATUS: 1, REGISTRATION_DATE: NOW },
      { person_id: personByCi.get(PERSON_CI[4])!, STUDENTS_CI: STUDENT_CI[4], NAME: 'Luis', SECOND_NAME: 'Alberto', SURNAME: 'Perez', SECOND_SURNAME: 'Garcia', GENDER: 'M', BIRTHDATE: '2000-09-12', CONTACT_PHONE: '04121230005', EMAIL: 'luis.perez@est.test.com', ADDRESS: 'Calle 8, Guanare', MARITAL_STATUS: 'C', STUDENT_TYPE: 'CIVIL', EMPLOYMENT: 'SI', STATUS: 1, REGISTRATION_DATE: NOW },
      { person_id: personByCi.get(PERSON_CI[5])!, STUDENTS_CI: STUDENT_CI[5], NAME: 'Carmen', SECOND_NAME: 'Elena', SURNAME: 'Lopez', SECOND_SURNAME: null, GENDER: 'F', BIRTHDATE: '2001-04-28', CONTACT_PHONE: '04121230006', EMAIL: 'carmen.lopez@est.test.com', ADDRESS: 'Vía Principal, Biscucuy', MARITAL_STATUS: 'S', STUDENT_TYPE: 'CIVIL', EMPLOYMENT: 'NO', STATUS: 1, REGISTRATION_DATE: NOW },
    ];

    for (const s of studentRows) {
      const sid = await insertOrSkip('t_students', s, 'STUDENTS_CI', s.STUDENTS_CI, 'STUDENTS_ID');
      ids.studentIds.push(sid!);
    }
    console.log(`  → ${ids.studentIds.length} estudiantes (IDs: ${ids.studentIds.join(', ')})`);

    // ---------- Step 3: t_institution — 3 institutions ----------
    console.log('[SeedReports] Insertando instituciones (t_institution)...');
    const institutionRows = [
      {
        INSTITUTION_NAME: 'Hospital Universitario Dr. Miguel Oraá',
        INSTITUTION_ADDRESS: 'Av. Libertador, Guanare, Estado Portuguesa',
        INSTITUTION_CONTACT: '04125770001',
        PRACTICE_TYPE: 'PASANTIAS',
        REGION: 'OCCIDENTAL',
        NUCLEUS: 'PORTUGUESA',
        EXTENSION: 'GUANARE',
        CREATION_DATE: NOW,
        INSTITUTION_TYPE: 'PUBLICA',
        STATUS: 1,
        RIF: INSTITUTION_RIF[0],
        INSTITUTION_CODE: INSTITUTION_CODE[0],
      },
      {
        INSTITUTION_NAME: 'Alcaldía del Municipio Páez',
        INSTITUTION_ADDRESS: 'Plaza Bolívar, Acarigua, Estado Portuguesa',
        INSTITUTION_CONTACT: '04125770002',
        PRACTICE_TYPE: 'PASANTIAS',
        REGION: 'OCCIDENTAL',
        NUCLEUS: 'PORTUGUESA',
        EXTENSION: 'ACARIGUA',
        CREATION_DATE: NOW,
        INSTITUTION_TYPE: 'PUBLICA',
        STATUS: 1,
        RIF: INSTITUTION_RIF[1],
        INSTITUTION_CODE: INSTITUTION_CODE[1],
      },
      {
        INSTITUTION_NAME: 'Agroindustria Los Llanos C.A.',
        INSTITUTION_ADDRESS: 'Carretera Vía Biscucuy, Biscucuy, Estado Portuguesa',
        INSTITUTION_CONTACT: '04125770003',
        PRACTICE_TYPE: 'PASANTIAS',
        REGION: 'OCCIDENTAL',
        NUCLEUS: 'PORTUGUESA',
        EXTENSION: 'BISCUCUY',
        CREATION_DATE: NOW,
        INSTITUTION_TYPE: 'PRIVADA',
        STATUS: 1,
        RIF: INSTITUTION_RIF[2],
        INSTITUTION_CODE: INSTITUTION_CODE[2],
      },
    ];

    for (const inst of institutionRows) {
      const iid = await insertOrSkip('t_institution', inst as any, 'RIF', inst.RIF, 'INSTITUTION_ID');
      ids.institutionIds.push(iid);
    }
    console.log(`  → ${ids.institutionIds.length} instituciones (IDs: ${ids.institutionIds.join(', ')})`);

    // Ensure required careers exist — insert career 5 if missing
    const { data: existingCareer } = await supabase.from('t_career').select('CAREER_ID').eq('CAREER_ID', 5);
    if (!existingCareer?.length) {
      const { error: careerErr } = await supabase.from('t_career').insert({
        CAREER_ID: 5,
        CAREER_NAME: 'INGENIERIA EN INFORMATICA',
        CAREER_CODE: 'INF-001',
        MINIMUM_GRADE: 16.00,
        CAREER_ABBREVIATION: 'ING-INF',
        CREATION_DATE: NOW,
        MODIF_USER_ID: 1,
        MODIF_USER_DATE: NOW,
        ELIM_USER_ID: 1,
        ELIM_USER_DATE: NOW,
        REST_USER_ID: 1,
        REST_USER_DATE: NOW,
        STATUS: 1,
        CAREER_TYPE: 'LARGA',
        SEMESTER: 8,
      });
      if (careerErr) throw new Error(`Insert career 5 failed: ${careerErr.message}`);
      console.log('  → CAREER_ID 5 inserted (INGENIERIA EN INFORMATICA)');
    }

    // Link institutions ↔ careers (t_institution_career)
    console.log('[SeedReports] Vinculando instituciones con carreras...');
    for (const instId of ids.institutionIds) {
      for (const careerId of [3, 4, 5]) {
        const { error } = await supabase
          .from('t_institution_career')
          .upsert(
            { INSTITUTION_CAREER_ID: instCareerId++, INSTITUTION_ID: instId, CAREER_ID: careerId },
            { onConflict: 'INSTITUTION_CAREER_ID', ignoreDuplicates: false }
          );
        if (error) console.warn(`  ⚠  t_institution_career (inst=${instId}, career=${careerId}): ${error.message}`);
      }
    }
    console.log(`  → instituciones vinculadas a carreras 3,4,5`);

    // ---------- Step 4: t_tutors — 8 tutors ----------
    console.log('[SeedReports] Insertando tutores (t_tutors)...');
    // Tutor roles:
    //   [0-1] ACADEMICO   (Pedro, Sofia)
    //   [2-3] METODOLOGICO (Ricardo, Diana)
    //   [4-5] EVALUADOR   (Alberto, Laura)   ← used as INSTITUCIONAL in PPT
    //   [6-7] INSTITUCIONAL (Fernando, Patricia)
    const tutorRows = [
      { person_id: personByCi.get(PERSON_CI[6])!,  TUTOR_CI: TUTOR_CI[0], NAME: 'Pedro',    SECOND_NAME: 'Jose',     SURNAME: 'Ramirez',   SECOND_SURNAME: 'Guerra',  CONTACT_PHONE: '04121240001', GENDER: 'M', EMAIL: 'pedro.ramirez@tutor.test.com',    PROFESSION: 'Ingeniero en Informática', CONDITION: 'ORDINARIO', DEDICATION: 'TC', CATEGORY: 'AGREGADO',   CREATION_DATE: NOW, STATUS: 1, TITULO: 'MSc',  ATTENTION_SCHEDULE: 'Lun-Vie 8:00-12:00' },
      { person_id: personByCi.get(PERSON_CI[7])!,  TUTOR_CI: TUTOR_CI[1], NAME: 'Sofia',    SECOND_NAME: null,       SURNAME: 'Castillo',  SECOND_SURNAME: 'Paredes', CONTACT_PHONE: '04121240002', GENDER: 'F', EMAIL: 'sofia.castillo@tutor.test.com',  PROFESSION: 'Licenciada en Enfermería',  CONDITION: 'CONTRATADO', DEDICATION: 'MT', CATEGORY: 'ASISTENTE', CREATION_DATE: NOW, STATUS: 1, TITULO: 'Licda', ATTENTION_SCHEDULE: 'Lun-Mie 14:00-18:00' },
      { person_id: personByCi.get(PERSON_CI[8])!,  TUTOR_CI: TUTOR_CI[2], NAME: 'Ricardo',  SECOND_NAME: 'Alfonso',  SURNAME: 'Torrealba', SECOND_SURNAME: null,       CONTACT_PHONE: '04121240003', GENDER: 'M', EMAIL: 'ricardo.torrealba@tutor.test.com', PROFESSION: 'Ingeniero Agrónomo',       CONDITION: 'ORDINARIO', DEDICATION: 'DE', CATEGORY: 'TITULAR',   CREATION_DATE: NOW, STATUS: 1, TITULO: 'PhD',  ATTENTION_SCHEDULE: 'Mar-Jue 8:00-16:00' },
      { person_id: personByCi.get(PERSON_CI[9])!,  TUTOR_CI: TUTOR_CI[3], NAME: 'Diana',    SECOND_NAME: 'Carolina', SURNAME: 'Contreras', SECOND_SURNAME: 'Mora',     CONTACT_PHONE: '04121240004', GENDER: 'F', EMAIL: 'diana.contreras@tutor.test.com',  PROFESSION: 'Licenciada en Educación',   CONDITION: 'CONTRATADO', DEDICATION: 'TC', CATEGORY: 'INSTRUCTOR', CREATION_DATE: NOW, STATUS: 1, TITULO: 'Licda', ATTENTION_SCHEDULE: 'Lun-Vie 8:00-17:00' },
      { person_id: personByCi.get(PERSON_CI[10])!, TUTOR_CI: TUTOR_CI[4], NAME: 'Alberto',  SECOND_NAME: null,       SURNAME: 'Moreno',    SECOND_SURNAME: 'Salazar',  CONTACT_PHONE: '04121240005', GENDER: 'M', EMAIL: 'alberto.moreno@tutor.test.com',   PROFESSION: 'Ingeniero Industrial',      CONDITION: 'ORDINARIO', DEDICATION: 'MT', CATEGORY: 'AGREGADO',   CREATION_DATE: NOW, STATUS: 1, TITULO: 'Ing',  ATTENTION_SCHEDULE: 'Lun-Mie 8:00-12:00' },
      { person_id: personByCi.get(PERSON_CI[11])!, TUTOR_CI: TUTOR_CI[5], NAME: 'Laura',    SECOND_NAME: 'Beatriz',  SURNAME: 'Medina',    SECOND_SURNAME: null,       CONTACT_PHONE: '04121240006', GENDER: 'F', EMAIL: 'laura.medina@tutor.test.com',     PROFESSION: 'Licenciada en Contaduría',  CONDITION: 'ORDINARIO', DEDICATION: 'TC', CATEGORY: 'ASISTENTE', CREATION_DATE: NOW, STATUS: 1, TITULO: 'MSc',  ATTENTION_SCHEDULE: 'Mar-Vie 8:00-15:00' },
      { person_id: personByCi.get(PERSON_CI[12])!, TUTOR_CI: TUTOR_CI[6], NAME: 'Fernando', SECOND_NAME: null,       SURNAME: 'Castro',    SECOND_SURNAME: 'Vargas',   CONTACT_PHONE: '04121240007', GENDER: 'M', EMAIL: 'fernando.castro@tutor.test.com',   PROFESSION: 'Administrador',             CONDITION: 'CONTRATADO', DEDICATION: 'MT', CATEGORY: 'INSTRUCTOR', CREATION_DATE: NOW, STATUS: 1, TITULO: 'Licdo', ATTENTION_SCHEDULE: 'Lun-Sab 8:00-17:00' },
      { person_id: personByCi.get(PERSON_CI[13])!, TUTOR_CI: TUTOR_CI[7], NAME: 'Patricia', SECOND_NAME: 'del Carmen', SURNAME: 'Rivas',  SECOND_SURNAME: 'Suarez',   CONTACT_PHONE: '04121240008', GENDER: 'F', EMAIL: 'patricia.rivas@tutor.test.com',    PROFESSION: 'Ingeniera de Sistemas',     CONDITION: 'ORDINARIO', DEDICATION: 'TC', CATEGORY: 'AGREGADO',   CREATION_DATE: NOW, STATUS: 1, TITULO: 'MSc',  ATTENTION_SCHEDULE: 'Lun-Vie 8:00-17:00' },
    ];

    for (const t of tutorRows) {
      const tid = await insertOrSkip('t_tutors', t as any, 'TUTOR_CI', t.TUTOR_CI, 'TUTOR_ID');
      ids.tutorIds.push(tid!);
      // Map tutor index → person_id (needed for tutor_person_id in PPT)
      // Look up person_id from the tutor row we inserted
      ids.tutorPersonIds.push(t.person_id);
    }
    console.log(`  → ${ids.tutorIds.length} tutores`);
    console.log(`    [0-1]=ACADEMICO  [2-3]=METODOLOGICO  [4-5]=EVALUADOR  [6-7]=INSTITUCIONAL`);

    // ---------- Step 5: t_institution_manager ----------
    console.log('[SeedReports] Insertando gerente de institución (t_institution_manager)...');
    const managerResult = await insertOrSkip(
      't_institution_manager',
      {
        person_id: personByCi.get(PERSON_CI[14])!,
        MANAGER_CI: MANAGER_CI,
        NAME: 'Miguel',
        SECOND_NAME: 'Angel',
        SURNAME: 'Soto',
        SECOND_SURNAME: 'Blanco',
        CONTACT_PHONE: '04121250001',
        EMAIL: 'miguel.soto@manager.test.com',
        CREATION_DATE: NOW,
        STATUS: 1,
        INSTITUTION_ID: ids.institutionIds[0],
        cargo: 'Director de Recursos Humanos',
        TITLE: 'Licdo',
      },
      'MANAGER_CI',
      MANAGER_CI,
      'MANAGER_ID'
    );
    const managerId = managerResult!;
    ids.managerId = managerId;
    console.log(`  → Manager ID: ${ids.managerId}`);

    // ---------- Step 5.5: t_internships_period — ensure period exists ----------
    const existingPeriods = await supabase.from('t_internships_period').select('PERIOD_ID').eq('PERIOD_ID', 1);
    if (existingPeriods.error || !existingPeriods.data?.length) {
      await supabase.from('t_internships_period').insert({
        PERIOD_ID: 1,
        START_DATE: '2025-01-01',
        END_DATE: '2025-12-31',
        ENROLLMENT_GRACE_DAYS: 21,
        EVALUATION_GRACE_DAYS: 10,
        CREATION_DATE: NOW,
        DESCRIPTION: 'PERIODO DE PRUEBA',
        PERIOD_STATUS: 'ACTIVO',
        STATUS: 1,
        T_INTERNSHIPS_CODE: 'TEST-001',
      });
    }
    // Ensure INTERNSHIP_TYPE_ID: 1 exists
    const existingTypes = await supabase.from('t_internship_type').select('INTERNSHIP_TYPE_ID').eq('INTERNSHIP_TYPE_ID', 1);
    if (existingTypes.error || !existingTypes.data?.length) {
      await supabase.from('t_internship_type').insert({
        INTERNSHIP_TYPE_ID: 1,
        NAME: 'ÚNICA',
        STATUS: 1,
        CREATION_DATE: NOW,
      });
    }

    // ---------- Step 6: t_professional_practices — 6 practices ----------
    console.log('[SeedReports] Insertando prácticas profesionales (t_professional_practices)...');
    // Career IDs: 3=TSU Enfermería, 4=ING Informática, 5=ING Agroindustrial
    // Internship Type ID: 1 (ÚNICA, already exists)
    //
    // PRACTICES_STATUS: 2 = INSCRITO, 3 = CULMINADO
    //
    // PRACTICES LAYOUT:
    // ┌──────────┬─────────┬──────────┬──────────────┬────────────┐
    // │ Practice │ Student │ Career   │ Institution  │ Status     │
    // ├──────────┼─────────┼──────────┼──────────────┼────────────┤
    // │ 1        │ S1      │ 4 (INF)  │ 1 (Hospital) │ INSCRITO   │
    // │ 2        │ S2      │ 3 (ENF)  │ 1 (Hospital) │ INSCRITO   │
    // │ 3        │ S3      │ 5 (AGRO) │ 3 (Agro)     │ INSCRITO   │
    // │ 4        │ S4      │ 4 (INF)  │ 2 (Alcaldía) │ INSCRITO   │
    // │ 5        │ S5      │ 5 (AGRO) │ 3 (Agro)     │ CULMINADO  │
    // │ 6        │ S6      │ 3 (ENF)  │ 1 (Hospital) │ CULMINADO  │
    // └──────────┴─────────┴──────────┴──────────────┴────────────┘

    const practiceRows = [
      {
        START_DATE: '2025-01-15',    END_DATE: '2025-04-15',
        REPORT_TITLE: 'Implementación de Sistema de Gestión Hospitalaria',
        REGISTRATION_DATE: NOW,      CREATION_DATE: NOW,
        GRADE: 18.50,                TRANSFER: 0,
        TOUR: 'DIURNO',              PERIOD_ID: 1,
        INSTITUTION_ID: ids.institutionIds[0],
        STUDENTS_ID: ids.studentIds[0],
        STATUS: 1,                   MANAGER_ID: ids.managerId,
        OBSERVATION: 'Estudiante destacado',
        ENROLLMENT: 'ENROLL-SEED001',
        INTERNSHIP_STATUS: 1,        INTERNSHIP_TYPE_ID: 1,
        PRACTICES_STATUS: 2,         EVALUATION_STATUS: 'pending',
        SEMESTER: '6',               SECTION: 'U',
        REGIME: 'PRESENCIAL',        CAREER_ID: 4,
        DEPARTMENT: 'Informática',
        student_person_id: personByCi.get(PERSON_CI[0])!,
      },
      {
        START_DATE: '2025-02-01',    END_DATE: '2025-05-30',
        REPORT_TITLE: 'Evaluación de Protocolos de Enfermería',
        REGISTRATION_DATE: NOW,      CREATION_DATE: NOW,
        GRADE: 16.00,                TRANSFER: 0,
        TOUR: 'DIURNO',              PERIOD_ID: 1,
        INSTITUTION_ID: ids.institutionIds[0],
        STUDENTS_ID: ids.studentIds[1],
        STATUS: 1,                   MANAGER_ID: ids.managerId,
        OBSERVATION: '',
        ENROLLMENT: 'ENROLL-SEED002',
        INTERNSHIP_STATUS: 1,        INTERNSHIP_TYPE_ID: 1,
        PRACTICES_STATUS: 2,         EVALUATION_STATUS: 'pending',
        SEMESTER: '6',               SECTION: 'U',
        REGIME: 'PRESENCIAL',        CAREER_ID: 3,
        DEPARTMENT: 'Enfermería',
        student_person_id: personByCi.get(PERSON_CI[1])!,
      },
      {
        START_DATE: '2025-03-01',    END_DATE: '2025-06-30',
        REPORT_TITLE: 'Optimización de Procesos Agroindustriales',
        REGISTRATION_DATE: NOW,      CREATION_DATE: NOW,
        GRADE: 19.00,                TRANSFER: 0,
        TOUR: 'DIURNO',              PERIOD_ID: 1,
        INSTITUTION_ID: ids.institutionIds[2],
        STUDENTS_ID: ids.studentIds[2],
        STATUS: 1,                   MANAGER_ID: ids.managerId,
        OBSERVATION: 'Práctica en empresa privada',
        ENROLLMENT: 'ENROLL-SEED003',
        INTERNSHIP_STATUS: 1,        INTERNSHIP_TYPE_ID: 1,
        PRACTICES_STATUS: 2,         EVALUATION_STATUS: 'pending',
        SEMESTER: '7',               SECTION: 'U',
        REGIME: 'PRESENCIAL',        CAREER_ID: 5,
        DEPARTMENT: 'Producción',
        student_person_id: personByCi.get(PERSON_CI[2])!,
      },
      {
        START_DATE: '2025-04-01',    END_DATE: '2025-07-15',
        REPORT_TITLE: 'Sistema de Registro Municipal',
        REGISTRATION_DATE: NOW,      CREATION_DATE: NOW,
        GRADE: 17.00,                TRANSFER: 0,
        TOUR: 'DIURNO',              PERIOD_ID: 1,
        INSTITUTION_ID: ids.institutionIds[1],
        STUDENTS_ID: ids.studentIds[3],
        STATUS: 1,                   MANAGER_ID: ids.managerId,
        OBSERVATION: '',
        ENROLLMENT: 'ENROLL-SEED004',
        INTERNSHIP_STATUS: 1,        INTERNSHIP_TYPE_ID: 1,
        PRACTICES_STATUS: 2,         EVALUATION_STATUS: 'pending',
        SEMESTER: '8',               SECTION: 'U',
        REGIME: 'PRESENCIAL',        CAREER_ID: 4,
        DEPARTMENT: 'Sistemas',
        student_person_id: personByCi.get(PERSON_CI[3])!,
      },
      {
        START_DATE: '2025-01-10',    END_DATE: '2025-04-10',
        REPORT_TITLE: 'Control de Calidad en Procesos Agroindustriales',
        REGISTRATION_DATE: NOW,      CREATION_DATE: NOW,
        GRADE: 15.00,                TRANSFER: 0,
        TOUR: 'DIURNO',              PERIOD_ID: 1,
        INSTITUTION_ID: ids.institutionIds[2],
        STUDENTS_ID: ids.studentIds[4],
        STATUS: 1,                   MANAGER_ID: ids.managerId,
        OBSERVATION: 'Práctica culminada',
        ENROLLMENT: 'ENROLL-SEED005',
        INTERNSHIP_STATUS: 1,        INTERNSHIP_TYPE_ID: 1,
        PRACTICES_STATUS: 3,         EVALUATION_STATUS: 'approved',
        SEMESTER: '7',               SECTION: 'U',
        REGIME: 'PRESENCIAL',        CAREER_ID: 5,
        DEPARTMENT: 'Calidad',
        student_person_id: personByCi.get(PERSON_CI[4])!,
      },
      {
        START_DATE: '2025-02-15',    END_DATE: '2025-05-15',
        REPORT_TITLE: 'Atención Primaria en Salud Comunitaria',
        REGISTRATION_DATE: NOW,      CREATION_DATE: NOW,
        GRADE: 20.00,                TRANSFER: 0,
        TOUR: 'NOCTURNO',            PERIOD_ID: 1,
        INSTITUTION_ID: ids.institutionIds[0],
        STUDENTS_ID: ids.studentIds[5],
        STATUS: 1,                   MANAGER_ID: ids.managerId,
        OBSERVATION: 'Excelente desempeño',
        ENROLLMENT: 'ENROLL-SEED006',
        INTERNSHIP_STATUS: 1,        INTERNSHIP_TYPE_ID: 1,
        PRACTICES_STATUS: 3,         EVALUATION_STATUS: 'certified',
        SEMESTER: '6',               SECTION: 'U',
        REGIME: 'PRESENCIAL',        CAREER_ID: 3,
        DEPARTMENT: 'Enfermería',
        student_person_id: personByCi.get(PERSON_CI[5])!,
      },
    ];

    for (const pr of practiceRows) {
      const { data, error } = await supabase
        .from('t_professional_practices')
        .insert(pr as any)
        .select('PROFESSIONAL_PRACTICE_ID')
        .single();

      if (error) throw new Error(`Error insertando práctica: ${error.message}`);
      ids.practiceIds.push(data!.PROFESSIONAL_PRACTICE_ID);
    }
    console.log(`  → ${ids.practiceIds.length} prácticas (IDs: ${ids.practiceIds.join(', ')})`);
    console.log(`    Prácticas 5-6 (índices 4-5): PRACTICES_STATUS=3 (CULMINADO)`);

    // ---------- Step 7: t_professional_practices_tutor — 12 assignments ----------
    console.log('[SeedReports] Insertando asignaciones tutor-práctica...');
    // Maps each practice to its tutor team:
    //
    // Practice 1 (INF, Hospital):     ACADEMICO(t0) + INSTITUCIONAL(t6)      → tests tutoresAcad + tutoresInst counting
    // Practice 2 (ENF, Hospital):     ACADEMICO(t1) + INSTITUCIONAL(t7)
    // Practice 3 (AGRO, Agro):        ACADEMICO(t0) + METODOLOGICO(t2) + INSTITUCIONAL(t6)
    // Practice 4 (INF, Alcaldía):     ACADEMICO(t1) + INSTITUCIONAL(t4)     ← EVALUADOR as INSTITUCIONAL
    // Practice 5 (AGRO, Agro):        ACADEMICO(t0) + METODOLOGICO(t3) + INSTITUCIONAL(t5)
    // Practice 6 (ENF, Hospital):     ACADEMICO(t1)
    //
    // Total: 12 assignments (surpasses the required 8, exercises more report scenarios)

    interface TutorAssignment {
      TUTOR_ID: number;
      TUTOR_PERSON_ID: number;
      PROFESSIONAL_PRACTICE_ID: number;
      TUTOR_TYPE: string;
    }

    const assignments: TutorAssignment[] = [
      // Practice 1
      { TUTOR_ID: ids.tutorIds[0], TUTOR_PERSON_ID: ids.tutorPersonIds[0], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[0], TUTOR_TYPE: 'ACADEMICO' },
      { TUTOR_ID: ids.tutorIds[6], TUTOR_PERSON_ID: ids.tutorPersonIds[6], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[0], TUTOR_TYPE: 'INSTITUCIONAL' },
      // Practice 2
      { TUTOR_ID: ids.tutorIds[1], TUTOR_PERSON_ID: ids.tutorPersonIds[1], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[1], TUTOR_TYPE: 'ACADEMICO' },
      { TUTOR_ID: ids.tutorIds[7], TUTOR_PERSON_ID: ids.tutorPersonIds[7], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[1], TUTOR_TYPE: 'INSTITUCIONAL' },
      // Practice 3
      { TUTOR_ID: ids.tutorIds[0], TUTOR_PERSON_ID: ids.tutorPersonIds[0], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[2], TUTOR_TYPE: 'ACADEMICO' },
      { TUTOR_ID: ids.tutorIds[2], TUTOR_PERSON_ID: ids.tutorPersonIds[2], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[2], TUTOR_TYPE: 'METODOLOGICO' },
      { TUTOR_ID: ids.tutorIds[6], TUTOR_PERSON_ID: ids.tutorPersonIds[6], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[2], TUTOR_TYPE: 'INSTITUCIONAL' },
      // Practice 4
      { TUTOR_ID: ids.tutorIds[1], TUTOR_PERSON_ID: ids.tutorPersonIds[1], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[3], TUTOR_TYPE: 'ACADEMICO' },
      { TUTOR_ID: ids.tutorIds[4], TUTOR_PERSON_ID: ids.tutorPersonIds[4], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[3], TUTOR_TYPE: 'INSTITUCIONAL' },
      // Practice 5
      { TUTOR_ID: ids.tutorIds[0], TUTOR_PERSON_ID: ids.tutorPersonIds[0], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[4], TUTOR_TYPE: 'ACADEMICO' },
      { TUTOR_ID: ids.tutorIds[3], TUTOR_PERSON_ID: ids.tutorPersonIds[3], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[4], TUTOR_TYPE: 'METODOLOGICO' },
      { TUTOR_ID: ids.tutorIds[5], TUTOR_PERSON_ID: ids.tutorPersonIds[5], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[4], TUTOR_TYPE: 'INSTITUCIONAL' },
      // Practice 6
      { TUTOR_ID: ids.tutorIds[1], TUTOR_PERSON_ID: ids.tutorPersonIds[1], PROFESSIONAL_PRACTICE_ID: ids.practiceIds[5], TUTOR_TYPE: 'ACADEMICO' },
    ];

    for (const a of assignments) {
      const { error } = await supabase
        .from('t_professional_practices_tutor')
        .insert({
          TUTOR_ID: a.TUTOR_ID,
          PROFESSIONAL_PRACTICE_ID: a.PROFESSIONAL_PRACTICE_ID,
          TUTOR_TYPE: a.TUTOR_TYPE,
          tutor_person_id: a.TUTOR_PERSON_ID,
        });
      if (error) throw new Error(`Error insertando asignación tutor: ${error.message}`);
    }
    console.log(`  → ${assignments.length} asignaciones creadas`);

    // ---------- Step 8: t_tutor_career ----------
    console.log('[SeedReports] Vinculando tutores con carreras (t_tutor_career)...');
    const tutorCareerLinks: Array<{ TUTOR_ID: number; CAREER_ID: number }> = [
      // Pedro (ACADEMICO) → ING Informática + ING Agroindustrial
      { TUTOR_ID: ids.tutorIds[0], CAREER_ID: 4 },
      { TUTOR_ID: ids.tutorIds[0], CAREER_ID: 5 },
      // Sofia (ACADEMICO) → TSU Enfermería
      { TUTOR_ID: ids.tutorIds[1], CAREER_ID: 3 },
      // Ricardo (METODOLOGICO) → ING Agroindustrial
      { TUTOR_ID: ids.tutorIds[2], CAREER_ID: 5 },
      // Diana (METODOLOGICO) → ING Agroindustrial
      { TUTOR_ID: ids.tutorIds[3], CAREER_ID: 5 },
      // Alberto (EVALUADOR) → ING Informática
      { TUTOR_ID: ids.tutorIds[4], CAREER_ID: 4 },
      // Laura (EVALUADOR) → ING Agroindustrial
      { TUTOR_ID: ids.tutorIds[5], CAREER_ID: 5 },
      // Fernando (INSTITUCIONAL) → ING Informática
      { TUTOR_ID: ids.tutorIds[6], CAREER_ID: 4 },
      // Patricia (INSTITUCIONAL) → TSU Enfermería
      { TUTOR_ID: ids.tutorIds[7], CAREER_ID: 3 },
    ];

    for (const link of tutorCareerLinks) {
      const { error } = await supabase
        .from('t_tutor_career')
        .upsert(
          {
            TUTOR_CAREER_ID: tutorCareerId++,
            TUTOR_ID: link.TUTOR_ID,
            CAREER_ID: link.CAREER_ID,
          },
          { onConflict: 'TUTOR_CAREER_ID', ignoreDuplicates: false }
        );
      if (error) console.warn(`  ⚠  t_tutor_career (tutor=${link.TUTOR_ID}, career=${link.CAREER_ID}): ${error.message}`);
    }
    console.log(`  → ${tutorCareerLinks.length} relaciones tutor-carrera`);

    console.log('\n[SeedReports] ✅ SEED COMPLETADO EXITOSAMENTE.\n');

    return { success: true, data: ids };

  } catch (error: any) {
    console.error('\n[SeedReports] ❌ ERROR DURANTE EL SEED:', error.message);
    return { success: false, data: ids, error: error.message };
  }
}

// ============================================================
// CLEANUP
// ============================================================

/**
 * Deletes all seed data in reverse FK order.
 * Identifies seed rows by CI/RIF prefix patterns.
 */
export async function cleanupReportsData(): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Find all seed IDs by CI/RIF patterns
    const [personsRes, studentsRes, tutorsRes, institutionsRes, managerRes] = await Promise.all([
      supabase.from('t_persons').select('person_id').in('ci', PERSON_CI),
      supabase.from('t_students').select('STUDENTS_ID').in('STUDENTS_CI', STUDENT_CI),
      supabase.from('t_tutors').select('TUTOR_ID').in('TUTOR_CI', TUTOR_CI),
      supabase.from('t_institution').select('INSTITUTION_ID').in('RIF', INSTITUTION_RIF),
      supabase.from('t_institution_manager').select('MANAGER_ID').eq('MANAGER_CI', MANAGER_CI),
    ]);

    const personIds = (personsRes.data || []).map(r => r.person_id);
    const studentIds = (studentsRes.data || []).map(r => r.STUDENTS_ID);
    const tutorIds = (tutorsRes.data || []).map(r => r.TUTOR_ID);
    const institutionIds = (institutionsRes.data || []).map(r => r.INSTITUTION_ID);
    const managerIds = (managerRes.data || []).map(r => r.MANAGER_ID);

    // Find practices linked to seed students
    let practiceIds: number[] = [];
    if (studentIds.length > 0) {
      const { data: practices } = await supabase
        .from('t_professional_practices')
        .select('PROFESSIONAL_PRACTICE_ID')
        .in('STUDENTS_ID', studentIds);
      practiceIds = (practices || []).map(p => p.PROFESSIONAL_PRACTICE_ID);
    }

    if (
      personIds.length === 0 &&
      studentIds.length === 0 &&
      tutorIds.length === 0 &&
      institutionIds.length === 0 &&
      practiceIds.length === 0
    ) {
      console.log('[SeedCleanup] No se encontraron datos previos para limpiar.');
      return { success: true };
    }

    console.log('[SeedCleanup] Eliminando datos de prueba...');

    // Delete in reverse FK order
    // a. t_professional_practices_tutor
    if (practiceIds.length > 0) {
      const { error } = await supabase.from('t_professional_practices_tutor').delete().in('PROFESSIONAL_PRACTICE_ID', practiceIds);
      if (error) console.warn(`  ⚠  PPT cleanup: ${error.message}`);
    }

    // b. t_tutor_career
    if (tutorIds.length > 0) {
      const { error } = await supabase.from('t_tutor_career').delete().in('TUTOR_ID', tutorIds);
      if (error) console.warn(`  ⚠  t_tutor_career cleanup: ${error.message}`);
    }

    // c. t_professional_practices
    if (practiceIds.length > 0) {
      const { error } = await supabase.from('t_professional_practices').delete().in('PROFESSIONAL_PRACTICE_ID', practiceIds);
      if (error) console.warn(`  ⚠  practices cleanup: ${error.message}`);
    }

    // d. t_institution_career
    if (institutionIds.length > 0) {
      const { error } = await supabase.from('t_institution_career').delete().in('INSTITUTION_ID', institutionIds);
      if (error) console.warn(`  ⚠  inst_career cleanup: ${error.message}`);
    }

    // e. t_institution_manager
    if (managerIds.length > 0) {
      const { error } = await supabase.from('t_institution_manager').delete().in('MANAGER_ID', managerIds);
      if (error) console.warn(`  ⚠  manager cleanup: ${error.message}`);
    }

    // f. t_institution
    if (institutionIds.length > 0) {
      const { error } = await supabase.from('t_institution').delete().in('INSTITUTION_ID', institutionIds);
      if (error) console.warn(`  ⚠  institution cleanup: ${error.message}`);
    }

    // g. t_tutors
    if (tutorIds.length > 0) {
      const { error } = await supabase.from('t_tutors').delete().in('TUTOR_ID', tutorIds);
      if (error) console.warn(`  ⚠  tutors cleanup: ${error.message}`);
    }

    // h. t_students
    if (studentIds.length > 0) {
      const { error } = await supabase.from('t_students').delete().in('STUDENTS_ID', studentIds);
      if (error) console.warn(`  ⚠  students cleanup: ${error.message}`);
    }

    // i. t_persons (last — all FK references removed)
    if (personIds.length > 0) {
      const { error } = await supabase.from('t_persons').delete().in('person_id', personIds);
      if (error) console.warn(`  ⚠  persons cleanup: ${error.message}`);
    }

    console.log('[SeedCleanup] ✅ Datos de prueba eliminados.');
    return { success: true };

  } catch (error: any) {
    console.error('[SeedCleanup] ❌ Error durante cleanup:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================================
// MAIN — ejecución directa: `npx tsx seed-reports.ts`
// ============================================================
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🧪 Seed — Datos de prueba para Reportes   ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  console.log('[Seed] 🧹 Limpiando datos previos...');
  const cleanup = await cleanupReportsData();
  if (!cleanup.success && cleanup.error) {
    console.error('[Seed] ❌ Error en cleanup:', cleanup.error);
    process.exit(1);
  }

  console.log('[Seed] 🌱 Insertando datos de prueba...');
  const result = await seedReportsData();

  if (!result.success) {
    console.error('[Seed] ❌ Error:', result.error);
    process.exit(1);
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   ✅ SEED COMPLETADO                            ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 Resumen:');
  const r = result.data || result;
  console.log(`   Estudiantes:          ${r.students?.length ?? 'N/A'}`);
  console.log(`   Tutores:              ${r.tutors?.length ?? 'N/A'}`);
  console.log(`   Instituciones:        ${r.institutions?.length ?? 'N/A'}`);
  console.log(`   Prácticas:            ${r.practices?.length ?? 'N/A'}`);
  console.log(`   Asignaciones tutor:   ${r.tutorAssignments?.length ?? 'N/A'}`);
  console.log('');
  console.log('🎯 Reportes cubiertos:');
  console.log('   - resumen-pasantias');
  console.log('   - tutores-academicos');
  console.log('   - relacion-empresas-demandan');
  console.log('   - distribucion-tutores / distribucion-tutores-v2');
  console.log('   - relacion-individual-docente');
  console.log('   - export-excel');
  console.log('');
  console.log('▶ Ejecutá los tests con:  cd backend && npx vitest --config tests/vitest.config.ts');
  console.log('▶ Probá manual:           GET /api/reports/resumen-pasantias?periodId=1');
  console.log('');
}

main().catch(console.error);
