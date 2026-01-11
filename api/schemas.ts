import { z } from 'zod';

// --- Career Schema ---
export const careerSchema = z.object({
  CAREER_NAME: z.string().min(3).max(255),
  CAREER_CODE: z.number().int().positive(),
  MINIMUM_GRADE: z.number().min(0).max(20),
  CAREER_ABBREVIATION: z.string().max(20),
  STATUS: z.number().int().min(0).max(1).default(1),
});

// --- Student Schema ---
export const studentSchema = z.object({
  STUDENTS_CI: z.string().min(5).max(20),
  NAME: z.string().min(2).max(100),
  SECOND_NAME: z.string().max(100).optional().nullable(),
  SURNAME: z.string().min(2).max(100),
  SECOND_SURNAME: z.string().max(100).optional().nullable(),
  GENDER: z.enum(['M', 'F', 'O']), // Assuming M, F, O based on image 'bpchar'
  BIRTHDATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  CONTACT_PHONE: z.string().max(20),
  EMAIL: z.string().email(),
  ADDRESS: z.string().max(255),
  MARITAL_STATUS: z.string().max(50),
  SEMESTER: z.string().max(10),
  SECTION: z.string().max(10),
  REGIME: z.enum(['DIURNO', 'NOCTURNO', 'MIXTO']),
  STUDENT_TYPE: z.enum(['CIVIL', 'MILITAR']),
  MILITARY_RANK: z.string().max(100).optional().nullable(),
  EMPLOYMENT: z.string().max(100),
  STATUS: z.number().int().min(0).max(1).default(1),
  CAREER_ID: z.number().int().positive(),
});

// --- Tutor Schema ---
export const tutorSchema = z.object({
  TUTOR_CI: z.string().min(5).max(20),
  NAME: z.string().min(2).max(100),
  SECOND_NAME: z.string().max(100).optional().nullable(),
  SURNAME: z.string().min(2).max(100),
  SECOND_SURNAME: z.string().max(100).optional().nullable(),
  CONTACT_PHONE: z.string().max(20),
  GENDER: z.enum(['M', 'F', 'O']),
  EMAIL: z.string().email(),
  PROFESSION: z.string().max(100),
  CONDITION: z.string().max(100),
  DEDICATION: z.string().max(100),
  CATEGORY: z.string().max(100),
  STATUS: z.number().int().min(0).max(1).default(1),
});

// --- Period Schema ---
export const periodSchema = z.object({
  DESCRIPTION: z.string().min(3).max(255),
  START_DATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  END_DATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  PERIOD_STATUS: z.number().int().min(0).max(1).default(1),
  STATUS: z.number().int().min(0).max(1).default(1),
});

// --- Institution Schema ---
export const institutionSchema = z.object({
  INSTITUTION_NAME: z.string().min(3).max(255),
  INSTITUTION_CODE: z.string().max(50),
  ADDRESS: z.string().max(255),
  CONTACT_PHONE: z.string().max(20),
  EMAIL: z.string().email(),
  STATUS: z.number().int().min(0).max(1).default(1),
});

// --- Institutional Responsible Schema ---
export const responsibleSchema = z.object({
  RESPONSIBLE_CI: z.string().min(5).max(20),
  NAME: z.string().min(2).max(100),
  SECOND_NAME: z.string().max(100).optional().nullable(),
  SURNAME: z.string().min(2).max(100),
  SECOND_SURNAME: z.string().max(100).optional().nullable(),
  CONTACT_PHONE: z.string().max(20),
  GENDER: z.enum(['M', 'F', 'O']),
  EMAIL: z.string().email(),
  PROFESSION: z.string().max(100),
  CARGO: z.string().max(100),
  STATUS: z.number().int().min(0).max(1).default(1),
  INSTITUTION_ID: z.number().int().positive(),
});

// --- Enrollment Schema ---
export const enrollmentSchema = z.object({
  STUDENT_ID: z.number().int().positive(),
  PERIOD_ID: z.number().int().positive(),
  ENROLLMENT_DATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  STATUS: z.number().int().min(0).max(1).default(1),
});

// --- Pre-Enrollment Schema ---
export const preEnrollmentSchema = z.object({
  STUDENT_ID: z.number().int().positive(),
  PERIOD_ID: z.number().int().positive(),
  PRE_ENROLLMENT_DATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  STATUS: z.number().int().min(0).max(1).default(1),
});

export type CareerInput = z.infer<typeof careerSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type TutorInput = z.infer<typeof tutorSchema>;
export type PeriodInput = z.infer<typeof periodSchema>;
export type InstitutionInput = z.infer<typeof institutionSchema>;
export type ResponsibleInput = z.infer<typeof responsibleSchema>;
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type PreEnrollmentInput = z.infer<typeof preEnrollmentSchema>;
