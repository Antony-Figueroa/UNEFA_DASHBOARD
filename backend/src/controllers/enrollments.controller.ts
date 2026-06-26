import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { auditCreate, auditUpdate, auditStatusChange } from '../utils/audit-helpers.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';
import { getPersonField, getPersonFullName } from '../utils/person-utils.js';

const TABLE_NAME = 't_professional_practices';
const CACHE_PREFIX = 'enrollments:';
const CACHE_TTL = 300000;

const ENROLLMENT_COLUMNS_TO_AUDIT = [
  'INSTITUTION_ID', 'MANAGER_ID', 'PERIOD_ID', 'INTERNSHIP_TYPE_ID',
  'PRACTICES_STATUS', 'INTERNSHIP_STATUS', 'STATUS', 'OBSERVATION'
];

const ENROLLMENT_COLUMNS = 'PROFESSIONAL_PRACTICE_ID, START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, GRADE, PRACTICES_STATUS, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID';

const handleDbError = (res: Response, error: unknown) => {
  console.error('Error:', error);
  const dbError = error as { message?: string; details?: string; code?: string; status?: number };
  
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === 'PGRST204') {
    userMessage = 'Error: Registro no encontrado';
  } else if (dbError.message) {
    userMessage = dbError.message;
  }

  res.status(dbError.status || 500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

interface TutorAssociation {
  TUTOR_ID: number;
  TUTOR_TYPE: string;
  ACTIVE?: boolean;
  t_tutors?: {
    t_persons?: {
      first_name: string;
      last_name: string;
      phone?: string;
    };
  };
}

interface ProfessionalPractice {
  PROFESSIONAL_PRACTICE_ID: number;
  START_DATE?: string;
  END_DATE?: string;
  REPORT_TITLE?: string;
  REGISTRATION_DATE: string;
  CREATION_DATE?: string;
  GRADE?: number;
  PRACTICES_STATUS?: number;
  TRANSFER?: number;
  TOUR?: string;
  PERIOD_ID?: number;
  INSTITUTION_ID: number;
  STUDENTS_ID?: number;
  STATUS: number;
  MANAGER_ID: number;
  OBSERVATION?: string;
  ENROLLMENT: string;
  INTERNSHIP_STATUS?: number;
  INTERNSHIP_TYPE_ID?: number;
  t_persons?: { ci: string; first_name: string; middle_name?: string; last_name: string; second_last_name?: string };
  t_career?: {
    CAREER_NAME: string;
  };
  t_internships_period?: { DESCRIPTION: string };
  t_internship_type?: { NAME: string };
  t_institution?: { 
    INSTITUTION_NAME: string;
    INSTITUTION_ADDRESS: string;
    INSTITUTION_CONTACT: string;
    REGION: string;
    NUCLEUS: string;
    EXTENSION: string;
    INSTITUTION_TYPE: string;
  };
  t_institution_manager?: {
    person_id: number;
    t_persons: { first_name: string; last_name: string; phone?: string };
  };
  t_professional_practices_tutor?: TutorAssociation[];
}

export const getEnrollments = async (req: Request, res: Response) => {
  const cacheKey = `${CACHE_PREFIX}list`;
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          ${ENROLLMENT_COLUMNS},
          t_persons!inner (
            ci,
            first_name,
            middle_name,
            last_name,
            second_last_name
          ),
          t_career (CAREER_NAME),
          t_internships_period (DESCRIPTION),
          t_internship_type (NAME),
          t_institution (
            INSTITUTION_NAME,
            INSTITUTION_ADDRESS,
            INSTITUTION_CONTACT,
            REGION,
            NUCLEUS,
            EXTENSION,
            INSTITUTION_TYPE
          ),
          t_institution_manager (
            person_id,
            t_persons!inner (first_name, last_name, phone)
          ),
          t_professional_practices_tutor (
            TUTOR_ID,
            TUTOR_TYPE,
            ACTIVE,
            t_tutors (
              t_persons!inner (first_name, last_name, phone)
            )
          )
        `)
        .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO)
        .order('REGISTRATION_DATE', { ascending: false });

      if (error) throw error;
      return (data as unknown) as ProfessionalPractice[];
    }, 'getEnrollments');

    // Obtener todas las listas para mapear nombres completos
    const { data: listValues } = await dbManager.withRetry(async (supabase) => {
      return await supabase
        .from('t_value_list')
        .select('NAME, ABBREVIATION')
        .eq('STATUS', 1);
    }, 'getListValuesForMapping');

    const nameMap: Record<string, string> = {};
    if (listValues) {
      listValues.forEach((v: { NAME: string; ABBREVIATION: string }) => {
        if (v.NAME) {
          const upperName = v.NAME.toUpperCase();
          nameMap[upperName] = v.NAME;
        }
        if (v.ABBREVIATION) {
          const upperAbbr = v.ABBREVIATION.toUpperCase();
          nameMap[upperAbbr] = v.NAME; // Mapear abreviatura al nombre completo
        }
      });
    }

    // Mapear datos al formato que espera el frontend
    const mappedData = (data || []).map((item: ProfessionalPractice) => {
      const rawCi = getPersonField(item.t_persons, 'ci') || '';
      const ciParts = rawCi.split('-') || ['', ''];

      // Solo mostrar tutores activos
      const activeTutors = item.t_professional_practices_tutor?.filter((t: any) => t.ACTIVE !== false) || [];
      const academicTutor = activeTutors.find((t: TutorAssociation) => t.TUTOR_TYPE === 'ACADEMICO');
      const methodologicalTutor = activeTutors.find((t: TutorAssociation) => t.TUTOR_TYPE === 'METODOLOGICO');

      const getFullName = (val: string | undefined) => {
        if (!val) return '';
        const upperVal = val.toUpperCase();
        return nameMap[upperVal] || val;
      };

      return {
        enrollmentId: item.PROFESSIONAL_PRACTICE_ID?.toString() || '',
        identificationPrefix: ciParts[0] || 'V',
        identificationNumber: ciParts[1] || '',
        studentName: getPersonFullName(item.t_persons),
        careerName: item.t_career?.CAREER_NAME || '',
        academicTutorId: academicTutor?.TUTOR_ID?.toString() || '',
        academicTutorName: getPersonFullName(academicTutor?.t_tutors?.t_persons),
        academicTutorPhone: getPersonField(academicTutor?.t_tutors?.t_persons, 'phone') || '',
        methodologicalTutorId: methodologicalTutor?.TUTOR_ID?.toString() || '',
        methodologicalTutorName: getPersonFullName(methodologicalTutor?.t_tutors?.t_persons),
        methodologicalTutorPhone: getPersonField(methodologicalTutor?.t_tutors?.t_persons, 'phone') || '',
        institutionId: item.INSTITUTION_ID?.toString() || '',
        institutionName: item.t_institution?.INSTITUTION_NAME || '',
        institutionAddress: item.t_institution?.INSTITUTION_ADDRESS || '',
        institutionPhone: item.t_institution?.INSTITUTION_CONTACT || '',
        region: getFullName(item.t_institution?.REGION),
        nucleus: getFullName(item.t_institution?.NUCLEUS),
        extension: getFullName(item.t_institution?.EXTENSION),
        institutionType: getFullName(item.t_institution?.INSTITUTION_TYPE),
        institutionResponsibleId: item.MANAGER_ID?.toString() || '',
        institutionResponsibleName: getPersonFullName(item.t_institution_manager?.t_persons),
        institutionResponsiblePhone: getPersonField(item.t_institution_manager?.t_persons, 'phone') || '',
        practiceType: item.t_internship_type?.NAME || '',
        period: item.t_internships_period?.DESCRIPTION || '',
        enrollmentCode: item.ENROLLMENT || '',
        observation: item.OBSERVATION || '',
        enrollmentDate: item.REGISTRATION_DATE || '',
        status: item.STATUS === 1
      };
    });

    cacheManager.set(cacheKey, mappedData, CACHE_TTL);
    res.json(mappedData);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const createEnrollment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      identificationPrefix,
      identificationNumber,
      institutionId,
      institutionResponsibleId,
      academicTutorId,
      methodologicalTutorId
    } = req.body;

    const now = new Date().toISOString();

    const result = await dbManager.withRetry(async (supabase) => {
      const fullCI = `${identificationPrefix}-${identificationNumber}`;
      const { data: student, error: studentError } = await supabase
        .from('t_students')
        .select('STUDENTS_ID, t_persons!inner(ci)')
        .eq('t_persons.ci', fullCI)
        .single();
      
      if (studentError || !student) {
        const err = new Error('Estudiante no encontrado');
        (err as any).status = 404;
        throw err;
      }

      const { data: existingEnrollment } = await supabase
        .from(TABLE_NAME)
        .select('PROFESSIONAL_PRACTICE_ID')
        .eq('STUDENTS_ID', student.STUDENTS_ID)
        .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO)
        .eq('STATUS', 1)
        .limit(1);

      if (existingEnrollment && existingEnrollment.length > 0) {
        const err = new Error('El estudiante ya posee una inscripción activa');
        (err as any).status = 409;
        throw err;
      }

      const { data: preEnrollmentRow, error: preError } = await supabase
        .from(TABLE_NAME)
        .select('PROFESSIONAL_PRACTICE_ID, PERIOD_ID, INTERNSHIP_TYPE_ID')
        .eq('STUDENTS_ID', student.STUDENTS_ID)
        .eq('PRACTICES_STATUS', PRACTICES_STATUS.PRE_INSCRITO)
        .eq('STATUS', 1)
        .order('REGISTRATION_DATE', { ascending: false })
        .maybeSingle();

      if (preError) throw preError;
      if (!preEnrollmentRow) {
        const err = new Error('No existe una pre-inscripción activa para el estudiante');
        (err as any).status = 400;
        throw err;
      }

      // Validar que el estudiante no haya sido inscrito en este mismo período antes
      const { data: existingInPeriod } = await supabase
        .from(TABLE_NAME)
        .select('PROFESSIONAL_PRACTICE_ID')
        .eq('STUDENTS_ID', student.STUDENTS_ID)
        .eq('PERIOD_ID', preEnrollmentRow.PERIOD_ID)
        .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO)
        .neq('PROFESSIONAL_PRACTICE_ID', preEnrollmentRow.PROFESSIONAL_PRACTICE_ID)
        .limit(1);

      if (existingInPeriod && existingInPeriod.length > 0) {
        const err = new Error('El estudiante ya fue inscrito en este período anteriormente');
        (err as any).status = 409;
        throw err;
      }

      const updateData: Partial<ProfessionalPractice> & { ENROLLMENT?: string } = {
        REGISTRATION_DATE: now,
        PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO,
        INSTITUTION_ID: parseInt(institutionId),
        MANAGER_ID: parseInt(institutionResponsibleId),
        STATUS: 1,
        INTERNSHIP_STATUS: 1
      };
      
      const body: { enrollmentCode?: string } = req.body as { enrollmentCode?: string };
      if (body.enrollmentCode) {
        updateData.ENROLLMENT = body.enrollmentCode;
      }

      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('PROFESSIONAL_PRACTICE_ID', preEnrollmentRow.PROFESSIONAL_PRACTICE_ID)
        .single();

      const { data: practice, error: practiceError } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('PROFESSIONAL_PRACTICE_ID', preEnrollmentRow.PROFESSIONAL_PRACTICE_ID)
        .select()
        .single();

      if (practiceError) throw practiceError;

      if (oldData) {
        await auditUpdate(req, 't_professional_practices', oldData as Record<string, any>, updateData as Record<string, any>, ENROLLMENT_COLUMNS_TO_AUDIT);
      }

      const tutorsToInsert = [
        {
          TUTOR_ID: parseInt(academicTutorId),
          PROFESSIONAL_PRACTICE_ID: practice.PROFESSIONAL_PRACTICE_ID,
          TUTOR_TYPE: 'ACADEMICO',
          ACTIVE: true,
          CREATED_AT: new Date().toISOString()
        },
        {
          TUTOR_ID: parseInt(methodologicalTutorId),
          PROFESSIONAL_PRACTICE_ID: practice.PROFESSIONAL_PRACTICE_ID,
          TUTOR_TYPE: 'METODOLOGICO',
          ACTIVE: true,
          CREATED_AT: new Date().toISOString()
        }
      ];

      const { error: tutorsError } = await supabase
        .from('t_professional_practices_tutor')
        .insert(tutorsToInsert);

      if (tutorsError) throw tutorsError;

      const { data: fullData, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select(`
          ${ENROLLMENT_COLUMNS},
          t_persons!inner (
            ci,
            first_name,
            middle_name,
            last_name,
            second_last_name
          ),
          t_career (CAREER_NAME),
          t_internships_period (DESCRIPTION),
          t_internship_type (NAME),
          t_institution (INSTITUTION_NAME),
          t_institution_manager (
            person_id,
            t_persons!inner (first_name, last_name)
          ),
          t_professional_practices_tutor (
            TUTOR_ID,
            TUTOR_TYPE,
            ACTIVE,
            t_tutors (
              t_persons!inner (first_name, last_name)
            )
          )
        `)
        .eq('PROFESSIONAL_PRACTICE_ID', practice.PROFESSIONAL_PRACTICE_ID)
        .single();

      if (fetchError) throw fetchError;

      const item = fullData as unknown as ProfessionalPractice;
      const ciParts = (getPersonField(item.t_persons, 'ci') || '').split('-') || ['', ''];
      const activeTutors = item.t_professional_practices_tutor?.filter((t: any) => t.ACTIVE !== false) || [];
      const academicTutor = activeTutors.find((t: TutorAssociation) => t.TUTOR_TYPE === 'ACADEMICO');
      const methodologicalTutor = activeTutors.find((t: TutorAssociation) => t.TUTOR_TYPE === 'METODOLOGICO');

      return {
        enrollmentId: item.PROFESSIONAL_PRACTICE_ID?.toString() || '',
        identificationPrefix: ciParts[0] || 'V',
        identificationNumber: ciParts[1] || '',
        studentName: getPersonFullName(item.t_persons),
        careerName: item.t_career?.CAREER_NAME || '',
        academicTutorId: academicTutor?.TUTOR_ID?.toString() || '',
        academicTutorName: getPersonFullName(academicTutor?.t_tutors?.t_persons),
        methodologicalTutorId: methodologicalTutor?.TUTOR_ID?.toString() || '',
        methodologicalTutorName: getPersonFullName(methodologicalTutor?.t_tutors?.t_persons),
        institutionId: item.INSTITUTION_ID?.toString() || '',
        institutionName: item.t_institution?.INSTITUTION_NAME || '',
        institutionResponsibleId: item.MANAGER_ID?.toString() || '',
        institutionResponsibleName: getPersonFullName(item.t_institution_manager?.t_persons),
        practiceType: item.t_internship_type?.NAME || '',
        period: item.t_internships_period?.DESCRIPTION || '',
        enrollmentCode: item.ENROLLMENT || '',
        enrollmentDate: item.REGISTRATION_DATE || '',
        status: item.STATUS === 1
      };
    }, 'createEnrollment');

    // Invalidar caché
    cacheManager.deleteByPrefix(CACHE_PREFIX);

    res.status(201).json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateEnrollment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      academicTutorId,
      methodologicalTutorId,
      institutionId,
      institutionResponsibleId,
      practiceType,
      period
    } = req.body;

    const result = await dbManager.withRetry(async (supabase) => {
      let periodId, internshipTypeId;
      
      if (period) {
        const { data: p } = await supabase.from('t_internships_period').select('PERIOD_ID').eq('DESCRIPTION', period).single();
        periodId = p?.PERIOD_ID;
      }

      if (practiceType) {
        const { data: t } = await supabase.from('t_internship_type').select('INTERNSHIP_TYPE_ID').eq('NAME', practiceType).single();
        internshipTypeId = t?.INTERNSHIP_TYPE_ID;
      }

      const updateData: Partial<ProfessionalPractice> = {};
      if (institutionId) updateData.INSTITUTION_ID = parseInt(institutionId);
      if (institutionResponsibleId) updateData.MANAGER_ID = parseInt(institutionResponsibleId);
      if (periodId) updateData.PERIOD_ID = periodId;
      if (internshipTypeId) updateData.INTERNSHIP_TYPE_ID = internshipTypeId;

      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id))
        .single();

      // Guardar cambios de campos antes de actualizar
      const changes: { fieldName: string; oldValue: string | null; newValue: string | null }[] = [];

      if (institutionId && oldData && oldData.INSTITUTION_ID !== parseInt(institutionId)) {
        const { data: oldInst } = await supabase.from('t_institution').select('INSTITUTION_NAME').eq('INSTITUTION_ID', oldData.INSTITUTION_ID).maybeSingle();
        const { data: newInst } = await supabase.from('t_institution').select('INSTITUTION_NAME').eq('INSTITUTION_ID', parseInt(institutionId)).maybeSingle();
        changes.push({ fieldName: 'INSTITUTION', oldValue: oldInst?.INSTITUTION_NAME || String(oldData.INSTITUTION_ID), newValue: newInst?.INSTITUTION_NAME || institutionId });
      }
      if (institutionResponsibleId && oldData && oldData.MANAGER_ID !== parseInt(institutionResponsibleId)) {
        const { data: oldResp } = await supabase.from('t_institution_manager').select('t_persons!inner(first_name, last_name)').eq('MANAGER_ID', oldData.MANAGER_ID).maybeSingle();
        const { data: newResp } = await supabase.from('t_institution_manager').select('t_persons!inner(first_name, last_name)').eq('MANAGER_ID', parseInt(institutionResponsibleId)).maybeSingle();
        const oldName = oldResp?.t_persons ? `${(oldResp.t_persons as any).first_name} ${(oldResp.t_persons as any).last_name}` : String(oldData.MANAGER_ID);
        const newName = newResp?.t_persons ? `${(newResp.t_persons as any).first_name} ${(newResp.t_persons as any).last_name}` : institutionResponsibleId;
        changes.push({ fieldName: 'INSTITUTION_RESPONSIBLE', oldValue: oldName, newValue: newName });
      }
      if (periodId && oldData && oldData.PERIOD_ID !== periodId) {
        const { data: oldP } = await supabase.from('t_internships_period').select('DESCRIPTION').eq('PERIOD_ID', oldData.PERIOD_ID).maybeSingle();
        const { data: newP } = await supabase.from('t_internships_period').select('DESCRIPTION').eq('PERIOD_ID', periodId).maybeSingle();
        changes.push({ fieldName: 'PERIOD', oldValue: oldP?.DESCRIPTION || String(oldData.PERIOD_ID), newValue: newP?.DESCRIPTION || String(periodId) });
      }
      if (internshipTypeId && oldData && oldData.INTERNSHIP_TYPE_ID !== internshipTypeId) {
        const { data: oldT } = await supabase.from('t_internship_type').select('NAME').eq('INTERNSHIP_TYPE_ID', oldData.INTERNSHIP_TYPE_ID).maybeSingle();
        const { data: newT } = await supabase.from('t_internship_type').select('NAME').eq('INTERNSHIP_TYPE_ID', internshipTypeId).maybeSingle();
        changes.push({ fieldName: 'PRACTICE_TYPE', oldValue: oldT?.NAME || String(oldData.INTERNSHIP_TYPE_ID), newValue: newT?.NAME || String(internshipTypeId) });
      }

      const { data: practice, error: practiceError } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id))
        .select()
        .single();

      if (practiceError) throw practiceError;

      if (oldData) {
        await auditUpdate(req, 't_professional_practices', oldData as Record<string, any>, updateData as Record<string, any>, ENROLLMENT_COLUMNS_TO_AUDIT);
      }

      // Guardar cambios en tabla de historial
      const userId = req.user?.userId || 0;
      if (changes.length > 0) {
        const changeRows = changes.map(c => ({
          PROFESSIONAL_PRACTICE_ID: parseInt(id),
          FIELD_NAME: c.fieldName,
          OLD_VALUE: c.oldValue,
          NEW_VALUE: c.newValue,
          CHANGED_BY: userId
        }));
        const { error: changeError } = await supabase
          .from('t_enrollment_field_changes')
          .insert(changeRows);
        if (changeError) console.error('[updateEnrollment] Error saving field changes:', changeError);
      }

      // 3. Actualizar Tutores (soft-delete + insert)
      if (academicTutorId || methodologicalTutorId) {
        // Obtener tutores actuales para el history
        const { data: oldTutors } = await supabase
          .from('t_professional_practices_tutor')
          .select('TUTOR_ID, TUTOR_TYPE, t_tutors(t_persons!inner(first_name, last_name))')
          .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id))
          .eq('ACTIVE', true);

        // Soft-delete: marcar como inactivos
        await supabase
          .from('t_professional_practices_tutor')
          .update({ ACTIVE: false, UPDATED_AT: new Date().toISOString() })
          .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id))
          .eq('ACTIVE', true);

        const tutorChanges = [];
        const tutorsToInsert = [];

        if (academicTutorId) {
          const oldTutor = oldTutors?.find((t: any) => t.TUTOR_TYPE === 'ACADEMICO');
          const oldName = oldTutor?.t_tutors?.t_persons ? `${(oldTutor.t_tutors.t_persons as any).first_name} ${(oldTutor.t_tutors.t_persons as any).last_name}` : '';
          const { data: newTutor } = await supabase.from('t_tutors').select('t_persons!inner(first_name, last_name)').eq('TUTOR_ID', parseInt(academicTutorId)).maybeSingle();
          const newName = newTutor?.t_persons ? `${(newTutor.t_persons as any).first_name} ${(newTutor.t_persons as any).last_name}` : academicTutorId;
          if (oldName && oldName !== newName) {
            tutorChanges.push({ fieldName: 'TUTOR_ACADEMICO', oldValue: oldName, newValue: newName });
          }
          tutorsToInsert.push({
            TUTOR_ID: parseInt(academicTutorId),
            PROFESSIONAL_PRACTICE_ID: parseInt(id),
            TUTOR_TYPE: 'ACADEMICO',
            ACTIVE: true,
            CREATED_AT: new Date().toISOString()
          });
        }

        if (methodologicalTutorId) {
          const oldTutor = oldTutors?.find((t: any) => t.TUTOR_TYPE === 'METODOLOGICO');
          const oldName = oldTutor?.t_tutors?.t_persons ? `${(oldTutor.t_tutors.t_persons as any).first_name} ${(oldTutor.t_tutors.t_persons as any).last_name}` : '';
          const { data: newTutor } = await supabase.from('t_tutors').select('t_persons!inner(first_name, last_name)').eq('TUTOR_ID', parseInt(methodologicalTutorId)).maybeSingle();
          const newName = newTutor?.t_persons ? `${(newTutor.t_persons as any).first_name} ${(newTutor.t_persons as any).last_name}` : methodologicalTutorId;
          if (oldName && oldName !== newName) {
            tutorChanges.push({ fieldName: 'TUTOR_METODOLOGICO', oldValue: oldName, newValue: newName });
          }
          tutorsToInsert.push({
            TUTOR_ID: parseInt(methodologicalTutorId),
            PROFESSIONAL_PRACTICE_ID: parseInt(id),
            TUTOR_TYPE: 'METODOLOGICO',
            ACTIVE: true,
            CREATED_AT: new Date().toISOString()
          });
        }

        if (tutorsToInsert.length > 0) {
          const { error: tutorsError } = await supabase
            .from('t_professional_practices_tutor')
            .insert(tutorsToInsert);
          if (tutorsError) throw tutorsError;
        }

        // Guardar cambios de tutores en tabla de historial
        if (tutorChanges.length > 0) {
          const changeRows = tutorChanges.map(c => ({
            PROFESSIONAL_PRACTICE_ID: parseInt(id),
            FIELD_NAME: c.fieldName,
            OLD_VALUE: c.oldValue,
            NEW_VALUE: c.newValue,
            CHANGED_BY: userId
          }));
          const { error: changeError } = await supabase
            .from('t_enrollment_field_changes')
            .insert(changeRows);
          if (changeError) console.error('[updateEnrollment] Error saving tutor changes:', changeError);
        }
      }

      return practice;
    }, 'updateEnrollment');

    // Invalidar caché
    cacheManager.deleteByPrefix(CACHE_PREFIX);
    cacheManager.deleteByPrefix('students:');

    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deleteEnrollment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { data: oldData } = await supabase
        .from(TABLE_NAME)
        .select('PROFESSIONAL_PRACTICE_ID, STATUS')
        .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id))
        .single();

      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id));

      if (error) throw error;

      if (oldData) {
        await auditStatusChange(req, 't_professional_practices', id, oldData.STATUS, 0);
      }
    }, 'deleteEnrollment');

    // Invalidar caché
    cacheManager.deleteByPrefix(CACHE_PREFIX);
    cacheManager.deleteByPrefix('students:');
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getPracticesForEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    
    let query = supabase
      .from(TABLE_NAME)
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        GRADE,
        EVALUATION_STATUS,
        t_persons!inner (
          ci,
          first_name,
          middle_name,
          last_name,
          second_last_name
        ),
        t_institution (
          INSTITUTION_NAME
        ),
        t_professional_practices_tutor (
          TUTOR_ID,
          TUTOR_TYPE,
          ACTIVE
        )
      `)
      .eq('STATUS', 1)
      .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO);

    const { data: allPractices, error } = await query;

    if (error) throw error;

    let practices = (allPractices || []).map((p: any) => {
      const sFirst = getPersonField(p.t_persons, 'first_name') || '';
      const sMiddle = getPersonField(p.t_persons, 'middle_name') || '';
      const sLast = getPersonField(p.t_persons, 'last_name') || '';
      const sSecondLast = getPersonField(p.t_persons, 'second_last_name') || '';
      const studentName = (sFirst || sLast) 
        ? [sFirst, sMiddle, sLast, sSecondLast].filter(Boolean).join(' ').trim()
        : 'Sin estudiante';
      
      return {
        professionalPracticeId: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: getPersonField(p.t_persons, 'ci') || '',
        studentName,
        institutionName: p.t_institution?.INSTITUTION_NAME || 'Sin institución',
        evaluationStatus: p.EVALUATION_STATUS || 'pending',
        grade: p.GRADE,
        tutorAssignments: (p.t_professional_practices_tutor || []).filter((t: any) => t.ACTIVE !== false)
      };
    });

    if (userRole === 3 && userId) {
      const { data: tutorData } = await supabase
        .from('t_tutors')
        .select('TUTOR_ID')
        .eq('USER_ID', userId)
        .single();
      
      if (tutorData) {
        const tutorId = tutorData.TUTOR_ID;
        practices = practices.filter((p: any) => 
          p.tutorAssignments.some((t: any) => t.TUTOR_ID === tutorId)
        );
        practices = practices.map((p: any) => {
          const { tutorAssignments, ...rest } = p;
          return rest;
        });
      }
    } else {
      practices = practices.map((p: any) => {
        const { tutorAssignments, ...rest } = p;
        return rest;
      });
    }

    res.json({ success: true, data: practices });
  } catch (error) {
    console.error('[Enrollments] Error fetching practices for evaluation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener prácticas para evaluación' 
    });
  }
};

/**
 * Obtiene el historial de cambios de una inscripción
 */
export const getEnrollmentChanges = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = dbManager.getConnection();

    const { data, error } = await supabase
      .from('t_enrollment_field_changes')
      .select('*')
      .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id))
      .order('CHANGED_AT', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[Enrollments] Error fetching changes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial de cambios' 
    });
  }
};
