import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { supabase } from '../lib/supabase.js';

function getFullName(row: any): string {
  const parts = [row.NAME || '', row.SECOND_NAME || '', row.SURNAME || '', row.SECOND_SURNAME || ''];
  return parts.filter(Boolean).join(' ');
}

async function getPracticeBase(supabase: any, practiceId: number) {
  const { data, error } = await supabase
    .from('t_professional_practices')
    .select(`
      PROFESSIONAL_PRACTICE_ID, START_DATE, END_DATE, GRADE, REGIME,
      SEMESTER, SECTION, DEPARTMENT,
      STUDENTS_ID, CAREER_ID, INSTITUTION_ID, PERIOD_ID, INTERNSHIP_TYPE_ID,
      t_students!inner(STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
        CONTACT_PHONE, EMAIL, ADDRESS, GENDER, STUDENT_TYPE, EMPLOYMENT),
      t_career!inner(CAREER_NAME, CAREER_ABBREVIATION),
      t_institution(INSTITUTION_NAME, INSTITUTION_TYPE, INSTITUTION_ADDRESS,
        REGION, NUCLEUS, EXTENSION, RIF, INSTITUTION_CONTACT),
      t_internships_period(DESCRIPTION, START_DATE as period_start, END_DATE as period_end),
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
      t_tutors!inner(TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME,
        TITULO, CONDITION, DEDICATION, CATEGORY, CONTACT_PHONE, EMAIL,
        ATTENTION_SCHEDULE)
    `)
    .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

  if (!data) return [];
  return data.map((item: any) => ({
    tutorType: item.TUTOR_TYPE,
    ...item.t_tutors,
  }));
}

async function getEvaluations(supabase: any, practiceId: number) {
  const { data } = await supabase
    .from('t_evaluation')
    .select(`
      EVALUATION_ID, EVALUATOR_TYPE, EVALUATOR_NAME, EVALUATOR_CI,
      TOTAL_SCORE, OBSERVATIONS, EVALUATION_DATE,
      t_evaluation_detail(ITEM_NUMBER, SCORE),
      t_evaluation_criteria(DESCRIPTION)
    `)
    .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

  if (!data) return [];
  return data.map((e: any) => ({
    evaluationId: e.EVALUATION_ID,
    evaluatorType: e.EVALUATOR_TYPE,
    evaluatorName: e.EVALUATOR_NAME,
    evaluatorCi: e.EVALUATOR_CI || '',
    totalScore: e.TOTAL_SCORE || 0,
    observations: e.OBSERVATIONS || '',
    evaluationDate: e.EVALUATION_DATE,
    criterios: (e.t_evaluation_detail || []).map((d: any) => ({
      itemNumber: d.ITEM_NUMBER,
      description: '',
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
    const tutorAcademico = tutors.find((t: any) => t.tutorType === 'ACADEMICO');
    const estudiante: any = practice.t_students;
    const carrera: any = practice.t_career;

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: {
          ci: estudiante.STUDENTS_CI,
          primerNombre: estudiante.NAME,
          segundoNombre: estudiante.SECOND_NAME || '',
          primerApellido: estudiante.SURNAME,
          segundoApellido: estudiante.SECOND_SURNAME || '',
          telefono: estudiante.CONTACT_PHONE || '',
          email: estudiante.EMAIL || '',
          genero: estudiante.GENDER || '',
          tipoEstudiante: estudiante.STUDENT_TYPE || '',
          empleo: estudiante.EMPLOYMENT || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        tutor: tutorAcademico ? {
          ci: tutorAcademico.TUTOR_CI || '',
          titulo: tutorAcademico.TITULO,
          primerNombre: tutorAcademico.NAME || '',
          segundoNombre: tutorAcademico.SECOND_NAME || '',
          primerApellido: tutorAcademico.SURNAME || '',
          segundoApellido: tutorAcademico.SECOND_SURNAME || '',
          condicion: tutorAcademico.CONDITION || '',
          dedicacion: tutorAcademico.DEDICATION || '',
          categoria: tutorAcademico.CATEGORY || '',
          telefono: tutorAcademico.CONTACT_PHONE || '',
          email: tutorAcademico.EMAIL || '',
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
          ci: estudiante.STUDENTS_CI,
          primerNombre: estudiante.NAME,
          segundoNombre: estudiante.SECOND_NAME || '',
          primerApellido: estudiante.SURNAME,
          segundoApellido: estudiante.SECOND_SURNAME || '',
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
          startDate: periodo.period_start || '',
          endDate: periodo.period_end || '',
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
          ci: estudiante.STUDENTS_CI,
          primerNombre: estudiante.NAME,
          segundoNombre: estudiante.SECOND_NAME || '',
          primerApellido: estudiante.SURNAME,
          segundoApellido: estudiante.SECOND_SURNAME || '',
          telefono: estudiante.CONTACT_PHONE || '',
          email: estudiante.EMAIL || '',
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
          ci: tutorInstitucional.TUTOR_CI || '',
          titulo: tutorInstitucional.TITULO,
          primerNombre: tutorInstitucional.NAME || '',
          segundoNombre: tutorInstitucional.SECOND_NAME || '',
          primerApellido: tutorInstitucional.SURNAME || '',
          segundoApellido: tutorInstitucional.SECOND_SURNAME || '',
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
          ci: estudiante.STUDENTS_CI,
          primerNombre: estudiante.NAME,
          segundoNombre: estudiante.SECOND_NAME || '',
          primerApellido: estudiante.SURNAME,
          segundoApellido: estudiante.SECOND_SURNAME || '',
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

    res.json({
      success: true,
      data: {
        practiceId,
        estudiante: {
          ci: estudiante.STUDENTS_CI,
          primerNombre: estudiante.NAME,
          segundoNombre: estudiante.SECOND_NAME || '',
          primerApellido: estudiante.SURNAME,
          segundoApellido: estudiante.SECOND_SURNAME || '',
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
          ci: estudiante.STUDENTS_CI,
          primerNombre: estudiante.NAME,
          segundoNombre: estudiante.SECOND_NAME || '',
          primerApellido: estudiante.SURNAME,
          segundoApellido: estudiante.SECOND_SURNAME || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        institucion: institucion ? { nombre: institucion.INSTITUTION_NAME } : null,
        department: practice.DEPARTMENT || null,
        tutorInstitucional: tutorInst ? {
          ci: tutorInst.TUTOR_CI || '',
          titulo: tutorInst.TITULO,
          primerNombre: tutorInst.NAME || '',
          segundoNombre: tutorInst.SECOND_NAME || '',
          primerApellido: tutorInst.SURNAME || '',
          segundoApellido: tutorInst.SECOND_SURNAME || '',
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
          ci: estudiante.STUDENTS_CI,
          primerNombre: estudiante.NAME,
          segundoNombre: estudiante.SECOND_NAME || '',
          primerApellido: estudiante.SURNAME,
          segundoApellido: estudiante.SECOND_SURNAME || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        tutorAcademico: tutorAcad ? {
          ci: tutorAcad.TUTOR_CI || '',
          titulo: tutorAcad.TITULO,
          primerNombre: tutorAcad.NAME || '',
          segundoNombre: tutorAcad.SECOND_NAME || '',
          primerApellido: tutorAcad.SURNAME || '',
          segundoApellido: tutorAcad.SECOND_SURNAME || '',
        } : null,
        periodo: periodo ? {
          description: periodo.DESCRIPTION || '',
          startDate: periodo.period_start || '',
          endDate: periodo.period_end || '',
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
          ci: estudiante.STUDENTS_CI,
          primerNombre: estudiante.NAME,
          segundoNombre: estudiante.SECOND_NAME || '',
          primerApellido: estudiante.SURNAME,
          segundoApellido: estudiante.SECOND_SURNAME || '',
        },
        carrera: { nombre: carrera.CAREER_NAME, abreviatura: carrera.CAREER_ABBREVIATION },
        tutorAcademico: tutorAcad ? {
          ci: tutorAcad.TUTOR_CI || '',
          titulo: tutorAcad.TITULO,
          primerNombre: tutorAcad.NAME || '',
          segundoNombre: tutorAcad.SECOND_NAME || '',
          primerApellido: tutorAcad.SURNAME || '',
          segundoApellido: tutorAcad.SECOND_SURNAME || '',
        } : null,
        periodo: periodo ? {
          description: periodo.DESCRIPTION || '',
          startDate: periodo.period_start || '',
          endDate: periodo.period_end || '',
        } : null,
        coordinadorPP: formatCoord(coordinadorPP),
        coordinadorCarrera: formatCoord(coordinadorCarrera),
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
      .select('TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, TITULO, CONDITION, DEDICATION, CATEGORY, CONTACT_PHONE, EMAIL')
      .eq('TUTOR_ID', tutorId)
      .single();

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor no encontrado' });
    }

    const { data: tracking } = await supabase
      .from('t_tracking')
      .select('TOTAL_HOURS, PERIOD_ID')
      .eq('TUTOR_ID', tutorId)
      .eq('STATUS', 1)
      .order('TRACKING_ID', { ascending: false })
      .limit(1);

    const totalHours = tracking?.[0]?.TOTAL_HOURS || 0;

    let periodoData = null;
    if (tracking?.[0]?.PERIOD_ID) {
      const { data: periodo } = await supabase
        .from('t_internships_period')
        .select('DESCRIPTION, START_DATE, END_DATE')
        .eq('PERIOD_ID', tracking[0].PERIOD_ID)
        .single();
      periodoData = periodo;
    }

    res.json({
      success: true,
      data: {
        practiceId: 0,
        tutor: {
          ci: tutor.TUTOR_CI || '',
          titulo: tutor.TITULO,
          primerNombre: tutor.NAME || '',
          segundoNombre: tutor.SECOND_NAME || '',
          primerApellido: tutor.SURNAME || '',
          segundoApellido: tutor.SECOND_SURNAME || '',
          condicion: tutor.CONDITION || '',
          dedicacion: tutor.DEDICATION || '',
          categoria: tutor.CATEGORY || '',
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
      .select('TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, TITULO')
      .eq('TUTOR_ID', tutorId)
      .single();

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor no encontrado' });
    }

    const { data: tracking } = await supabase
      .from('t_tracking')
      .select('TOTAL_HOURS, PERIOD_ID')
      .eq('TUTOR_ID', tutorId)
      .eq('STATUS', 1)
      .order('TRACKING_ID', { ascending: false })
      .limit(1);

    const totalHours = tracking?.[0]?.TOTAL_HOURS || 0;
    let institucionData = null;
    let periodoData = null;

    if (tracking?.[0]?.PERIOD_ID) {
      const { data: periodo } = await supabase
        .from('t_internships_period')
        .select('DESCRIPTION, START_DATE, END_DATE')
        .eq('PERIOD_ID', tracking[0].PERIOD_ID)
        .single();
      periodoData = periodo;
    }

    const { data: ppt } = await supabase
      .from('t_professional_practices_tutor')
      .select('PROFESSIONAL_PRACTICES!inner(PROFESSIONAL_PRACTICE_ID, t_institution(INSTITUTION_NAME))')
      .eq('TUTOR_ID', tutorId)
      .eq('TUTOR_TYPE', 'INSTITUCIONAL')
      .limit(1);

    if (ppt?.[0]?.PROFESSIONAL_PRACTICES?.t_institution) {
      institucionData = ppt[0].PROFESSIONAL_PRACTICES.t_institution;
    }

    res.json({
      success: true,
      data: {
        practiceId: 0,
        tutor: {
          ci: tutor.TUTOR_CI || '',
          titulo: tutor.TITULO,
          primerNombre: tutor.NAME || '',
          segundoNombre: tutor.SECOND_NAME || '',
          primerApellido: tutor.SURNAME || '',
          segundoApellido: tutor.SECOND_SURNAME || '',
        },
        institucion: institucionData ? { nombre: institucionData.INSTITUTION_NAME } : null,
        totalHours,
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
 * GET /api/institutional-documents/search-practices?q=termino
 */
export const searchPractices = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const term = `%${q}%`;
    const { data, error } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        STUDENTS_ID,
        STATUS,
        t_students!inner(STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME),
        t_career!inner(CAREER_NAME),
        t_institution(INSTITUTION_NAME),
        t_internships_period(DESCRIPTION)
      `)
      .or(`t_students.STUDENTS_CI.ilike.${term},t_students.NAME.ilike.${term},t_students.SURNAME.ilike.${term}`)
      .limit(20);

    if (error) {
      console.error('[institutional-documents] searchPractices error:', error);
      return res.status(500).json({ success: false, message: 'Error al buscar prácticas' });
    }

    const results = (data || []).map((p: any) => {
      const student = p.t_students;
      return {
        practiceId: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: student.STUDENTS_CI,
        studentName: [student.NAME, student.SECOND_NAME, student.SURNAME, student.SECOND_SURNAME]
          .filter(Boolean).join(' '),
        careerName: p.t_career?.CAREER_NAME || '',
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        status: p.STATUS,
        period: p.t_internships_period?.DESCRIPTION || '',
      };
    });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('[institutional-documents] searchPractices error:', error);
    res.status(500).json({ success: false, message: 'Error al buscar prácticas' });
  }
};

/**
 * Busca tutores por CI o nombre del tutor.
 * GET /api/institutional-documents/search-tutors?q=termino
 */
export const searchTutors = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const term = `%${q}%`;
    const { data, error } = await supabase
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
      .or(`t_persons.ci.ilike.${term},t_persons.first_name.ilike.${term},t_persons.last_name.ilike.${term}`)
      .limit(20);

    if (error) {
      console.error('[institutional-documents] searchTutors error:', error);
      return res.status(500).json({ success: false, message: 'Error al buscar tutores' });
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
  } catch (error) {
    console.error('[institutional-documents] searchTutors error:', error);
    res.status(500).json({ success: false, message: 'Error al buscar tutores' });
  }
};

/**
 * Lista prácticas paginadas con búsqueda opcional.
 * GET /api/institutional-documents/list-practices?page=0&limit=10&q=termino
 */
export const listPractices = async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page || '0'), 10);
    const limit = parseInt(String(req.query.limit || '10'), 10);
    const q = String(req.query.q || '').trim();
    const term = q.length >= 2 ? `%${q}%` : null;

    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        STUDENTS_ID,
        STATUS,
        t_students!inner(STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME),
        t_career!inner(CAREER_NAME),
        t_institution(INSTITUTION_NAME),
        t_internships_period(DESCRIPTION)
      `, { count: 'exact' });

    if (term) {
      query = (query as any).or(`t_students.STUDENTS_CI.ilike.${term},t_students.NAME.ilike.${term},t_students.SURNAME.ilike.${term}`);
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('PROFESSIONAL_PRACTICE_ID', { ascending: false });

    if (error) {
      console.error('[institutional-documents] listPractices error:', error);
      return res.status(500).json({ success: false, message: 'Error al listar prácticas' });
    }

    const results = (data || []).map((p: any) => {
      const student = p.t_students;
      return {
        practiceId: p.PROFESSIONAL_PRACTICE_ID,
        studentCi: student.STUDENTS_CI,
        studentName: [student.NAME, student.SECOND_NAME, student.SURNAME, student.SECOND_SURNAME]
          .filter(Boolean).join(' '),
        careerName: p.t_career?.CAREER_NAME || '',
        institutionName: p.t_institution?.INSTITUTION_NAME || '',
        status: p.STATUS,
        period: p.t_internships_period?.DESCRIPTION || '',
      };
    });

    res.json({
      success: true,
      data: results,
      meta: { total: count || 0, page, limit },
    });
  } catch (error) {
    console.error('[institutional-documents] listPractices error:', error);
    res.status(500).json({ success: false, message: 'Error al listar prácticas' });
  }
};

/**
 * Lista tutores paginados con búsqueda opcional.
 * GET /api/institutional-documents/list-tutors?page=0&limit=10&q=termino
 */
export const listTutors = async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page || '0'), 10);
    const limit = parseInt(String(req.query.limit || '10'), 10);
    const q = String(req.query.q || '').trim();
    const term = q.length >= 2 ? `%${q}%` : null;

    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
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
      `, { count: 'exact' });

    if (term) {
      query = (query as any).or(`t_persons.ci.ilike.${term},t_persons.first_name.ilike.${term},t_persons.last_name.ilike.${term}`);
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('TUTOR_ID', { ascending: false });

    if (error) {
      console.error('[institutional-documents] listTutors error:', error);
      return res.status(500).json({ success: false, message: 'Error al listar tutores' });
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
  } catch (error) {
    console.error('[institutional-documents] listTutors error:', error);
    res.status(500).json({ success: false, message: 'Error al listar tutores' });
  }
};
