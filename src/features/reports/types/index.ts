export interface EstudianteBasico {
  ci: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  email: string;
  direccion: string;
  genero: string;
  tipoEstudiante: string;
  empleo: string;
}

export interface TutorBasico {
  ci: string;
  titulo: string | null;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  condicion: string;
  dedicacion: string;
  categoria: string;
  telefono: string;
  email: string;
  horarioAtencion: string | null;
}

export interface CoordinadorData {
  coordinadorId: number;
  tipo: 'PP' | 'CARRERA';
  carreraId: number | null;
  nombreCompleto: string;
  ci: string;
  cargo: string;
  carreraNombre: string | null;
}

export interface PracticaBase {
  practiceId: number;
  startDate: string;
  endDate: string;
  grade: number;
  regime: string;
  semester: string;
  section: string;
  department: string | null;
  internshipType: string;
}

export interface PeriodoData {
  description: string;
  startDate: string;
  endDate: string;
}

export interface InstitucionData {
  nombre: string;
  tipo: string;
  direccion: string;
  region: string;
  nucleo: string;
  extension: string;
  rif: string;
  contacto: string;
}

export interface CarreraData {
  nombre: string;
  abreviatura: string;
}

export interface CriterioEvaluacion {
  itemNumber: number;
  description: string;
  score: number;
}

export interface EvaluacionData {
  evaluationId: number;
  evaluatorType: string;
  evaluatorName: string;
  evaluatorCi: string;
  totalScore: number;
  observations: string;
  evaluationDate: string;
  criterios: CriterioEvaluacion[];
}

export interface TextoDocumento {
  templateId: number;
  reportType: string;
  section: string;
  contentTemplate: string;
}

export interface DocumentoPDFResponse {
  success: boolean;
  data: {
    practiceId: number;
    estudiante: EstudianteBasico;
    carrera: CarreraData;
    institucion: InstitucionData | null;
    periodo: PeriodoData | null;
    practica: PracticaBase | null;
    tutores: Record<string, TutorBasico>;
    evaluaciones: EvaluacionData[];
    coordinadores: CoordinadorData[];
    textos: Record<string, string>;
  };
}

export interface RelacionEmpresasRow {
  region: string;
  nucleo: string;
  extension: string;
  empresa: string;
  rif: string;
  publica: string;
  privada: string;
  carrera: string;
  cantidadEstudiantes: number;
}

export interface RelacionInstitucionesSolicitanRow {
  region: string;
  nucleo: string;
  extension: string;
  empresa: string;
  rif: string;
  responsable: string;
  numeroContacto: string;
  tipoEmpresa: string;
  carreras: string;
  cantidadEstudiantes: number;
}

export interface DistribucionTutoresRow {
  nro: number;
  carrera: string;
  estudiante: string;
  tutorAcademico: {
    titulo: string;
    nombre: string;
    contacto: string;
    email: string;
  };
  tutorMetodologico: {
    titulo: string;
    nombre: string;
    contacto: string;
    horario: string;
  };
  evaluador: {
    titulo: string;
    nombre: string;
    contacto: string;
  };
}

export interface RelacionIndividualDocenteRow {
  nro: number;
  region: string;
  nucleo: string;
  extension: string;
  carrera: string;
  estudiante: {
    nombre: string;
    apellido: string;
    ci: string;
    sexo: string;
    tipo: string;
    telefono: string;
  };
  institucion: {
    nombre: string;
    tipo: string;
  };
  tutorInstitucional: {
    nombre: string;
    apellido: string;
    ci: string;
    cargo: string;
  };
  direccion: string;
  observaciones: string;
}

export interface DistribucionTutoresV2Row extends DistribucionTutoresRow {
  horarioMetodologicoDetallado: string;
}
