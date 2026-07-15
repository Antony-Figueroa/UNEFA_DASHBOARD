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
  | "relacion-instituciones-solicitan"
  | "proyeccion-pasantias"
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
      { id: "aceptacion-tutor", title: "Carta de Aceptación", subtitle: "Aceptación del Tutor Académico", icon: "fileText", type: "pdf" },
      { id: "solicitud-institucion", title: "Solicitud de Institución", subtitle: "Asignación de Institución para PP", icon: "fileText", type: "pdf" },
      { id: "carta-postulacion", title: "Carta de Postulación", subtitle: "Postulación del Estudiante", icon: "fileText", type: "pdf" },
      { id: "acta-validacion", title: "Acta de Validación", subtitle: "Validación de Prácticas Profesionales", icon: "fileText", type: "pdf" },
      { id: "evaluacion-final", title: "Evaluación Final", subtitle: "Reporte unificado: Tutores, Comité y Resumen Final", icon: "fileText", type: "pdf" },
      { id: "constancia-tutor-academico", title: "Const. Tutor Académico", subtitle: "Constancia de Tutor Académico", icon: "fileText", type: "pdf" },
      { id: "constancia-tutor-institucional", title: "Const. Tutor Institucional", subtitle: "Constancia de Tutor Institucional", icon: "fileText", type: "pdf" },
    ],
  },
  {
    title: "Reportes Generales",
    description: "Reportes exportables a Excel con datos agregados",
    reports: [
      { id: "tutores-academicos", title: "Relación de Tutores Acad.", subtitle: "ANEXO 4 - Tutores y Estudiantes Atendidos", icon: "table", type: "excel" },
      { id: "resumen-pasantias", title: "Resumen de Pasantías", subtitle: "Resumen General de Prácticas Profesionales", icon: "table", type: "excel" },
      { id: "relacion-empresas", title: "Relación de Empresas", subtitle: "Instituciones que Demandan Pasantes", icon: "spreadsheet", type: "excel" },
      { id: "relacion-instituciones-solicitan", title: "Relación de Instituciones", subtitle: "Instituciones que Solicitan Asignación de Pasantes", icon: "spreadsheet", type: "excel" },
      { id: "proyeccion-pasantias", title: "Proyección de Pasantías", subtitle: "Proyección Prospectiva de Pasantías por Período Académico", icon: "table", type: "excel" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Report config entries
// ---------------------------------------------------------------------------

export const reportConfig: Record<Exclude<ReportType, "">, ReportConfigEntry> = {
  "students": {
    title: "Reporte de Estudiantes",
    subtitle: "Listado General de Estudiantes Registrados",
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
    subtitle: "Reporte de Tutores Académicos y Estudiantes Atendidos",
    type: "excel",
    loadData: async (periodId, careerId, page, limit, careerIds) => {
      const response = await reportsService.getTutorsAcademicReport(periodId, careerId, page, limit, careerIds);
      return { data: response.data || [], meta: response.meta };
    },
    pdfTemplate: (data) => <TutorPDF data={data as any[]} />,
    columns: [
      { header: "N°", accessor: "nro", className: "w-12 text-center" },
      { header: "REGIÓN", accessor: "region" },
      { header: "NÚCLEO", accessor: "nucleo" },
      { header: "EXTENSIÓN", accessor: "extension" },
      { header: "CARRERA", accessor: "carrera" },
      { header: "NOMBRE DEL TUTOR (A)", accessor: "nombreTutor" },
      { header: "APELLIDO DEL TUTOR (A)", accessor: "apellidoTutor" },
      { header: "CÉDULA", accessor: "cedula" },
      { header: "CONDICIÓN", accessor: "condicion" },
      { header: "DEDICACIÓN", accessor: "dedicacion" },
      { header: "CATEGORÍA", accessor: "categoria" },
      { header: "TELÉFONO", accessor: "telefono" },
      { header: "CORREO ELECTRÓNICO", accessor: "correo" },
      { header: "CANTIDAD DE ESTUDIANTES ATENDIDOS", accessor: (row: TutorAcademicReportRow) => row.cantidadEstudiantes, className: "text-center font-bold" },
    ],
  },
  "resumen-pasantias": {
    title: "Resumen de Pasantías",
    subtitle: "Reporte Resumen General de las Prácticas Profesionales",
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
      { header: "Extensión", accessor: "extension" },
      { header: "Carrera", accessor: "carrera" },
      { header: "Estudiantes", accessor: "cantidadEstudiantes" },
      { header: "Tutores Acad.", accessor: "cantidadTutoresAcad" },
      { header: "Empresa", accessor: "empresa" },
      { header: "Tipo", accessor: "tipoEmpresa" },
      { header: "Cant. Tutores Inst.", accessor: "cantidadTutoresInst" },
      { header: "Observación", accessor: "observacion" },
    ],
  },
  "institutions": {
    title: "Reporte de Instituciones",
    subtitle: "Listado de Empresas o Instituciones Registradas",
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
    subtitle: "Listado de Inscripciones Activas",
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
    subtitle: "Estudiantes que Han Completado sus Prácticas Profesionales",
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
    subtitle: "Instituciones que Demandan Asignación de Pasantes",
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
      { header: "Pública", accessor: "publica", className: "text-center" },
      { header: "Privada", accessor: "privada", className: "text-center" },
      { header: "Carrera", accessor: "carrera" },
      { header: "Est.", accessor: "cantidadEstudiantes", className: "text-center font-bold" },
    ],
  },
  "relacion-instituciones-solicitan": {
    title: "Relación de Instituciones",
    subtitle: "Instituciones que Solicitan Asignación de Pasantes",
    type: "excel",
    loadData: async (periodId, careerId, page, limit, careerIds) => {
      const response = await reportsService.getRelacionInstitucionesSolicitan(periodId, careerId, page, limit, careerIds);
      return { data: response?.data || [], meta: response?.meta };
    },
    columns: [
      { header: "Región", accessor: "region" },
      { header: "Núcleo", accessor: "nucleo" },
      { header: "Extensión", accessor: "extension" },
      { header: "Nombre de la Empresa o Institución", accessor: "empresa" },
      { header: "RIF", accessor: "rif" },
      { header: "Responsable", accessor: "responsable" },
      { header: "Número de Contacto", accessor: "numeroContacto", className: "text-center" },
      { header: "Tipo de Empresa", accessor: "tipoEmpresa", className: "text-center" },
      { header: "Carreras", accessor: "carreras" },
      { header: "Cantidad de Estudiantes", accessor: "cantidadEstudiantes", className: "text-center font-bold" },
    ],
  },
  "proyeccion-pasantias": {
    title: "Proyección de Pasantías",
    subtitle: "Proyección Prospectiva de Pasantías por Período Académico",
    type: "excel",
    loadData: async () => ({ data: [] }),
    columns: [
      { header: "Núcleo", accessor: "name" },
      { header: "Región", accessor: "region" },
      { header: "Carreras Cortas", accessor: "shortCareers" },
      { header: "Carreras Largas", accessor: "longCareers" },
    ],
  },
};

/** Shorthand to get config for a known non-empty report type */
export function getReportConfig(type: string): ReportConfigEntry | undefined {
  return reportConfig[type as Exclude<ReportType, "">];
}
