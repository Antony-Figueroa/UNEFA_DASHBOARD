import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { supabase } from '../lib/supabase.js';
import { evaluationConfig } from '../config/evaluation.config.js';

function getFullName(row: any): string {
  const parts = [row.NAME || '', row.SECOND_NAME || '', row.SURNAME || '', row.SECOND_SURNAME || ''];
  return parts.filter(Boolean).join(' ');
}

/** Resuelve abreviatura de título desde t_list/t_value_list */
async function resolveTituloAbrev(conn: any, titulo: string): Promise<string> {
  if (!titulo) return '';
  const { data: titleList } = await conn
    .from('t_list').select('LIST_ID').eq('NAME', 'TÍTULO').single();
  if (!titleList) return '';
  const { data: values } = await conn
    .from('t_value_list').select('NAME, ABBREVIATION')
    .eq('LIST_ID', titleList.LIST_ID).eq('STATUS', 1);
  const match = values?.find((v: any) => v.NAME.toLowerCase() === titulo.toLowerCase());
  return match?.ABBREVIATION || '';
}

async function getPracticeBase(supabase: any, practiceId: number) {
  const { data, error } = await supabase
    .from('t_professional_practices')
    .select(`
      PROFESSIONAL_PRACTICE_ID, START_DATE, END_DATE, GRADE, REGIME,
      SEMESTER, SECTION, DEPARTMENT,
      STUDENTS_ID, CAREER_ID, INSTITUTION_ID, PERIOD_ID, INTERNSHIP_TYPE_ID,
      t_students!inner(
        STUDENTS_ID, STUDENT_TYPE, EMPLOYMENT,
        t_persons!fk_students_person(
          ci, first_name, middle_name, last_name, second_last_name,
          email, phone, gender, address
        )
      ),
      t_career!inner(CAREER_NAME, CAREER_ABBREVIATION),
      t_institution(INSTITUTION_NAME, INSTITUTION_TYPE, INSTITUTION_ADDRESS,
        REGION, NUCLEUS, EXTENSION, RIF, INSTITUTION_CONTACT),
      t_internships_period(DESCRIPTION, START_DATE, END_DATE),
      t_internship_type(NAME)
    `)
    .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
    .single();

  if (error || !data) return null;
  return data;
}

async function getPracticeTutors(supabase: any, practiceId: number) {
  const { data } = await supabase
    .from('t_professional_practices_tutor')
    .select(`
      TUTOR_TYPE,
      t_tutors!inner(
        TUTOR_CI,
        TITULO,
        CONDITION,
        DEDICATION,
        CATEGORY,
        ATTENTION_SCHEDULE,
        person_id,
        t_persons(ci, first_name, middle_name, last_name, second_last_name, email, phone)
      )
    `)
    .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

  if (!data) return [];

  // Resolver abreviaturas de títulos batch (ponytail: una llamada por título único)
  const uniqueTitulos = [...new Set(data.map((item: any) => item.t_tutors?.TITULO).filter(Boolean))] as string[];
  const abrevMap = new Map<string, string>();
  for (const t of uniqueTitulos) {
    abrevMap.set(t, await resolveTituloAbrev(supabase, t));
  }

  return data.map((item: any) => {
    const tutor = item.t_tutors;
    const persona = tutor?.t_persons;
    return {
      tutorType: item.TUTOR_TYPE,
      ci: tutor.TUTOR_CI || persona?.ci || '',
      titulo: tutor.TITULO,
      tituloAbrev: tutor.TITULO ? abrevMap.get(tutor.TITULO) || '' : '',
      primerNombre: persona?.first_name || '',
      segundoNombre: persona?.middle_name || '',
      primerApellido: persona?.last_name || '',
      segundoApellido: persona?.second_last_name || '',
      condicion: tutor.CONDITION || '',
      dedicacion: tutor.DEDICATION || '',
      categoria: tutor.CATEGORY || '',
      telefono: persona?.phone || '',
      email: persona?.email || '',
    };
  });
}

async function getEvaluations(supabase: any, practiceId: number) {
  // 1. Obtener evaluaciones con sus detalles (scores)
  const { data: evals } = await supabase
    .from('t_evaluation')
    .select(`
      EVALUATION_ID, EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI,
      TOTAL_SCORE, OBSERVATIONS, EVALUATION_DATE, COMITE_MEMBER_INDEX,
      t_evaluation_detail(ITEM_NUMBER, SCORE)
    `)
    .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

  if (!evals || evals.length === 0) return [];

  // 2. Reunir tipos de evaluador únicos para buscar sus criterios
  const evaluatorTypes = [...new Set(evals.map((e: any) => e.EVALUATOR_TYPE))];

  const { data: allCriteria } = await supabase
    .from('t_evaluation_criteria')
    .select('ITEM_NUMBER, DESCRIPTION, EVALUATOR_TYPE')
    .in('EVALUATOR_TYPE', evaluatorTypes)
    .eq('STATUS', 1);

  // 3. Indexar criterios por EVALUATOR_TYPE + ITEM_NUMBER
  const criteriaByTypeItem = new Map<string, string>();
  for (const c of allCriteria || []) {
    criteriaByTypeItem.set(`${c.EVALUATOR_TYPE}:${c.ITEM_NUMBER}`, c.DESCRIPTION);
  }

  // 4. Armar respuesta con descripciones
  return evals.map((e: any) => ({
    evaluationId: e.EVALUATION_ID,
    evaluatorType: e.EVALUATOR_TYPE,
    evaluatorName: e.EVALUATOR_NAME,
    evaluatorCi: e.EVALUATOR_CI || '',
    totalScore: e.TOTAL_SCORE || 0,
    observations: e.OBSERVATIONS || '',
    evaluationDate: e.EVALUATION_DATE,
    comiteMemberIndex: e.COMITE_MEMBER_INDEX || null,
    criterios: (e.t_evaluation_detail || []).map((d: any) => ({
      itemNumber: d.ITEM_NUMBER,
      description: criteriaByTypeItem.get(`${e.EVALUATOR_TYPE}:${d.ITEM_NUMBER}`) || '',
      score: d.SCORE || 0,
    })),
  }));
}

export const getDataAceptacionTutor = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const practiceId = parseInt(String(req.params.practiceId));
    const practice = await getPracticeBase(supabase, practiceId);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const tutors = await getPracticeTutors(supabase, practiceId);
    const tutorAcademico = tutors.find((t: any) => 
      t.tutorType?.toUpperCase().includes('ACADEMIC')
    );
    console.log('[getDataAceptacionTutor] tutors:', tutors.map(t => ({ type: t.tutorType, name: t.primerNombre, surname: t.primerApellido })));
    console.log('[getDataAceptacionTutor] tutorAcademico selected:', tutorAcademico);
    const estudiante: any = practice.t_students;
    const carrera: any = practice.t_career;

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: {
          ci: (estudiante.t_persons?.ci ?? estudiante.STUDENTS_CI) || '',
          primerNombre: (estudiante.t_persons?.first_name ?? estudiante.NAME) || '',
          segundoNombre: (estudiante.t_persons?.middle_name ?? estudiante.SECOND_NAME) || '',
          primerApellido: (estudiante.t_persons?.last_name ?? estudiante.SURNAME) || '',
          segundoApellido: (estudiante.t_persons?.second_last_name ?? estudiante.SECOND_SURNAME) || '',
          telefono: (estudiante.t_persons?.phone ?? estudiante.CONTACT_PHONE) || '',
          email: (estudiante.t_persons?.email ?? estudiante.EMAIL) || '',
          genero: (estudiante.t_persons?.gender ?? estudiante.GENDER) || '',
          tipoEstudiante: estudiante.STUDENT_TYPE || '',
          empleo: estudiante.EMPLOYMENT || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        tutor: tutorAcademico ? {
          ci: tutorAcademico.ci || '',
          titulo: tutorAcademico.titulo,
          tituloAbrev: tutorAcademico.tituloAbrev || '',
          primerNombre: tutorAcademico.primerNombre || '',
          segundoNombre: tutorAcademico.segundoNombre || '',
          primerApellido: tutorAcademico.primerApellido || '',
          segundoApellido: tutorAcademico.segundoApellido || '',
          condicion: tutorAcademico.condicion || '',
          dedicacion: tutorAcademico.dedicacion || '',
          categoria: tutorAcademico.categoria || '',
          telefono: tutorAcademico.telefono || '',
          email: tutorAcademico.email || '',
        } : null,
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataAceptacionTutor error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

export const getDataSolicitudInstitucion = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const practiceId = parseInt(String(req.params.practiceId));
    const practice = await getPracticeBase(supabase, practiceId);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const estudiante: any = practice.t_students;
    const carrera: any = practice.t_career;
    const institucion: any = practice.t_institution;
    const periodo: any = practice.t_internships_period;

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: {
          ci: (estudiante.t_persons?.ci ?? estudiante.STUDENTS_CI) || '',
          primerNombre: (estudiante.t_persons?.first_name ?? estudiante.NAME) || '',
          segundoNombre: (estudiante.t_persons?.middle_name ?? estudiante.SECOND_NAME) || '',
          primerApellido: (estudiante.t_persons?.last_name ?? estudiante.SURNAME) || '',
          segundoApellido: (estudiante.t_persons?.second_last_name ?? estudiante.SECOND_SURNAME) || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        institucion: institucion ? {
          nombre: institucion.INSTITUTION_NAME,
          tipo: institucion.INSTITUTION_TYPE,
          direccion: institucion.INSTITUTION_ADDRESS || '',
          region: institucion.REGION || '',
          nucleo: institucion.NUCLEUS || '',
          extension: institucion.EXTENSION || '',
          rif: institucion.RIF || '',
        } : null,
        periodo: periodo ? {
          description: periodo.DESCRIPTION || '',
          startDate: periodo.START_DATE || '',
          endDate: periodo.END_DATE || '',
        } : null,
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataSolicitudInstitucion error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

export const getDataCartaPostulacion = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const practiceId = parseInt(String(req.params.practiceId));
    const practice = await getPracticeBase(supabase, practiceId);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const tutors = await getPracticeTutors(supabase, practiceId);
    const tutorInstitucional = tutors.find((t: any) => t.tutorType === 'INSTITUCIONAL');
    const estudiante: any = practice.t_students;
    const carrera: any = practice.t_career;
    const institucion: any = practice.t_institution;

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: {
          ci: (estudiante.t_persons?.ci ?? estudiante.STUDENTS_CI) || '',
          primerNombre: (estudiante.t_persons?.first_name ?? estudiante.NAME) || '',
          segundoNombre: (estudiante.t_persons?.middle_name ?? estudiante.SECOND_NAME) || '',
          primerApellido: (estudiante.t_persons?.last_name ?? estudiante.SURNAME) || '',
          segundoApellido: (estudiante.t_persons?.second_last_name ?? estudiante.SECOND_SURNAME) || '',
          telefono: (estudiante.t_persons?.phone ?? estudiante.CONTACT_PHONE) || '',
          email: (estudiante.t_persons?.email ?? estudiante.EMAIL) || '',
          empleo: estudiante.EMPLOYMENT || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        institucion: institucion ? {
          nombre: institucion.INSTITUTION_NAME,
          tipo: institucion.INSTITUTION_TYPE,
          direccion: institucion.INSTITUTION_ADDRESS || '',
        } : null,
        practica: {
          practiceId: practice.PROFESSIONAL_PRACTICE_ID,
          regime: practice.REGIME || '',
          semester: practice.SEMESTER || '',
          section: practice.SECTION || '',
          startDate: practice.START_DATE || '',
          endDate: practice.END_DATE || '',
        },
        tutorInstitucional: tutorInstitucional ? {
          ci: tutorInstitucional.ci || '',
          titulo: tutorInstitucional.titulo,
          tituloAbrev: tutorInstitucional.tituloAbrev || '',
          primerNombre: tutorInstitucional.primerNombre || '',
          segundoNombre: tutorInstitucional.segundoNombre || '',
          primerApellido: tutorInstitucional.primerApellido || '',
          segundoApellido: tutorInstitucional.segundoApellido || '',
        } : null,
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataCartaPostulacion error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

export const getDataActaValidacion = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const practiceId = parseInt(String(req.params.practiceId));
    const practice = await getPracticeBase(supabase, practiceId);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const estudiante: any = practice.t_students;
    const carrera: any = practice.t_career;

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: {
          ci: (estudiante.t_persons?.ci ?? estudiante.STUDENTS_CI) || '',
          primerNombre: (estudiante.t_persons?.first_name ?? estudiante.NAME) || '',
          segundoNombre: (estudiante.t_persons?.middle_name ?? estudiante.SECOND_NAME) || '',
          primerApellido: (estudiante.t_persons?.last_name ?? estudiante.SURNAME) || '',
          segundoApellido: (estudiante.t_persons?.second_last_name ?? estudiante.SECOND_SURNAME) || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataActaValidacion error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

export const getDataEvaluacionFinal = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const practiceId = parseInt(String(req.params.practiceId));
    const practice = await getPracticeBase(supabase, practiceId);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const estudiante: any = practice.t_students;
    const carrera: any = practice.t_career;
    const institucion: any = practice.t_institution;
    const evaluaciones = await getEvaluations(supabase, practiceId);

    const evalInst = evaluaciones.find((e: any) => e.evaluatorType === 'INSTITUCIONAL');
    const evalAcad = evaluaciones.find((e: any) => e.evaluatorType === 'ACADEMICO');
    const evalComite = evaluaciones.find((e: any) => e.evaluatorType === 'COMITE');

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: {
          ci: (estudiante.t_persons?.ci ?? estudiante.STUDENTS_CI) || '',
          primerNombre: (estudiante.t_persons?.first_name ?? estudiante.NAME) || '',
          segundoNombre: (estudiante.t_persons?.middle_name ?? estudiante.SECOND_NAME) || '',
          primerApellido: (estudiante.t_persons?.last_name ?? estudiante.SURNAME) || '',
          segundoApellido: (estudiante.t_persons?.second_last_name ?? estudiante.SECOND_SURNAME) || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        institucion: institucion ? {
          nombre: institucion.INSTITUTION_NAME,
          tipo: institucion.INSTITUTION_TYPE,
        } : null,
        practica: {
          startDate: practice.START_DATE || '',
          endDate: practice.END_DATE || '',
          grade: practice.GRADE || 0,
        },
        evaluaciones: {
          tutorInstitucional: evalInst ? { parcial: evalInst.totalScore || 0, weight: evaluationConfig.weights.INSTITUCIONAL } : null,
          tutorAcademico: evalAcad ? { parcial: evalAcad.totalScore || 0, weight: evaluationConfig.weights.ACADEMICO } : null,
          comiteEvaluador: evalComite ? { parcial: evalComite.totalScore || 0, weight: evaluationConfig.weights.COMITE } : null,
          notaFinal: practice.GRADE || 0,
        },
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataEvaluacionFinal error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

export const getDataEvaluacionTutorInstitucional = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const practiceId = parseInt(String(req.params.practiceId));
    const practice = await getPracticeBase(supabase, practiceId);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const tutors = await getPracticeTutors(supabase, practiceId);
    const tutorInst = tutors.find((t: any) => t.tutorType === 'INSTITUCIONAL');
    const estudiante: any = practice.t_students;
    const carrera: any = practice.t_career;
    const institucion: any = practice.t_institution;
    const evaluaciones = await getEvaluations(supabase, practiceId);
    const evalInst = evaluaciones.find((e: any) => e.evaluatorType === 'INSTITUCIONAL');

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: {
          ci: (estudiante.t_persons?.ci ?? estudiante.STUDENTS_CI) || '',
          primerNombre: (estudiante.t_persons?.first_name ?? estudiante.NAME) || '',
          segundoNombre: (estudiante.t_persons?.middle_name ?? estudiante.SECOND_NAME) || '',
          primerApellido: (estudiante.t_persons?.last_name ?? estudiante.SURNAME) || '',
          segundoApellido: (estudiante.t_persons?.second_last_name ?? estudiante.SECOND_SURNAME) || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        institucion: institucion ? { nombre: institucion.INSTITUTION_NAME } : null,
        department: practice.DEPARTMENT || null,
        tutorInstitucional: tutorInst ? {
          ci: tutorInst.ci || '',
          titulo: tutorInst.titulo,
          tituloAbrev: tutorInst.tituloAbrev || '',
          primerNombre: tutorInst.primerNombre || '',
          segundoNombre: tutorInst.segundoNombre || '',
          primerApellido: tutorInst.primerApellido || '',
          segundoApellido: tutorInst.segundoApellido || '',
        } : null,
        evaluacion: evalInst || null,
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataEvaluacionTutorInstitucional error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

export const getDataEvaluacionTutorAcademico = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const practiceId = parseInt(String(req.params.practiceId));
    const practice = await getPracticeBase(supabase, practiceId);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const tutors = await getPracticeTutors(supabase, practiceId);
    const tutorAcad = tutors.find((t: any) => t.tutorType === 'ACADEMICO');
    const estudiante: any = practice.t_students;
    const carrera: any = practice.t_career;
    const periodo: any = practice.t_internships_period;
    const evaluaciones = await getEvaluations(supabase, practiceId);
    const evalAcad = evaluaciones.find((e: any) => e.evaluatorType === 'ACADEMICO');

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: {
          ci: (estudiante.t_persons?.ci ?? estudiante.STUDENTS_CI) || '',
          primerNombre: (estudiante.t_persons?.first_name ?? estudiante.NAME) || '',
          segundoNombre: (estudiante.t_persons?.middle_name ?? estudiante.SECOND_NAME) || '',
          primerApellido: (estudiante.t_persons?.last_name ?? estudiante.SURNAME) || '',
          segundoApellido: (estudiante.t_persons?.second_last_name ?? estudiante.SECOND_SURNAME) || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        tutorAcademico: tutorAcad ? {
          ci: tutorAcad.ci || '',
          titulo: tutorAcad.titulo,
          tituloAbrev: tutorAcad.tituloAbrev || '',
          primerNombre: tutorAcad.primerNombre || '',
          segundoNombre: tutorAcad.segundoNombre || '',
          primerApellido: tutorAcad.primerApellido || '',
          segundoApellido: tutorAcad.segundoApellido || '',
        } : null,
        periodo: periodo ? {
          description: periodo.DESCRIPTION || '',
          startDate: periodo.START_DATE || '',
          endDate: periodo.END_DATE || '',
        } : null,
        evaluacion: evalAcad || null,
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataEvaluacionTutorAcademico error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

export const getDataEvaluacionComite = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const practiceId = parseInt(String(req.params.practiceId));
    const practice = await getPracticeBase(supabase, practiceId);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const tutors = await getPracticeTutors(supabase, practiceId);
    const tutorAcad = tutors.find((t: any) => t.tutorType === 'ACADEMICO');
    const estudiante: any = practice.t_students;
    const carrera: any = practice.t_career;
    const periodo: any = practice.t_internships_period;

    const { data: coordinadores } = await supabase
      .from('t_coordinadores')
      .select(`
        COORDINADOR_ID, TIPO, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
        CI, CARGO, CAREER_ID,
        t_career!left(CAREER_NAME)
      `)
      .eq('STATUS', 1);

    const coordinadorPP = (coordinadores || []).find((c: any) => c.TIPO === 'PP');
    const coordinadorCarrera = (coordinadores || []).find(
      (c: any) => c.TIPO === 'CARRERA' && c.CAREER_ID === practice.CAREER_ID
    );

    const evaluaciones = await getEvaluations(supabase, practiceId);
    const evaluacionesComite = evaluaciones
      .filter((e: any) => e.evaluatorType === 'COMITE')
      .sort((a: any, b: any) => (a.comiteMemberIndex || 0) - (b.comiteMemberIndex || 0));

    // Promedio de las 3 evaluaciones del comité — sin redondeo, el frontend formatea
    let comiteTotalScore = 0;
    if (evaluacionesComite.length > 0) {
      comiteTotalScore = evaluacionesComite.reduce((sum: number, e: any) => sum + e.totalScore, 0) / evaluacionesComite.length;
    }

    const formatCoord = (c: any) => c ? {
      coordinadorId: c.COORDINADOR_ID,
      tipo: c.TIPO,
      nombreCompleto: getFullName(c),
      ci: c.CI || '',
      cargo: c.CARGO || '',
      carreraNombre: c.t_career?.CAREER_NAME || null,
    } : null;

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: {
          ci: (estudiante.t_persons?.ci ?? estudiante.STUDENTS_CI) || '',
          primerNombre: (estudiante.t_persons?.first_name ?? estudiante.NAME) || '',
          segundoNombre: (estudiante.t_persons?.middle_name ?? estudiante.SECOND_NAME) || '',
          primerApellido: (estudiante.t_persons?.last_name ?? estudiante.SURNAME) || '',
          segundoApellido: (estudiante.t_persons?.second_last_name ?? estudiante.SECOND_SURNAME) || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        tutorAcademico: tutorAcad ? {
          ci: tutorAcad.ci || '',
          titulo: tutorAcad.titulo,
          tituloAbrev: tutorAcad.tituloAbrev || '',
          primerNombre: tutorAcad.primerNombre || '',
          segundoNombre: tutorAcad.segundoNombre || '',
          primerApellido: tutorAcad.primerApellido || '',
          segundoApellido: tutorAcad.segundoApellido || '',
        } : null,
        periodo: periodo ? {
          description: periodo.DESCRIPTION || '',
          startDate: periodo.START_DATE || '',
          endDate: periodo.END_DATE || '',
        } : null,
        coordinadorPP: formatCoord(coordinadorPP),
        coordinadorCarrera: formatCoord(coordinadorCarrera),
        evaluacionesComite,
        comiteTotalScore,
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataEvaluacionComite error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

export const getDataConstanciaTutorAcademico = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const tutorId = parseInt(String(req.params.tutorId));

    const { data: tutor } = await supabase
      .from('t_tutors')
      .select(`
        TUTOR_CI, TITULO, CONDITION, DEDICATION, CATEGORY,
        person_id,
        t_persons!inner(ci, first_name, middle_name, last_name, second_last_name, email, phone)
      `)
      .eq('TUTOR_ID', tutorId)
      .single();

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor no encontrado' });
    }

    // Obtener prácticas del tutor para período y estudiante
    const { data: tutorPractices } = await supabase
      .from('t_professional_practices_tutor')
      .select('PROFESSIONAL_PRACTICE_ID')
      .eq('TUTOR_ID', tutorId);

    const practiceIds = (tutorPractices || []).map((tp: any) => tp.PROFESSIONAL_PRACTICE_ID);
    let totalHours = 480; // carreras cortas
    let activePeriodId: number | null = null;
    let estudianteData: any = null;

    if (practiceIds.length > 0) {
      // Usar la práctica más reciente para obtener período y estudiante
      const { data: latest } = await supabase
        .from('t_professional_practices')
        .select('PERIOD_ID, STUDENTS_ID')
        .in('PROFESSIONAL_PRACTICE_ID', practiceIds)
        .eq('STATUS', 1)
        .order('START_DATE', { ascending: false })
        .limit(1);
      activePeriodId = latest?.[0]?.PERIOD_ID || null;
      const latestPracticeStudentId: number | null = latest?.[0]?.STUDENTS_ID || null;

      // Obtener datos del estudiante asociado a la práctica más reciente
      if (latestPracticeStudentId) {
        const { data: estudiante } = await supabase
          .from('t_students')
          .select(`
            STUDENTS_ID,
            t_persons!fk_students_person(
              ci, first_name, middle_name, last_name, second_last_name
            )
          `)
          .eq('STUDENTS_ID', latestPracticeStudentId)
          .single();
        estudianteData = estudiante;
      }
    }

    let periodoData = null;
    if (activePeriodId) {
      const { data: periodo } = await supabase
        .from('t_internships_period')
        .select('DESCRIPTION, START_DATE, END_DATE')
        .eq('PERIOD_ID', activePeriodId)
        .single();
      periodoData = periodo;
    }

    const persona = tutor.t_persons;

    // Obtener abreviatura del título desde la lista de valores
    let tituloAbrev = tutor.TITULO || '';
    if (tutor.TITULO) {
      const { data: titleList } = await supabase
        .from('t_list')
        .select('LIST_ID')
        .eq('NAME', 'TÍTULO')
        .single();
      if (titleList) {
        const { data: values } = await supabase
          .from('t_value_list')
          .select('NAME, ABBREVIATION')
          .eq('LIST_ID', titleList.LIST_ID)
          .eq('STATUS', 1);
        const match = values?.find(
          (v: any) => v.NAME.toLowerCase() === tutor.TITULO!.toLowerCase()
        );
        if (match?.ABBREVIATION) {
          tituloAbrev = match.ABBREVIATION;
        }
      }
    }

    res.json({
      success: true,
      data: {
        practiceId: 0,
        estudiante: estudianteData ? {
          ci: (estudianteData?.t_persons?.ci ?? estudianteData?.STUDENTS_CI) || '',
          primerNombre: estudianteData?.t_persons?.first_name || '',
          segundoNombre: estudianteData?.t_persons?.middle_name || '',
          primerApellido: estudianteData?.t_persons?.last_name || '',
          segundoApellido: estudianteData?.t_persons?.second_last_name || '',
        } : null,
        tutor: {
          ci: persona?.ci || tutor.TUTOR_CI || '',
          titulo: tutor.TITULO,
          tituloAbrev,
          primerNombre: persona?.first_name || '',
          segundoNombre: persona?.middle_name || '',
          primerApellido: persona?.last_name || '',
          segundoApellido: persona?.second_last_name || '',
          condicion: tutor.CONDITION || '',
          dedicacion: tutor.DEDICATION || '',
          categoria: tutor.CATEGORY || '',
          telefono: persona?.phone || '',
          email: persona?.email || '',
        },
        totalHours,
        periodo: periodoData ? {
          description: periodoData.DESCRIPTION || '',
          startDate: periodoData.START_DATE || '',
          endDate: periodoData.END_DATE || '',
        } : null,
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataConstanciaTutorAcademico error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

export const getDataConstanciaTutorInstitucional = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const tutorId = parseInt(String(req.params.tutorId));

    const { data: tutor } = await supabase
      .from('t_tutors')
      .select(`
        TUTOR_CI, TITULO, CONDITION, DEDICATION, CATEGORY,
        person_id,
        t_persons!inner(ci, first_name, middle_name, last_name, second_last_name, email, phone)
      `)
      .eq('TUTOR_ID', tutorId)
      .single();

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor no encontrado' });
    }

    const persona = tutor.t_persons;

    // Obtener abreviatura del título desde la lista de valores
    let tituloAbrev = tutor.TITULO || '';
    if (tutor.TITULO) {
      const { data: titleList } = await supabase
        .from('t_list')
        .select('LIST_ID')
        .eq('NAME', 'TÍTULO')
        .single();
      if (titleList) {
        const { data: values } = await supabase
          .from('t_value_list')
          .select('NAME, ABBREVIATION')
          .eq('LIST_ID', titleList.LIST_ID)
          .eq('STATUS', 1);
        const match = values?.find(
          (v: any) => v.NAME.toLowerCase() === tutor.TITULO!.toLowerCase()
        );
        if (match?.ABBREVIATION) {
          tituloAbrev = match.ABBREVIATION;
        }
      }
    }

    // Obtener horas desde t_practice_visits (t_tracking no existe)
    const { data: tutorPractices } = await supabase
      .from('t_professional_practices_tutor')
      .select('PROFESSIONAL_PRACTICE_ID')
      .eq('TUTOR_ID', tutorId);

    const practiceIds = (tutorPractices || []).map((tp: any) => tp.PROFESSIONAL_PRACTICE_ID);
    let totalHours = 0;
    let hoursRequired = 480;
    let activePeriodId: number | null = null;
    let estudianteData: any = null;

    if (practiceIds.length > 0) {
      const { data: visits } = await supabase
        .from('t_practice_visits')
        .select('PROFESSIONAL_PRACTICE_ID, HOURS_WORKED')
        .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

      (visits || []).forEach((v: any) => {
        totalHours += Number(v.HOURS_WORKED || 0);
      });

      // Usar la práctica más reciente para obtener período y estudiante
      const { data: latest } = await supabase
        .from('t_professional_practices')
        .select('PERIOD_ID, STUDENTS_ID, INTERNSHIP_TYPE_ID')
        .in('PROFESSIONAL_PRACTICE_ID', practiceIds)
        .eq('STATUS', 1)
        .order('START_DATE', { ascending: false })
        .limit(1);
      activePeriodId = latest?.[0]?.PERIOD_ID || null;
      const latestPracticeStudentId: number | null = latest?.[0]?.STUDENTS_ID || null;

      if (latestPracticeStudentId) {
        const { data: estudiante } = await supabase
          .from('t_students')
          .select(`
            STUDENTS_ID,
            t_persons!fk_students_person(
              ci, first_name, middle_name, last_name, second_last_name
            )
          `)
          .eq('STUDENTS_ID', latestPracticeStudentId)
          .single();
        estudianteData = estudiante;
      }
    }

    let periodoData = null;
    if (activePeriodId) {
      const { data: periodo } = await supabase
        .from('t_internships_period')
        .select('DESCRIPTION, START_DATE, END_DATE')
        .eq('PERIOD_ID', activePeriodId)
        .single();
      periodoData = periodo;
    }

    // Institución asociada al tutor institucional
    let institucionData = null;
    let responsableData = null;
    const { data: ppt } = await supabase
      .from('t_professional_practices_tutor')
      .select('PROFESSIONAL_PRACTICES!inner(PROFESSIONAL_PRACTICE_ID, MANAGER_ID, t_institution(INSTITUTION_NAME))')
      .eq('TUTOR_ID', tutorId)
      .eq('TUTOR_TYPE', 'INSTITUCIONAL')
      .limit(1);

    if (ppt?.[0]?.PROFESSIONAL_PRACTICES?.t_institution) {
      institucionData = ppt[0].PROFESSIONAL_PRACTICES.t_institution;
    }

    // Responsable de la institución (t_institution_manager → t_persons)
    const managerId = ppt?.[0]?.PROFESSIONAL_PRACTICES?.MANAGER_ID;
    if (managerId) {
      const { data: manager } = await supabase
        .from('t_institution_manager')
        .select(`
          MANAGER_ID, TITLE,
          t_persons!inner(first_name, middle_name, last_name, second_last_name)
        `)
        .eq('MANAGER_ID', managerId)
        .maybeSingle();
      if (manager?.t_persons) {
        const p = manager.t_persons;
        responsableData = {
          nombreCompleto: [p.first_name, p.middle_name, p.last_name, p.second_last_name].filter(Boolean).join(' ').toUpperCase(),
          titulo: manager.TITLE || '',
        };
      }
    }

    res.json({
      success: true,
      data: {
        practiceId: 0,
        estudiante: estudianteData ? {
          ci: (estudianteData?.t_persons?.ci ?? estudianteData?.STUDENTS_CI) || '',
          primerNombre: estudianteData?.t_persons?.first_name || '',
          segundoNombre: estudianteData?.t_persons?.middle_name || '',
          primerApellido: estudianteData?.t_persons?.last_name || '',
          segundoApellido: estudianteData?.t_persons?.second_last_name || '',
        } : null,
        tutor: {
          ci: persona?.ci || tutor.TUTOR_CI || '',
          titulo: tutor.TITULO,
          tituloAbrev,
          primerNombre: persona?.first_name || '',
          segundoNombre: persona?.middle_name || '',
          primerApellido: persona?.last_name || '',
          segundoApellido: persona?.second_last_name || '',
          telefono: persona?.phone || '',
          email: persona?.email || '',
        },
        institucion: institucionData ? { nombre: institucionData.INSTITUTION_NAME } : null,
        responsable: responsableData,
        totalHours,
        hoursRequired,
        periodo: periodoData ? {
          description: periodoData.DESCRIPTION || '',
          startDate: periodoData.START_DATE || '',
          endDate: periodoData.END_DATE || '',
        } : null,
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataConstanciaTutorInstitucional error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos' });
  }
};

/**
 * Busca prácticas profesionales por CI o nombre del estudiante.
 * GET /api/institutional-documents/search-practices?q=termino&documentType=aceptacion-tutor
 */
export const searchPractices = async (req: Request, res: Response) => {
  try {
    const conn = dbManager.getConnection();
    const q = String(req.query.q || '').trim();
    const documentType = String(req.query.documentType || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const term = `%${q}%`;

    // Para aceptacion-tutor: buscar en prácticas CON tutor + estudiantes SIN práctica
    if (documentType === 'aceptacion-tutor') {
      return await searchPracticesWithStudents(conn, term, res);
    }

    // Búsqueda original (solo prácticas)
    const { data, error } = await conn
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        STUDENTS_ID,
        STATUS,
        t_students!inner(
          STUDENTS_ID,
          t_persons!fk_students_person(
            ci, first_name, middle_name, last_name, second_last_name
          )
        ),
        t_career!inner(CAREER_NAME),
        t_institution(INSTITUTION_NAME),
        t_internships_period(DESCRIPTION),
        t_internship_type(NAME)
      `)
      .or(`ci.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`, { foreignTable: 't_students.t_persons' })
      .limit(20);

    if (error) {
      console.error('[institutional-documents] searchPractices error:', error);
      const dbError = error?.message?.includes('fetch failed') || error?.message?.includes('ENOTFOUND')
        ? 'Error de conexión con la base de datos. Verifique que Supabase esté accesible.'
        : 'Error al buscar prácticas';
      return res.status(500).json({ success: false, message: dbError });
    }

    const results = (data || []).map((p: any) => {
      const person = p.t_students?.t_persons;
      return {
        practiceId: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: person?.ci ?? '',
        studentName: [person?.first_name, person?.middle_name, person?.last_name, person?.second_last_name]
          .filter(Boolean).join(' '),
        careerName: p.t_career?.CAREER_NAME || '',
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        status: p.STATUS,
        period: p.t_internships_period?.DESCRIPTION || '',
        internshipTypeName: p.t_internship_type?.NAME || '',
        hasPractice: true,
      };
    });

    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('[institutional-documents] searchPractices error:', error);
    const dbError = error?.message?.includes('fetch failed') || error?.message?.includes('ENOTFOUND')
      ? 'Error de conexión con la base de datos. Verifique que Supabase esté accesible.'
      : 'Error al buscar prácticas';
    res.status(500).json({ success: false, message: dbError });
  }
};

/**
 * Busca prácticas y estudiantes para "Carta de Aceptación del Tutor Académico".
 * Incluye: prácticas con tutor académico (hasPractice=true) + estudiantes sin práctica (hasPractice=false).
 */
async function searchPracticesWithStudents(conn: any, term: string, res: Response) {
  // 1. Prácticas activas CON tutor académico
  const { data: pptData } = await conn
    .from('t_professional_practices_tutor')
    .select('PROFESSIONAL_PRACTICE_ID')
    .eq('TUTOR_TYPE', 'ACADEMICO');
  const practiceIdsWithTutor = [...new Set((pptData || []).map((r: any) => Number(r.PROFESSIONAL_PRACTICE_ID)))] as number[];

  let practicesQuery = conn
    .from('t_professional_practices')
    .select(`
      PROFESSIONAL_PRACTICE_ID,
      STUDENTS_ID,
      STATUS,
      t_students!inner(
        STUDENTS_ID,
        t_persons!fk_students_person(
          ci, first_name, middle_name, last_name, second_last_name
        )
      ),
      t_career!inner(CAREER_NAME),
      t_institution(INSTITUTION_NAME),
      t_internships_period(DESCRIPTION),
      t_internship_type(NAME)
    `)
    .or(`ci.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`, { foreignTable: 't_students.t_persons' });

  if (practiceIdsWithTutor.length > 0) {
    practicesQuery = practicesQuery.in('PROFESSIONAL_PRACTICE_ID', practiceIdsWithTutor);
  } else {
    practicesQuery = practicesQuery.eq('PROFESSIONAL_PRACTICE_ID', -1);
  }

  const { data: practicesData, error: practicesError } = await practicesQuery.limit(10);

  if (practicesError) {
    console.error('[institutional-documents] searchPracticesWithStudents error:', practicesError);
    return res.status(500).json({ success: false, message: 'Error al buscar prácticas' });
  }

  const practicesResults = (practicesData || []).map((p: any) => {
    const person = p.t_students?.t_persons;
    return {
      practiceId: p.PROFESSIONAL_PRACTICE_ID,
      studentCi: person?.ci ?? '',
      studentName: [person?.first_name, person?.middle_name, person?.last_name, person?.second_last_name]
        .filter(Boolean).join(' '),
      careerName: p.t_career?.CAREER_NAME || '',
      institutionName: p.t_institution?.INSTITUTION_NAME || '',
      status: p.STATUS,
      period: p.t_internships_period?.DESCRIPTION || '',
      internshipTypeName: p.t_internship_type?.NAME || '',
      hasPractice: true,
    };
  });

  // 2. Estudiantes SIN práctica con tutor académico
  let studentsQuery = conn
    .from('t_students')
    .select(`
      STUDENTS_ID,
      t_persons!fk_students_person(
        ci, first_name, middle_name, last_name, second_last_name
      )
    `)
    .eq('STATUS', 1);

  if (practiceIdsWithTutor.length > 0) {
    const { data: studentsInPractices } = await conn
      .from('t_professional_practices')
      .select('STUDENTS_ID')
      .in('PROFESSIONAL_PRACTICE_ID', practiceIdsWithTutor);
    const studentIdsInPractices = [...new Set((studentsInPractices || []).map((r: any) => Number(r.STUDENTS_ID)))] as number[];
    if (studentIdsInPractices.length > 0) {
      studentsQuery = studentsQuery.not('STUDENTS_ID', 'in', `(${studentIdsInPractices.join(',')})`);
    }
  }

  studentsQuery = studentsQuery.or(`ci.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`, { foreignTable: 't_persons' });

  const { data: studentsData, error: studentsError } = await studentsQuery.limit(10);

  if (studentsError) {
    console.error('[institutional-documents] searchPracticesWithStudents error (students):', studentsError);
    return res.status(500).json({ success: false, message: 'Error al buscar estudiantes' });
  }

  const studentsResults = (studentsData || []).map((s: any) => {
    const person = s.t_persons;
    return {
      practiceId: null,
      studentCi: person?.ci ?? '',
      studentName: [person?.first_name, person?.middle_name, person?.last_name, person?.second_last_name]
        .filter(Boolean).join(' '),
      careerName: '', // t_students no tiene CAREER_ID directo
      institutionName: '',
      status: null,
      period: '',
      hasPractice: false,
    };
  });

  const combined = [...practicesResults, ...studentsResults]
    .sort((a, b) => (b.practiceId || 0) - (a.practiceId || 0))
    .slice(0, 20);

  res.json({ success: true, data: combined });
}

/**
 * Busca tutores por CI o nombre del tutor.
 * GET /api/institutional-documents/search-tutors?q=termino
 */
export const searchTutors = async (req: Request, res: Response) => {
  try {
    const conn = dbManager.getConnection();
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Solo tutores con prácticas activas
    const { data: activeData, error: activeError } = await conn
      .from('t_professional_practices_tutor')
      .select(`
        TUTOR_ID,
        t_professional_practices!inner(PROFESSIONAL_PRACTICE_ID)
      `)
      .eq('ACTIVE', true)
      .eq('t_professional_practices.STATUS', 1);

    if (activeError) {
      console.error('[institutional-documents] searchTutors active filter error:', activeError);
      return res.status(500).json({ success: false, message: 'Error al filtrar tutores activos' });
    }

    const activeTutorIds = [...new Set((activeData || []).map((r: any) => r.TUTOR_ID))] as number[];
    if (activeTutorIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const term = `%${q}%`;
    const { data, error } = await conn
      .from('t_tutors')
      .select(`
        TUTOR_ID,
        t_persons!inner(
          ci, first_name, middle_name, last_name, second_last_name,
          email, phone
        ),
        t_tutor_career(
          t_career(CAREER_NAME)
        )
      `)
      .in('TUTOR_ID', activeTutorIds)
      .or(`t_persons.ci.ilike.${term},t_persons.first_name.ilike.${term},t_persons.last_name.ilike.${term}`)
      .limit(20);

    if (error) {
      console.error('[institutional-documents] searchTutors error:', error);
      const dbError = error?.message?.includes('fetch failed') || error?.message?.includes('ENOTFOUND')
        ? 'Error de conexión con la base de datos. Verifique que Supabase esté accesible.'
        : 'Error al buscar tutores';
      return res.status(500).json({ success: false, message: dbError });
    }

    const results = (data || []).map((t: any) => {
      const person = t.t_persons;
      const careers = (t.t_tutor_career || [])
        .map((tc: any) => tc.t_career?.CAREER_NAME)
        .filter(Boolean)
        .join(', ');
      return {
        tutorId: t.TUTOR_ID,
        fullName: [person.first_name, person.middle_name, person.last_name, person.second_last_name]
          .filter(Boolean).join(' '),
        ci: person.ci,
        email: person.email,
        phone: person.phone || '',
        careers,
      };
    });

    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('[institutional-documents] searchTutors error:', error);
    const dbError = error?.message?.includes('fetch failed') || error?.message?.includes('ENOTFOUND')
      ? 'Error de conexión con la base de datos. Verifique que Supabase esté accesible.'
      : 'Error al buscar tutores';
    res.status(500).json({ success: false, message: dbError });
  }
};

/**
 * Lista prácticas paginadas con búsqueda opcional y filtro por tipo de documento.
 * GET /api/institutional-documents/list-practices?page=0&limit=10&q=termino&documentType=aceptacion-tutor
 */
export const listPractices = async (req: Request, res: Response) => {
  try {
    const conn = dbManager.getConnection();
    const page = parseInt(String(req.query.page || '0'), 10);
    const limit = parseInt(String(req.query.limit || '10'), 10);
    const q = String(req.query.q || '').trim();
    const documentType = String(req.query.documentType || '').trim();
    const term = q.length >= 2 ? `%${q}%` : null;

    const from = page * limit;
    const to = from + limit - 1;

    // Para aceptacion-tutor: incluir estudiantes con Y sin práctica
    if (documentType === 'aceptacion-tutor') {
      return await listPracticesWithStudents(conn, page, limit, term, from, to, res);
    }

    // Resolver IDs elegibles según el tipo de documento (lógica original)
    let eligibleIds: number[] | null = null;

    if (documentType) {
      if (documentType === 'aceptacion-tutor') {
        // Prácticas que tienen al menos un tutor asignado
        const { data: ppt } = await conn
          .from('t_professional_practices_tutor')
          .select('PROFESSIONAL_PRACTICE_ID');
        eligibleIds = [...new Set((ppt || []).map((r: any) => Number(r.PROFESSIONAL_PRACTICE_ID)))] as number[];
      } else if (['evaluacion-tutor-institucional', 'evaluacion-tutor-academico', 'evaluacion-comite'].includes(documentType)) {
        const evalTypeMap: Record<string, string> = {
          'evaluacion-tutor-institucional': 'INSTITUCIONAL',
          'evaluacion-tutor-academico': 'ACADEMICO',
          'evaluacion-comite': 'COMITE',
        };
        const evaluatorType = evalTypeMap[documentType];
        let evalQuery = conn.from('t_evaluation').select('PROFESSIONAL_PRACTICE_ID');
        if (evaluatorType) {
          evalQuery = evalQuery.eq('EVALUATOR_TYPE', evaluatorType);
        }
        const { data: evals } = await evalQuery;
        eligibleIds = [...new Set((evals || []).map((r: any) => Number(r.PROFESSIONAL_PRACTICE_ID)))] as number[];
      }
      // Para otros tipos (solicitud-institucion, carta-postulacion, acta-validacion):
      // se filtran por STATUS = 1 abajo
    }

    let query = conn
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        STUDENTS_ID,
        STATUS,
        t_students!inner(
          STUDENTS_ID,
          t_persons!fk_students_person(
            ci, first_name, middle_name, last_name, second_last_name
          )
        ),
        t_career!inner(CAREER_NAME),
        t_institution(INSTITUTION_NAME),
        t_internships_period(DESCRIPTION),
        t_internship_type(NAME)
      `, { count: 'exact' });

    // Filtrar por STATUS = 1 (activas) para todos los tipos de documento
    query = query.eq('STATUS', 1);

    if (eligibleIds !== null && eligibleIds.length >= 0) {
      if (eligibleIds.length === 0) {
        return res.json({ success: true, data: [], meta: { total: 0, page, limit } });
      }
      query = query.in('PROFESSIONAL_PRACTICE_ID', eligibleIds);
    }

    if (term) {
      query = (query as any).or(`ci.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`, { foreignTable: 't_students.t_persons' });
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('PROFESSIONAL_PRACTICE_ID', { ascending: false });

    if (error) {
      console.error('[institutional-documents] listPractices error:', error);
      const dbError = error?.message?.includes('fetch failed') || error?.message?.includes('ENOTFOUND')
        ? 'Error de conexión con la base de datos. Verifique que Supabase esté accesible.'
        : 'Error al listar prácticas';
      return res.status(500).json({ success: false, message: dbError });
    }

    const results = (data || []).map((p: any) => {
      const person = p.t_students?.t_persons;
      return {
        practiceId: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: person?.ci ?? '',
        studentName: [person?.first_name, person?.middle_name, person?.last_name, person?.second_last_name]
          .filter(Boolean).join(' '),
        careerName: p.t_career?.CAREER_NAME || '',
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        status: p.STATUS,
        period: p.t_internships_period?.DESCRIPTION || '',
        internshipTypeName: p.t_internship_type?.NAME || '',
        hasPractice: true,
      };
    });

    res.json({
      success: true,
      data: results,
      meta: { total: count || 0, page, limit },
    });
  } catch (error: any) {
    console.error('[institutional-documents] listPractices error:', error);
    const dbError = error?.message?.includes('fetch failed') || error?.message?.includes('ENOTFOUND')
      ? 'Error de conexión con la base de datos. Verifique que Supabase esté accesible.'
      : 'Error al listar prácticas';
    res.status(500).json({ success: false, message: dbError });
  }
};

/**
 * Lista prácticas y estudiantes para "Carta de Aceptación del Tutor Académico".
 * Incluye: prácticas con tutor (hasPractice=true) + estudiantes sin práctica activa (hasPractice=false).
 */
async function listPracticesWithStudents(
  conn: any,
  page: number,
  limit: number,
  term: string | null,
  from: number,
  to: number,
  res: Response
) {
  // 1. Prácticas activas CON tutor académico asignado (hasPractice=true)
  const { data: pptData } = await conn
    .from('t_professional_practices_tutor')
    .select('PROFESSIONAL_PRACTICE_ID')
    .eq('TUTOR_TYPE', 'ACADEMICO');
  const practiceIdsWithTutor = [...new Set((pptData || []).map((r: any) => Number(r.PROFESSIONAL_PRACTICE_ID)))] as number[];

  let query = conn
    .from('t_professional_practices')
    .select(`
      PROFESSIONAL_PRACTICE_ID,
      STUDENTS_ID,
      STATUS,
      t_students!inner(
        STUDENTS_ID,
        t_persons!fk_students_person(
          ci, first_name, middle_name, last_name, second_last_name
        )
      ),
      t_career!inner(CAREER_NAME),
      t_institution(INSTITUTION_NAME),
      t_internships_period(DESCRIPTION),
      t_internship_type(NAME)
    `, { count: 'exact' })
    .eq('STATUS', 1);

  if (practiceIdsWithTutor.length > 0) {
    query = query.in('PROFESSIONAL_PRACTICE_ID', practiceIdsWithTutor);
  } else {
    query = query.eq('PROFESSIONAL_PRACTICE_ID', -1); // ninguno
  }

  if (term) {
    query = (query as any).or(`ci.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`, { foreignTable: 't_students.t_persons' });
  }

  const { data: practicesData, error: practicesError, count: practicesCount } = await query
    .range(from, to)
    .order('PROFESSIONAL_PRACTICE_ID', { ascending: false });

  if (practicesError) {
    console.error('[institutional-documents] listPracticesWithStudents error:', practicesError);
    return res.status(500).json({ success: false, message: 'Error al listar prácticas' });
  }

  const practicesResults = (practicesData || []).map((p: any) => {
    const person = p.t_students?.t_persons;
    return {
      practiceId: p.PROFESSIONAL_PRACTICE_ID,
      studentCi: person?.ci ?? '',
      studentName: [person?.first_name, person?.middle_name, person?.last_name, person?.second_last_name]
        .filter(Boolean).join(' '),
      careerName: p.t_career?.CAREER_NAME || '',
      institutionName: p.t_institution?.INSTITUTION_NAME || '',
      status: p.STATUS,
      period: p.t_internships_period?.DESCRIPTION || '',
      internshipTypeName: p.t_internship_type?.NAME || '',
      hasPractice: true,
    };
  });

  // 2. Estudiantes SIN práctica activa (o sin práctica con tutor académico)
  // Buscar estudiantes que NO tengan práctica en practiceIdsWithTutor
  let studentsQuery = conn
    .from('t_students')
    .select(`
      STUDENTS_ID,
      t_persons!fk_students_person(
        ci, first_name, middle_name, last_name, second_last_name
      )
    `, { count: 'exact' })
    .eq('STATUS', 1); // estudiantes activos

  // Excluir los que ya aparecen en prácticas con tutor
  if (practiceIdsWithTutor.length > 0) {
    const { data: studentsInPractices } = await conn
      .from('t_professional_practices')
      .select('STUDENTS_ID')
      .in('PROFESSIONAL_PRACTICE_ID', practiceIdsWithTutor);
    const studentIdsInPractices = [...new Set((studentsInPractices || []).map((r: any) => Number(r.STUDENTS_ID)))] as number[];
    if (studentIdsInPractices.length > 0) {
      studentsQuery = studentsQuery.not('STUDENTS_ID', 'in', `(${studentIdsInPractices.join(',')})`);
    }
  }

  if (term) {
    studentsQuery = studentsQuery.or(`ci.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`, { foreignTable: 't_persons' });
  }

  const { data: studentsData, error: studentsError, count: studentsCount } = await studentsQuery
    .range(from, to)
    .order('STUDENTS_ID', { ascending: false });

  if (studentsError) {
    console.error('[institutional-documents] listPracticesWithStudents error (students):', studentsError);
    return res.status(500).json({ success: false, message: 'Error al listar estudiantes' });
  }

  const studentsResults = (studentsData || []).map((s: any) => {
    const person = s.t_persons;
    return {
      practiceId: null,
      studentCi: person?.ci ?? '',
      studentName: [person?.first_name, person?.middle_name, person?.last_name, person?.second_last_name]
        .filter(Boolean).join(' '),
      careerName: '', // t_students no tiene CAREER_ID directo
      institutionName: '',
      status: null,
      period: '',
      hasPractice: false,
    };
  });

  // Combinar y paginar en memoria (simplificación: union de ambas queries)
  // NOTA: para paginación exacta harían falta UNION en SQL; aquí combinamos resultados
  const combined = [...practicesResults, ...studentsResults]
    .sort((a, b) => (b.practiceId || 0) - (a.practiceId || 0)); // prácticas primero

  const total = (practicesCount || 0) + (studentsCount || 0);
  const paginated = combined.slice(0, limit); // slice simple para la página actual

  res.json({
    success: true,
    data: paginated,
    meta: { total, page, limit },
  });
}

/**
 * Lista tutores paginados con búsqueda opcional.
 * GET /api/institutional-documents/list-tutors?page=0&limit=10&q=termino
 */
export const listTutors = async (req: Request, res: Response) => {
  try {
    const conn = dbManager.getConnection();
    const page = parseInt(String(req.query.page || '0'), 10);
    const limit = parseInt(String(req.query.limit || '10'), 10);
    const q = String(req.query.q || '').trim();
    const term = q.length >= 2 ? `%${q}%` : null;

    const from = page * limit;
    const to = from + limit - 1;

    // Solo tutores con prácticas activas
    const { data: activeData, error: activeError } = await conn
      .from('t_professional_practices_tutor')
      .select(`
        TUTOR_ID,
        t_professional_practices!inner(PROFESSIONAL_PRACTICE_ID)
      `)
      .eq('ACTIVE', true)
      .eq('t_professional_practices.STATUS', 1);

    if (activeError) {
      console.error('[institutional-documents] listTutors active filter error:', activeError);
      return res.status(500).json({ success: false, message: 'Error al filtrar tutores activos' });
    }

    const activeTutorIds = [...new Set((activeData || []).map((r: any) => r.TUTOR_ID))] as number[];
    if (activeTutorIds.length === 0) {
      return res.json({ success: true, data: [], meta: { total: 0, page, limit } });
    }

    let query = conn
      .from('t_tutors')
      .select(`
        TUTOR_ID,
        t_persons!inner(
          ci, first_name, middle_name, last_name, second_last_name,
          email, phone
        ),
        t_tutor_career(
          t_career(CAREER_NAME)
        )
      `, { count: 'exact' })
      .in('TUTOR_ID', activeTutorIds);

    if (term) {
      query = (query as any).or(`t_persons.ci.ilike.${term},t_persons.first_name.ilike.${term},t_persons.last_name.ilike.${term}`);
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('TUTOR_ID', { ascending: false });

    if (error) {
      console.error('[institutional-documents] listTutors error:', error);
      const dbError = error?.message?.includes('fetch failed') || error?.message?.includes('ENOTFOUND')
        ? 'Error de conexión con la base de datos. Verifique que Supabase esté accesible.'
        : 'Error al listar tutores';
      return res.status(500).json({ success: false, message: dbError });
    }

    const results = (data || []).map((t: any) => {
      const person = t.t_persons;
      const careers = (t.t_tutor_career || [])
        .map((tc: any) => tc.t_career?.CAREER_NAME)
        .filter(Boolean)
        .join(', ');
      return {
        tutorId: t.TUTOR_ID,
        fullName: [person.first_name, person.middle_name, person.last_name, person.second_last_name]
          .filter(Boolean).join(' '),
        ci: person.ci,
        email: person.email,
        phone: person.phone || '',
        careers,
      };
    });

    res.json({
      success: true,
      data: results,
      meta: { total: count || 0, page, limit },
    });
  } catch (error: any) {
    console.error('[institutional-documents] listTutors error:', error);
    const dbError = error?.message?.includes('fetch failed') || error?.message?.includes('ENOTFOUND')
      ? 'Error de conexión con la base de datos. Verifique que Supabase esté accesible.'
      : 'Error al listar tutores';
    res.status(500).json({ success: false, message: dbError });
  }
};

/**
 * Obtiene datos consolidados de todas las evaluaciones de una práctica para el reporte unificado.
 * GET /api/institutional-documents/evaluacion-consolidada/:practiceId
 */
export const getDataEvaluacionConsolidada = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const practiceId = parseInt(String(req.params.practiceId));
    const practice = await getPracticeBase(supabase, practiceId);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Práctica no encontrada' });
    }

    const estudiante: any = practice.t_students;
    const carrera: any = practice.t_career;
    const institucion: any = practice.t_institution;
    const periodo: any = practice.t_internships_period;
    const practiceType: any = practice.t_internship_type;

    // Verificar si el estudiante tiene múltiples tipos de práctica
    const { data: allStudentPractices } = await supabase
      .from('t_professional_practices')
      .select('INTERNSHIP_TYPE_ID')
      .eq('STUDENTS_ID', estudiante.STUDENTS_ID)
      .eq('STATUS', 1);
    const uniquePracticeTypeIds = [...new Set((allStudentPractices || []).map((p: any) => p.INTERNSHIP_TYPE_ID))];
    const hasMultiplePracticeTypes = uniquePracticeTypeIds.length > 1;
    const practiceTypeName = practiceType?.NAME || '';

    const tutors = await getPracticeTutors(supabase, practiceId);
    const tutorInst = tutors.find((t: any) => t.tutorType === 'INSTITUCIONAL');
    const tutorAcad = tutors.find((t: any) => t.tutorType === 'ACADEMICO');

    const evaluaciones = await getEvaluations(supabase, practiceId);

    // Always fetch criteria definitions so tables render even without evaluations
    const EVAL_TYPES = ['INSTITUCIONAL', 'ACADEMICO', 'COMITE'];
    const { data: allCriteria } = await supabase
      .from('t_evaluation_criteria')
      .select('ITEM_NUMBER, DESCRIPTION, EVALUATOR_TYPE')
      .in('EVALUATOR_TYPE', EVAL_TYPES)
      .eq('STATUS', 1);

    const criteriaByType: Record<string, { itemNumber: number; description: string; score: null }[]> = {};
    for (const c of allCriteria || []) {
      if (!criteriaByType[c.EVALUATOR_TYPE]) criteriaByType[c.EVALUATOR_TYPE] = [];
      criteriaByType[c.EVALUATOR_TYPE].push({
        itemNumber: c.ITEM_NUMBER,
        description: c.DESCRIPTION,
        score: null,
      });
    }

    const placeholder = (type: string) => ({
      evaluatorType: type,
      totalScore: null,
      observations: '',
      criterios: criteriaByType[type] || [],
    });

    const evalInst = evaluaciones.find((e: any) => e.evaluatorType === 'INSTITUCIONAL') || placeholder('INSTITUCIONAL');
    const evalAcad = evaluaciones.find((e: any) => e.evaluatorType === 'ACADEMICO') || placeholder('ACADEMICO');
    let evaluacionesComite = evaluaciones
      .filter((e: any) => e.evaluatorType === 'COMITE')
      .sort((a: any, b: any) => (a.comiteMemberIndex || 0) - (b.comiteMemberIndex || 0));

    if (evaluacionesComite.length === 0) {
      evaluacionesComite = [{ ...placeholder('COMITE'), evaluationId: null, evaluatorName: '' }];
    }

    let comiteTotalScore = 0;
    const realComite = evaluacionesComite.filter((e: any) => e.totalScore !== null);
    if (realComite.length > 0) {
      comiteTotalScore = realComite.reduce((sum: number, e: any) => sum + e.totalScore, 0) / realComite.length;
    }

    // Coordinadores
    const { data: coordinadores } = await supabase
      .from('t_coordinadores')
      .select(`
        COORDINADOR_ID, TIPO, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
        CI, CARGO, CAREER_ID,
        t_career!left(CAREER_NAME)
      `)
      .eq('STATUS', 1);

    const coordinadorPP = (coordinadores || []).find((c: any) => c.TIPO === 'PP');
    const coordinadorCarrera = (coordinadores || []).find(
      (c: any) => c.TIPO === 'CARRERA' && c.CAREER_ID === practice.CAREER_ID
    );

    const formatCoord = (c: any) => c ? {
      nombreCompleto: getFullName(c),
      ci: c.CI || '',
      cargo: c.CARGO || '',
    } : null;

    const formatPersona = (p: any) => ({
      ci: (p?.t_persons?.ci ?? p?.STUDENTS_CI) || '',
      primerNombre: (p?.t_persons?.first_name ?? p?.NAME) || '',
      segundoNombre: (p?.t_persons?.middle_name ?? p?.SECOND_NAME) || '',
      primerApellido: (p?.t_persons?.last_name ?? p?.SURNAME) || '',
      segundoApellido: (p?.t_persons?.second_last_name ?? p?.SECOND_SURNAME) || '',
    });

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: formatPersona(estudiante),
        carrera: { nombre: carrera.CAREER_NAME },
        practiceTypeName,
        hasMultiplePracticeTypes,
        institucion: institucion ? { nombre: institucion.INSTITUTION_NAME } : null,
        periodo: periodo ? {
          description: periodo.DESCRIPTION || '',
          startDate: periodo.START_DATE || '',
          endDate: periodo.END_DATE || '',
        } : null,
        tutorInstitucional: tutorInst ? {
          ci: tutorInst.ci,
          titulo: tutorInst.titulo,
          tituloAbrev: tutorInst.tituloAbrev || '',
          primerNombre: tutorInst.primerNombre,
          segundoNombre: tutorInst.segundoNombre,
          primerApellido: tutorInst.primerApellido,
          segundoApellido: tutorInst.segundoApellido,
        } : null,
        department: practice.DEPARTMENT || null,
        tutorAcademico: tutorAcad ? {
          ci: tutorAcad.ci,
          titulo: tutorAcad.titulo,
          tituloAbrev: tutorAcad.tituloAbrev || '',
          primerNombre: tutorAcad.primerNombre,
          segundoNombre: tutorAcad.segundoNombre,
          primerApellido: tutorAcad.primerApellido,
          segundoApellido: tutorAcad.segundoApellido,
        } : null,
        coordinadorPP: formatCoord(coordinadorPP),
        coordinadorCarrera: formatCoord(coordinadorCarrera),
        evaluacionTutorInstitucional: evalInst || null,
        evaluacionTutorAcademico: evalAcad || null,
        evaluacionesComite,
        comiteTotalScore,
        evaluacionFinal: {
          weights: {
            institucional: evaluationConfig.weights.INSTITUCIONAL,
            academico: evaluationConfig.weights.ACADEMICO,
            comite: evaluationConfig.weights.COMITE,
          },
          parciales: {
            institucional: evalInst?.totalScore || null,
            academico: evalAcad?.totalScore || null,
            comite: comiteTotalScore || null,
          },
          notaFinal: practice.GRADE || 0,
        },
        practica: {
          startDate: practice.START_DATE || '',
          endDate: practice.END_DATE || '',
          grade: practice.GRADE || 0,
        },
      },
    });
  } catch (error) {
    console.error('[institutional-documents] getDataEvaluacionConsolidada error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener datos consolidados' });
  }
};
