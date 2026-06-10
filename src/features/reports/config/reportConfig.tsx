import { ReactElement } from 'react';
import { DocumentProps } from '@react-pdf/renderer';
import reportsService, { TutorAcademicReportRow } from '../services/reportsService';
import { getStudents } from '../../students/services/studentsService';
import { getInstitutions } from '../../institutions/services/institutionsService';
import { getEnrollments } from '../../enrollment/services/enrollmentService';
import { unwrapData } from '../../../api/crudServiceFactory';

import { StudentPDF } from '../../../components/ui/pdf/templates/StudentPDF';
import { TutorPDF } from '../../../components/ui/pdf/templates/TutorPDF';
import { InstitutionPDF } from '../../../components/ui/pdf/templates/InstitutionPDF';
import { EnrollmentPDF } from '../../../components/ui/pdf/templates/EnrollmentPDF';
import { CulminatedStudentsPDF } from '../../../components/ui/pdf/templates/CulminatedStudentsPDF';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportType =
  | "students"
  | "enrollments"
  | "institutions"
  | "tutores-academicos"
  | "culminated-students"
  | "resumen-pasantias"
  | "relacion-empresas"
  | "distribucion-tutores"
  | "distribucion-tutores-v2"
  | "relacion-individual-docente"
  | "";

export interface ReportConfigEntry {
  title: string;
  subtitle: string;
  type: 'pdf' | 'excel';
  loadData: (periodId?: number, careerId?: number, page?: number, limit?: number, careerIds?: number[]) => Promise<{ data: any[]; meta?: any }>;
  pdfTemplate?: (data: unknown[]) => ReactElement<DocumentProps>;
  columns: { header: string; accessor: string | ((item: any) => React.ReactNode); className?: string }[];
}

// ---------------------------------------------------------------------------
// Section definition for the card UI
// ---------------------------------------------------------------------------

export interface SectionReport {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  type: 'pdf' | 'excel';
}

export interface SectionGroup {
  title: string;
  description: string;
  reports: SectionReport[];
}

export const DOCUMENT_SECTIONS: SectionGroup[] = [
  {
    title: "Documentos Oficiales",
    description: "Documentos PDF institucionales para estudiantes y tutores",
    reports: [
      { id: "aceptacion-tutor", title: "Carta de Aceptación", subtitle: "Aceptación Del Tutor Académico", icon: "fileText", type: "pdf" },
      { id: "solicitud-institucion", title: "Solicitud de Institución", subtitle: "Asignación De Institución Para PP", icon: "fileText", type: "pdf" },
      { id: "carta-postulacion", title: "Carta de Postulación", subtitle: "Postulación Del Estudiante", icon: "fileText", type: "pdf" },
      { id: "acta-validacion", title: "Acta de Validación", subtitle: "Validación De Prácticas Profesionales", icon: "fileText", type: "pdf" },
      { id: "evaluacion-final", title: "Evaluación Final", subtitle: "Evaluación Final De Prácticas", icon: "fileText", type: "pdf" },
      { id: "evaluacion-tutor-institucional", title: "Eval. Tutor Institucional", subtitle: "Evaluación Del Tutor De La Institución", icon: "fileText", type: "pdf" },
      { id: "evaluacion-tutor-academico", title: "Eval. Tutor Académico", subtitle: "Evaluación Del Tutor Académico", icon: "fileText", type: "pdf" },
      { id: "evaluacion-comite", title: "Eval. Comité Evaluador", subtitle: "Evaluación Del Comité Evaluador", icon: "fileText", type: "pdf" },
      { id: "constancia-tutor-academico", title: "Const. Tutor Académico", subtitle: "Constancia De Tutor Académico", icon: "fileText", type: "pdf" },
      { id: "constancia-tutor-institucional", title: "Const. Tutor Institucional", subtitle: "Constancia De Tutor Institucional", icon: "fileText", type: "pdf" },
    ],
  },
  {
    title: "Prospectos",
    description: "Listas editables de estudiantes elegibles para pasantías",
    reports: [
      { id: "prospectos", title: "Reporte de Prospectos", subtitle: "Crear Y Gestionar Listas De Prospectos Por Período", icon: "users", type: "pdf" },
    ],
  },
  {
    title: "Reportes Generales",
    description: "Reportes exportables a Excel con datos agregados",
    reports: [
      { id: "tutores-academicos", title: "Relación de Tutores Acad.", subtitle: "ANEXO 4 - Tutores Y Estudiantes Atendidos", icon: "table", type: "excel" },
      { id: "resumen-pasantias", title: "Resumen de Pasantías", subtitle: "Resumen General De Prácticas Profesionales", icon: "table", type: "excel" },
      { id: "relacion-empresas", title: "Relación de Empresas", subtitle: "Instituciones Que Demandan Pasantes", icon: "spreadsheet", type: "excel" },
      { id: "distribucion-tutores", title: "Distribución de Tutores", subtitle: "Asignación De Tutores Por Estudiante", icon: "spreadsheet", type: "excel" },
      { id: "distribucion-tutores-v2", title: "Dist. Tutores (Detallada)", subtitle: "Distribución Con Horario Detallado", icon: "spreadsheet", type: "excel" },
      { id: "relacion-individual-docente", title: "Relación Individual Doc.", subtitle: "Reporte Individual Por Docente", icon: "spreadsheet", type: "excel" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Report config entries
// ---------------------------------------------------------------------------

export const reportConfig: Record<Exclude<ReportType, "">, ReportConfigEntry> = {
  "students": {
    title: "Reporte de Estudiantes",
    subtitle: "Listado General De Estudiantes Registrados",
    type: "pdf",
    loadData: async () => {
      const response = await getStudents();
      return { data: unwrapData(response.data).filter((s: any) => s.status === true) };
    },
    pdfTemplate: (data) => <StudentPDF data={data as any[]} />,
    columns: [
      { header: "Cédula", accessor: (s: any) => `${s.identificationPrefix}-${s.identificationNumber}` },
      { header: "Nombre Completo", accessor: (s: any) => `${s.firstName} ${s.middleName || ''} ${s.lastName} ${s.secondLastName || ''}`.replace(/\s+/g, ' ').trim() },
      { header: "Sexo", accessor: "sex" },
      { header: "Teléfono", accessor: "phone" },
      { header: "Correo Electrónico", accessor: "email" },
      { header: "Fecha de Registro", accessor: (s: any) => s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString('es-VE') : '-' },
    ],
  },
  "tutores-academicos": {
    title: "ANEXO 4 - Relación de Tutores Académicos",
    subtitle: "Reporte De Tutores Académicos Y Estudiantes Atendidos",
    type: "excel",
    loadData: async (periodId, careerId, page, limit, careerIds) => {
      const response = await reportsService.getTutorsAcademicReport(periodId, careerId, page, limit, careerIds);
      return { data: response.data || [], meta: response.meta };
    },
    pdfTemplate: (data) => <TutorPDF data={data as any[]} />,
    columns: [
      { header: "N°", accessor: "nro", className: "w-12 text-center" },
      { header: "Región", accessor: "region" },
      { header: "Núcleo", accessor: "nucleo" },
      { header: "Extensión", accessor: "extension" },
      { header: "Carrera", accessor: "carrera" },
      { header: "Nombre", accessor: "nombreTutor" },
      { header: "Apellido", accessor: "apellidoTutor" },
      { header: "Cédula", accessor: "cedula" },
      { header: "Condición", accessor: "condicion" },
      { header: "Dedicación", accessor: "dedicacion" },
      { header: "Categoría", accessor: "categoria" },
      { header: "Teléfono", accessor: "telefono" },
      { header: "Correo Electrónico", accessor: "correo" },
      { header: "Estudiantes", accessor: (row: TutorAcademicReportRow) => row.cantidadEstudiantes, className: "text-center font-bold" },
    ],
  },
  "resumen-pasantias": {
    title: "Resumen de Pasantías",
    subtitle: "Reporte Resumen General De Las Prácticas Profesionales",
    type: "excel",
    loadData: async (periodId, careerId, page, limit, careerIds) => {
      const response = await reportsService.getResumenPasantiasReport(periodId, careerId, page, limit, careerIds);
      return { data: response?.data || [], meta: response?.meta };
    },
    pdfTemplate: () => <></>,
    columns: [
      { header: "N°", accessor: "nro" },
      { header: "Región", accessor: "region" },
      { header: "Núcleo", accessor: "nucleo" },
      { header: "Carrera", accessor: "carrera" },
      { header: "Estudiantes", accessor: "cantidadEstudiantes" },
      { header: "Tutores Acad.", accessor: "cantidadTutoresAcad" },
      { header: "Empresa", accessor: "empresa" },
      { header: "Tipo", accessor: "tipoEmpresa" },
    ],
  },
  "institutions": {
    title: "Reporte De Instituciones",
    subtitle: "Listado De Empresas o Instituciones Registradas",
    type: "pdf",
    loadData: async () => {
      const data = await getInstitutions();
      return { data: unwrapData(data).filter((i: any) => i.status === true) };
    },
    pdfTemplate: (data) => <InstitutionPDF data={data as any[]} />,
    columns: [
      { header: "RIF", accessor: "rif" },
      { header: "Nombre", accessor: "name" },
      { header: "Tipo", accessor: "institutionType" },
    ],
  },
  "enrollments": {
    title: "Reporte de Inscripciones",
    subtitle: "Listado De Inscripciones Activas",
    type: "pdf",
    loadData: async () => {
      const data = await getEnrollments();
      return { data: data.filter((e: any) => e.status === true) };
    },
    pdfTemplate: (data) => <EnrollmentPDF data={data as any[]} />,
    columns: [
      { header: "Estudiante", accessor: "studentName" },
      { header: "Carrera", accessor: "careerName" },
      { header: "Período", accessor: "period" },
    ],
  },
  "culminated-students": {
    title: "Estudiantes Culminados",
    subtitle: "Estudiantes Que Han Completado Sus Prácticas Profesionales",
    type: "pdf",
    loadData: async (_periodId, _careerId, page, limit) => {
      const response = await reportsService.getCulminatedStudents({ page, limit });
      return { data: response.data || [], meta: response.meta };
    },
    pdfTemplate: (data) => <CulminatedStudentsPDF data={data as any[]} />,
    columns: [
      { header: "Cédula", accessor: "studentCi" },
      { header: "Estudiante", accessor: "studentName" },
      { header: "Carrera", accessor: "careerName" },
      { header: "Institución", accessor: "institutionName" },
      { header: "Tipo", accessor: "practiceType" },
      { header: "Tutor", accessor: "tutorName" },
      { header: "Período", accessor: "period" },
      { header: "Horas", accessor: "totalHours" },
      { header: "Nota", accessor: "grade" },
    ],
  },
  "relacion-empresas": {
    title: "Relación de Empresas",
    subtitle: "Instituciones Que Demandan Asignación De Pasantes",
    type: "excel",
    loadData: async (periodId, careerId, page, limit, careerIds) => {
      const response = await reportsService.getRelacionEmpresas(periodId, careerId, page, limit, careerIds);
      return { data: response?.data || [], meta: response?.meta };
    },
    columns: [
      { header: "Región", accessor: "region" },
      { header: "Núcleo", accessor: "nucleo" },
      { header: "Extensión", accessor: "extension" },
      { header: "Empresa", accessor: "empresa" },
      { header: "RIF", accessor: "rif" },
      { header: "Tipo", accessor: "tipo" },
      { header: "Carrera", accessor: "carrera" },
      { header: "Estudiantes", accessor: "cantidadEstudiantes", className: "text-center font-bold" },
    ],
  },
  "distribucion-tutores": {
    title: "Distribución de Tutores",
    subtitle: "Asignación De Tutores Por Estudiante",
    type: "excel",
    loadData: async (periodId, careerId, page, limit, careerIds) => {
      const response = await reportsService.getDistribucionTutores(periodId, careerId, page, limit, careerIds);
      return { data: response?.data || [], meta: response?.meta };
    },
    columns: [
      { header: "N°", accessor: "nro", className: "w-12 text-center" },
      { header: "Carrera", accessor: "carrera" },
      { header: "Estudiante", accessor: "estudiante" },
      { header: "Título TA", accessor: (r: any) => r.tutorAcademico?.titulo || '' },
      { header: "Nombre TA", accessor: (r: any) => r.tutorAcademico?.nombre || '' },
      { header: "Contacto TA", accessor: (r: any) => r.tutorAcademico?.contacto || '' },
      { header: "Nombre TM", accessor: (r: any) => r.tutorMetodologico?.nombre || '' },
      { header: "Contacto TM", accessor: (r: any) => r.tutorMetodologico?.contacto || '' },
      { header: "Horario TM", accessor: (r: any) => r.tutorMetodologico?.horario || '' },
      { header: "Nombre Eval", accessor: (r: any) => r.evaluador?.nombre || '' },
      { header: "Contacto Eval", accessor: (r: any) => r.evaluador?.contacto || '' },
    ],
  },
  "distribucion-tutores-v2": {
    title: "Dist. Tutores (Detallada)",
    subtitle: "Distribución De Tutores Con Horario Detallado",
    type: "excel",
    loadData: async (periodId, careerId, page, limit, careerIds) => {
      const response = await reportsService.getDistribucionTutoresV2(periodId, careerId, page, limit, careerIds);
      return { data: response?.data || [], meta: response?.meta };
    },
    columns: [
      { header: "N°", accessor: "nro", className: "w-12 text-center" },
      { header: "Carrera", accessor: "carrera" },
      { header: "Estudiante", accessor: "estudiante" },
      { header: "Título TA", accessor: (r: any) => r.tutorAcademico?.titulo || '' },
      { header: "Nombre TA", accessor: (r: any) => r.tutorAcademico?.nombre || '' },
      { header: "Contacto TA", accessor: (r: any) => r.tutorAcademico?.contacto || '' },
      { header: "Nombre TM", accessor: (r: any) => r.tutorMetodologico?.nombre || '' },
      { header: "Contacto TM", accessor: (r: any) => r.tutorMetodologico?.contacto || '' },
      { header: "Horario TM", accessor: (r: any) => r.tutorMetodologico?.horario || '' },
      { header: "Horario Det.", accessor: (r: any) => r.tutorMetodologico?.horarioDetallado || '' },
      { header: "Nombre Eval", accessor: (r: any) => r.evaluador?.nombre || '' },
      { header: "Contacto Eval", accessor: (r: any) => r.evaluador?.contacto || '' },
    ],
  },
  "relacion-individual-docente": {
    title: "Relación Individual del Docente",
    subtitle: "Reporte Individual Por Docente Tutor",
    type: "excel",
    loadData: async () => ({ data: [] }),
    columns: [
      { header: "N°", accessor: "nro", className: "w-12 text-center" },
      { header: "Región", accessor: "region" },
      { header: "Núcleo", accessor: "nucleo" },
      { header: "Extensión", accessor: "extension" },
      { header: "Carrera", accessor: "carrera" },
      { header: "Est. Nombre", accessor: (r: any) => r.estudiante?.nombre || '' },
      { header: "Est. Apellido", accessor: (r: any) => r.estudiante?.apellido || '' },
      { header: "Cédula", accessor: (r: any) => r.estudiante?.ci || '' },
      { header: "Sexo", accessor: (r: any) => r.estudiante?.sexo || '' },
      { header: "Tipo", accessor: (r: any) => r.estudiante?.tipo || '' },
      { header: "Teléfono", accessor: (r: any) => r.estudiante?.telefono || '' },
      { header: "Institución", accessor: (r: any) => r.institucion?.nombre || '' },
      { header: "Tutor Inst.", accessor: (r: any) => `${r.tutorInstitucional?.nombre || ''} ${r.tutorInstitucional?.apellido || ''}`.trim() },
      { header: "Dirección", accessor: "direccion" },
    ],
  },
};

/** Shorthand to get config for a known non-empty report type */
export function getReportConfig(type: string): ReportConfigEntry | undefined {
  return reportConfig[type as Exclude<ReportType, "">];
}
