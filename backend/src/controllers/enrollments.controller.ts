import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';
import { auditCreate, auditUpdate, auditStatusChange } from '../utils/audit-helpers.js';
import { PRACTICES_STATUS, PERIOD_STATUS } from '../constants/practice-status.constants.js';
import { getPersonField, getPersonFullName } from '../utils/person-utils.js';
import { checkSequentialPrerequisite } from '../utils/sequential-validation.js';
import { sanitizeText } from '../utils/text-utils.js';

const TABLE_NAME = 't_professional_practices';
const CACHE_PREFIX = 'enrollments:';
const CACHE_TTL = 300000;

const ENROLLMENT_COLUMNS_TO_AUDIT = [
  'INSTITUTION_ID', 'MANAGER_ID', 'PERIOD_ID', 'INTERNSHIP_TYPE_ID',
  'PRACTICES_STATUS', 'INTERNSHIP_STATUS', 'STATUS', 'OBSERVATION'
];

const ENROLLMENT_COLUMNS = 'PROFESSIONAL_PRACTICE_ID, START_DATE, END_DATE, REPORT_TITLE, REGISTRATION_DATE, GRADE, PRACTICES_STATUS, TRANSFER, TOUR, PERIOD_ID, INSTITUTION_ID, STUDENTS_ID, STATUS, MANAGER_ID, OBSERVATION, ENROLLMENT, INTERNSHIP_STATUS, INTERNSHIP_TYPE_ID, WITHDRAWAL_TYPE';

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
  const filterAll = req.query.filter === 'all';

  try {
    const supabase = dbManager.getConnection();

    // ── Resolver período activo (EN_CURSO) o pendiente más cercano ──
    let resolvedPeriodId: number | null = null;

    const { data: activePeriod } = await supabase
      .from('t_internships_period')
      .select('PERIOD_ID')
      .eq('PERIOD_STATUS', PERIOD_STATUS.EN_CURSO)
      .eq('STATUS', 1)
      .order('START_DATE', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activePeriod) {
      resolvedPeriodId = activePeriod.PERIOD_ID;
    } else {
      const { data: pendingPeriod } = await supabase
        .from('t_internships_period')
        .select('PERIOD_ID')
        .eq('PERIOD_STATUS', PERIOD_STATUS.PENDIENTE)
        .eq('STATUS', 1)
        .order('START_DATE', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (pendingPeriod) {
        resolvedPeriodId = pendingPeriod.PERIOD_ID;
      }
    }

    if (!resolvedPeriodId) {
      return res.json([]);
    }

    const cacheKey = `enrollments:period_${resolvedPeriodId}:${filterAll ? 'all' : 'active'}`;
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await dbManager.withRetry(async (supabase) => {
      let query = supabase
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
        .eq('PERIOD_ID', resolvedPeriodId);

      if (filterAll) {
        // Incluye: activos (STATUS=1, PRACTICES_STATUS=INSCRITO),
        // inactivados (STATUS=0, PRACTICES_STATUS=INSCRITO),
        // y retirados (PRACTICES_STATUS=RETIRADO)
        query = query.or(
          `and(STATUS.eq.1,PRACTICES_STATUS.in.(2,0)),STATUS.eq.0`
        );
      } else {
        query = query.eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO);
      }

      const { data, error } = await query.order('REGISTRATION_DATE', { ascending: false });

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

      const practicesStatus = item.PRACTICES_STATUS;
      const isWithdrawn = practicesStatus === PRACTICES_STATUS.RETIRADO;
      const isInactivated = !isWithdrawn && item.STATUS === 0;
      const recordType = isWithdrawn ? 'withdrawn' : isInactivated ? 'inactivated' : 'active';

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
        status: item.STATUS === 1,
        practicesStatus,
        recordType,
        withdrawalType: (item as any).WITHDRAWAL_TYPE || null,
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

      // Validar prerrequisito secuencial (ej: HOSP debe estar culminado antes de inscribir COM)
      const seqCheck = await checkSequentialPrerequisite(supabase, { practiceId: preEnrollmentRow.PROFESSIONAL_PRACTICE_ID });
      if (!seqCheck.valid) {
        const err = new Error(seqCheck.message);
        (err as any).status = 400;
        throw err;
      }

      // ── 3.1: Sequential prerequisite — find HOSP practice and set PREVIOUS_PRACTICE_ID ──
      // 3.2: Auto-resolve RETIRO_JUSTIFICADO if HOSP has pending withdrawal
      let previousPracticeId: number | null = null;

      const { data: internType } = await supabase
        .from('t_internship_type')
        .select('PRIORITY')
        .eq('INTERNSHIP_TYPE_ID', preEnrollmentRow.INTERNSHIP_TYPE_ID)
        .single();

      if (internType && internType.PRIORITY > 0) {
        // Get student's career
        const { data: studentData } = await supabase
          .from('t_students')
          .select('CAREER_ID')
          .eq('STUDENTS_ID', student.STUDENTS_ID)
          .single();

        if (studentData?.CAREER_ID) {
          // Get minimum grade for the career
          const { data: career } = await supabase
            .from('t_career')
            .select('MINIMUM_GRADE')
            .eq('CAREER_ID', studentData.CAREER_ID)
            .single();
          const minimumGrade = career?.MINIMUM_GRADE ?? 10;

          // Find higher-priority practice types from t_career_internship_type
          const { data: careerTypes } = await supabase
            .from('t_career_internship_type')
            .select('INTERNSHIP_TYPE_ID')
            .eq('CAREER_ID', studentData.CAREER_ID);

          if (careerTypes && careerTypes.length > 1) {
            const careerTypeIds = careerTypes.map((t: any) => t.INTERNSHIP_TYPE_ID);

            const { data: typePriorities } = await supabase
              .from('t_internship_type')
              .select('INTERNSHIP_TYPE_ID, PRIORITY')
              .in('INTERNSHIP_TYPE_ID', careerTypeIds);

            if (typePriorities) {
              const higherPriorityIds = (typePriorities as Array<{ INTERNSHIP_TYPE_ID: number; PRIORITY: number }>)
                .filter((t: any) => t.PRIORITY > internType.PRIORITY)
                .map((t: any) => t.INTERNSHIP_TYPE_ID);

              if (higherPriorityIds.length > 0) {
                // ── 3.2: Check for RETIRO_JUSTIFICADO on any higher-priority practice ──
                const { data: retiroPractices } = await supabase
                  .from(TABLE_NAME)
                  .select('PROFESSIONAL_PRACTICE_ID')
                  .eq('STUDENTS_ID', student.STUDENTS_ID)
                  .eq('CAREER_ID', studentData.CAREER_ID)
                  .in('INTERNSHIP_TYPE_ID', higherPriorityIds)
                  .eq('PRACTICES_STATUS', PRACTICES_STATUS.RETIRO_JUSTIFICADO)
                  .limit(1);

                if (retiroPractices && retiroPractices.length > 0) {
                  // Auto-resolve: set REPROBADO with reason
                  const retiroPracticeId = retiroPractices[0].PROFESSIONAL_PRACTICE_ID;
                  await supabase
                    .from(TABLE_NAME)
                    .update({
                      PRACTICES_STATUS: PRACTICES_STATUS.REPROBADO,
                      OBSERVATION: 'Reprobado por abandono (retiro justificado no renovado)'
                    })
                    .eq('PROFESSIONAL_PRACTICE_ID', retiroPracticeId);

                  // Audit the auto-resolve
                  await auditStatusChange(
                    req, TABLE_NAME, retiroPracticeId,
                    PRACTICES_STATUS.RETIRO_JUSTIFICADO, PRACTICES_STATUS.REPROBADO
                  ).catch(() => {});

                  const err = new Error('El estudiante tiene un retiro justificado sin resolver en una práctica previa. Se ha marcado como reprobado. Debe reinscribirse en la práctica anterior.');
                  (err as any).status = 400;
                  throw err;
                }

                // ── 3.1: Find the culminated+approved prerequisite practice ──
                const { data: prerequisite } = await supabase
                  .from(TABLE_NAME)
                  .select('PROFESSIONAL_PRACTICE_ID')
                  .eq('STUDENTS_ID', student.STUDENTS_ID)
                  .eq('CAREER_ID', studentData.CAREER_ID)
                  .in('INTERNSHIP_TYPE_ID', higherPriorityIds)
                  .eq('PRACTICES_STATUS', PRACTICES_STATUS.CULMINADO)
                  .gte('GRADE', minimumGrade)
                  .eq('STATUS', 1)
                  .order('PROFESSIONAL_PRACTICE_ID', { ascending: false })
                  .limit(1)
                  .maybeSingle();

                if (prerequisite) {
                  previousPracticeId = prerequisite.PROFESSIONAL_PRACTICE_ID;
                }
              }
            }
          }
        }
      }

      const updateData: Partial<ProfessionalPractice> & { ENROLLMENT?: string } = {
        REGISTRATION_DATE: now,
        PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO,
        INSTITUTION_ID: parseInt(institutionId),
        MANAGER_ID: parseInt(institutionResponsibleId),
        STATUS: 1,
        INTERNSHIP_STATUS: 1
      };

      if (previousPracticeId) {
        (updateData as any).PREVIOUS_PRACTICE_ID = previousPracticeId;
      }
      
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
      period,
      status
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
      if (status !== undefined) updateData.STATUS = status ? 1 : 0;

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

      // 3. Actualizar Tutores (upsert: buscar existente → UPDATE o INSERT)
      if (academicTutorId || methodologicalTutorId) {
        // Obtener tutores actuales (todos, activos e inactivos) para history y upsert
        const { data: oldTutors } = await supabase
          .from('t_professional_practices_tutor')
          .select('TUTOR_ID, TUTOR_TYPE, ACTIVE, t_tutors(t_persons!inner(first_name, last_name))')
          .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id));

        const tutorChanges = [];

        // Helper: upsert tutor (buscar existente → reactivar/UPDATE, o INSERT)
        const upsertTutor = async (tutorId: number, tutorType: string) => {
          const existing = oldTutors?.find((t: any) => t.TUTOR_TYPE === tutorType);
          const oldName = existing?.t_tutors?.t_persons
            ? `${(existing.t_tutors.t_persons as any).first_name} ${(existing.t_tutors.t_persons as any).last_name}`
            : '';
          const { data: newTutor } = await supabase.from('t_tutors').select('t_persons!inner(first_name, last_name)').eq('TUTOR_ID', tutorId).maybeSingle();
          const newName = newTutor?.t_persons
            ? `${(newTutor.t_persons as any).first_name} ${(newTutor.t_persons as any).last_name}`
            : String(tutorId);

          if (oldName && oldName !== newName) {
            tutorChanges.push({ fieldName: tutorType === 'ACADEMICO' ? 'TUTOR_ACADEMICO' : 'TUTOR_METODOLOGICO', oldValue: oldName, newValue: newName });
          }

          if (existing) {
            // Reactivar/UPDATE registro existente (evita conflicto de auto-increment)
            const { error: updateErr } = await supabase
              .from('t_professional_practices_tutor')
              .update({ TUTOR_ID: tutorId, ACTIVE: true, UPDATED_AT: new Date().toISOString() })
              .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id))
              .eq('TUTOR_TYPE', tutorType);
            if (updateErr) throw updateErr;
          } else {
            // INSERT solo si no existe ningún registro para este tipo
            const { error: insertErr } = await supabase
              .from('t_professional_practices_tutor')
              .insert({
                TUTOR_ID: tutorId,
                PROFESSIONAL_PRACTICE_ID: parseInt(id),
                TUTOR_TYPE: tutorType,
                ACTIVE: true,
                CREATED_AT: new Date().toISOString()
              });
            if (insertErr) throw insertErr;
          }
        };

        if (academicTutorId) {
          await upsertTutor(parseInt(academicTutorId), 'ACADEMICO');
        }

        if (methodologicalTutorId) {
          await upsertTutor(parseInt(methodologicalTutorId), 'METODOLOGICO');
        }

        // Desactivar tutores que NO están en la nueva asignación
        const activeTypes = [academicTutorId ? 'ACADEMICO' : null, methodologicalTutorId ? 'METODOLOGICO' : null].filter(Boolean);
        if (activeTypes.length > 0) {
          await supabase
            .from('t_professional_practices_tutor')
            .update({ ACTIVE: false, UPDATED_AT: new Date().toISOString() })
            .eq('PROFESSIONAL_PRACTICE_ID', parseInt(id))
            .eq('ACTIVE', true)
            .not('TUTOR_TYPE', 'in', `(${activeTypes.join(',')})`);
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
        PRACTICES_STATUS,
        WITHDRAWAL_TYPE,
        CAREER_ID,
        INTERNSHIP_TYPE_ID,
        t_persons!inner (
          ci,
          first_name,
          middle_name,
          last_name,
          second_last_name
        ),
        t_career (
          MINIMUM_GRADE
        ),
        t_institution (
          INSTITUTION_NAME
        ),
        t_internship_type (
          NAME
        ),
        t_professional_practices_tutor (
          TUTOR_ID,
          TUTOR_TYPE,
          ACTIVE
        )
      `)
      .eq('STATUS', 1)
      .in('PRACTICES_STATUS', [PRACTICES_STATUS.INSCRITO, PRACTICES_STATUS.REPROBADO, PRACTICES_STATUS.RETIRADO]);

    const { data: allPractices, error } = await query;

    if (error) throw error;

    // Incluir: INSCRITO, REPROBADO, y RETIRADO+unjustified (pendiente justificativo)
    const filteredPractices = (allPractices || []).filter((p: any) => {
      if (p.PRACTICES_STATUS === PRACTICES_STATUS.INSCRITO || p.PRACTICES_STATUS === PRACTICES_STATUS.REPROBADO) return true;
      if (p.PRACTICES_STATUS === PRACTICES_STATUS.RETIRADO && p.WITHDRAWAL_TYPE === 'unjustified') return true;
      return false;
    });

    let practices = filteredPractices.map((p: any) => {
      const sFirst = getPersonField(p.t_persons, 'first_name') || '';
      const sMiddle = getPersonField(p.t_persons, 'middle_name') || '';
      const sLast = getPersonField(p.t_persons, 'last_name') || '';
      const sSecondLast = getPersonField(p.t_persons, 'second_last_name') || '';
      const studentName = (sFirst || sLast) 
        ? [sFirst, sMiddle, sLast, sSecondLast].filter(Boolean).join(' ').trim()
        : 'Sin estudiante';
      
      const minimumGrade = p.t_career?.MINIMUM_GRADE ?? 10;
      const completed = p.EVALUATION_STATUS === 'completed';
      const failed = completed && p.GRADE != null && p.GRADE < minimumGrade;

      return {
        professionalPracticeId: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: getPersonField(p.t_persons, 'ci') || '',
        studentName,
        institutionName: p.t_institution?.INSTITUTION_NAME || 'Sin institución',
        evaluationStatus: p.EVALUATION_STATUS || 'pending',
        grade: p.GRADE,
        practicesStatus: p.PRACTICES_STATUS,
        withdrawalType: p.WITHDRAWAL_TYPE || null,
        result: failed ? 'failed' : (completed ? 'approved' : 'pending'),
        practiceType: p.t_internship_type?.NAME || '',
        practiceTypeId: p.INTERNSHIP_TYPE_ID,
        careerId: p.CAREER_ID,
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
 * PATCH /api/enrollments/:id/withdraw
 * Marca una práctica como RETIRADA (PRACTICES_STATUS = 0) con tipo de retiro.
 *
 * withdrawalType:
 *   'justified'   — abandono con justificativo, puede reinscribirse solo en la que falta
 *   'unjustified' — abandono sin justificativo, cuenta como reprobado
 *
 * Para retiros sin justificativo en prácticas secuenciales:
 *   Si el estudiante ya había completado una práctica de mayor prioridad,
 *   esa también se retira (cascade) — reinscripción completa desde 0.
 */
export const withdrawPractice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const practiceId = parseInt(id, 10);
    if (isNaN(practiceId)) {
      return res.status(400).json({ success: false, message: 'ID de práctica inválido' });
    }

    const { withdrawalType, justificationReason, withdrawComment } = req.body;
    if (!withdrawalType || !['justified', 'unjustified'].includes(withdrawalType)) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar withdrawalType: "justified" o "unjustified"'
      });
    }
    if (withdrawalType === 'justified' && (!justificationReason || justificationReason.trim().length < 10)) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un motivo de al menos 10 caracteres para el retiro justificado'
      });
    }

    const supabase = dbManager.getConnection();

    // Verificar que existe y no está culminada
    const { data: practice, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        PRACTICES_STATUS,
        STUDENTS_ID,
        CAREER_ID,
        INTERNSHIP_TYPE_ID
      `)
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (fetchError || !practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    if (practice.PRACTICES_STATUS === PRACTICES_STATUS.CULMINADO) {
      return res.status(400).json({
        success: false,
        message: 'No se puede retirar una práctica ya culminada'
      });
    }

    // Actualizar estado + tipo de retiro
    let observation = justificationReason
      ? `RETIRO ${withdrawalType === 'justified' ? 'CON JUSTIFICATIVO' : 'SIN JUSTIFICATIVO'}: ${justificationReason}`
      : undefined;
    if (withdrawComment) {
      observation += `\nComentario: ${withdrawComment}`;
    }
    const updateData: Record<string, any> = {
      PRACTICES_STATUS: PRACTICES_STATUS.RETIRADO,
      WITHDRAWAL_TYPE: withdrawalType,
      OBSERVATION: sanitizeText(observation) ?? '',
    };
    if (!observation) delete updateData.OBSERVATION;

    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

    if (updateError) throw updateError;

    // Auditoría principal
    await auditStatusChange(
      req, TABLE_NAME, practiceId,
      practice.PRACTICES_STATUS, PRACTICES_STATUS.RETIRADO
    );

    // ── Cascade: si es SIN justificativo y hay prácticas secuenciales ──
    if (withdrawalType === 'unjustified' && practice.STUDENTS_ID && practice.CAREER_ID && practice.INTERNSHIP_TYPE_ID) {
      const studentId = practice.STUDENTS_ID as number;
      const careerId = practice.CAREER_ID as number;
      try {
        const { data: currentType } = await supabase
          .from('t_internship_type')
          .select('PRIORITY')
          .eq('INTERNSHIP_TYPE_ID', practice.INTERNSHIP_TYPE_ID)
          .single();

        if (currentType && currentType.PRIORITY > 0) {
          // Buscar prácticas de MAYOR prioridad (prerrequisitos) que ya están CULMINADAS
          // Ej: si abandonó COMUNITARIA (PRIORITY=1) sin justificativo,
          // HOSPITALARIA (PRIORITY=2) que ya estaba culminada también se retira
          const { data: higherPriorityTypes } = await supabase
            .from('t_internship_type')
            .select('INTERNSHIP_TYPE_ID, PRIORITY, NAME')
            .gt('PRIORITY', currentType.PRIORITY);

          if (higherPriorityTypes && higherPriorityTypes.length > 0) {
            const higherIds = higherPriorityTypes.map((t: any) => t.INTERNSHIP_TYPE_ID);

            // Buscar prácticas CULMINADAS de mayor prioridad y retirarlas también
            const { data: completedHigher } = await supabase
              .from(TABLE_NAME)
              .select('PROFESSIONAL_PRACTICE_ID, INTERNSHIP_TYPE_ID')
              .eq('STUDENTS_ID', studentId)
              .eq('CAREER_ID', careerId)
              .eq('PRACTICES_STATUS', PRACTICES_STATUS.CULMINADO)
              .in('INTERNSHIP_TYPE_ID', higherIds)
              .eq('STATUS', 1);

            if (completedHigher && completedHigher.length > 0) {
              const higherIdsToCascade = completedHigher.map((p: any) => p.PROFESSIONAL_PRACTICE_ID);

              const { error: cascadeError } = await supabase
                .from(TABLE_NAME)
                .update({
                  PRACTICES_STATUS: PRACTICES_STATUS.RETIRADO,
                  WITHDRAWAL_TYPE: 'unjustified',
                  OBSERVATION: 'Retiro en cascada por abandono sin justificativo de práctica secuencial'
                })
                .in('PROFESSIONAL_PRACTICE_ID', higherIdsToCascade);

              if (!cascadeError) {
                // Auditoría por cada práctica afectada
                for (const pid of higherIdsToCascade) {
                  await auditStatusChange(
                    req, TABLE_NAME, pid,
                    PRACTICES_STATUS.CULMINADO, PRACTICES_STATUS.RETIRADO
                  ).catch(() => {}); // no romper si falla auditoría
                }
              }
            }
          }
        }
      } catch (cascadeErr) {
        console.warn('[Enrollments] Cascade withdrawal error (non-fatal):', cascadeErr);
      }
    }

    res.json({
      success: true,
      message: withdrawalType === 'justified'
        ? 'Práctica retirada con justificativo'
        : 'Práctica retirada sin justificativo'
    });
  } catch (error) {
    console.error('[Enrollments] Error withdrawing practice:', error);
    res.status(500).json({ success: false, message: 'Error al retirar práctica' });
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

/**
 * PATCH /api/enrollments/:id/reclassify-withdrawal
 * Reclasifica un retiro sin justificativo → con justificativo.
 * Revierte el cascade: las prácticas previas que fueron arrastradas
 * vuelven a CULMINADO.
 */
export const reclassifyWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const practiceId = parseInt(id, 10);
    if (isNaN(practiceId)) {
      return res.status(400).json({ success: false, message: 'ID de práctica inválido' });
    }

    const { justificationReason } = req.body;
    if (!justificationReason || justificationReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un motivo de al menos 10 caracteres'
      });
    }

    const supabase = dbManager.getConnection();

    // Verificar que existe y está RETIRADO+unjustified
    const { data: practice, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('PROFESSIONAL_PRACTICE_ID, PRACTICES_STATUS, WITHDRAWAL_TYPE, STUDENTS_ID, CAREER_ID')
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .single();

    if (fetchError || !practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    if (practice.PRACTICES_STATUS !== PRACTICES_STATUS.RETIRADO || practice.WITHDRAWAL_TYPE !== 'unjustified') {
      return res.status(400).json({
        success: false,
        message: 'Solo se puede reclasificar un retiro sin justificativo'
      });
    }

    // Cambiar a justificado
    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update({
        WITHDRAWAL_TYPE: 'justified',
        OBSERVATION: sanitizeText(`RECLASIFICADO A JUSTIFICATIVO: ${justificationReason}`) ?? '',
      })
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

    if (updateError) throw updateError;

    // Revertir cascade: restaurar prácticas que fueron arrastradas
    if (practice.STUDENTS_ID && practice.CAREER_ID) {
      try {
        const studentId = practice.STUDENTS_ID as number;
        const careerId = practice.CAREER_ID as number;

        const { data: cascadedPractices } = await supabase
          .from(TABLE_NAME)
          .select('PROFESSIONAL_PRACTICE_ID')
          .eq('STUDENTS_ID', studentId)
          .eq('CAREER_ID', careerId)
          .eq('PRACTICES_STATUS', PRACTICES_STATUS.RETIRADO)
          .eq('WITHDRAWAL_TYPE', 'unjustified')
          .neq('PROFESSIONAL_PRACTICE_ID', practiceId)
          .ilike('OBSERVATION', '%Retiro en cascada%');

        if (cascadedPractices && cascadedPractices.length > 0) {
          const cascadeIds = cascadedPractices.map((p: any) => p.PROFESSIONAL_PRACTICE_ID);

          const { error: restoreError } = await supabase
            .from(TABLE_NAME)
            .update({
              PRACTICES_STATUS: PRACTICES_STATUS.CULMINADO,
              WITHDRAWAL_TYPE: null,
              OBSERVATION: 'Restaurado por reclasificación a justificativo de práctica secuencial',
            })
            .in('PROFESSIONAL_PRACTICE_ID', cascadeIds);

          if (!restoreError) {
            for (const pid of cascadeIds) {
              await auditStatusChange(
                req, TABLE_NAME, pid,
                PRACTICES_STATUS.RETIRADO, PRACTICES_STATUS.CULMINADO
              ).catch(() => {});
            }
          }
        }
      } catch (restoreErr) {
        console.warn('[Enrollments] Cascade restore error (non-fatal):', restoreErr);
      }
    }

    res.json({
      success: true,
      message: 'Retiro reclasificado a con justificativo. Las prácticas previas fueron restauradas.'
    });
  } catch (error) {
    console.error('[Enrollments] Error reclassifying withdrawal:', error);
    res.status(500).json({ success: false, message: 'Error al reclasificar retiro' });
  }
};
