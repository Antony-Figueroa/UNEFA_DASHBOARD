import { EvaluacionFinalPDF } from '@/components/ui/pdf/templates/institutional/EvaluacionFinalPDF';
import { PDFViewer } from '@react-pdf/renderer';

const mockData = {
  practiceId: 1,
  estudiante: {
    ci: 'V-24156789',
    primerNombre: 'María',
    segundoNombre: 'Alejandra',
    primerApellido: 'González',
    segundoApellido: 'Pérez',
  },
  carrera: { nombre: 'INGENIERÍA EN INFORMÁTICA' },
  institucion: { nombre: 'EMPRESA DE TECNOLOGÍA VENEZOLANA S.A.' },
  periodo: { description: '2025-II', startDate: '2025-09-01', endDate: '2026-01-31' },
  department: 'DEPARTAMENTO DE PASANTÍAS',
  tutorInstitucional: { ci: 'V-12345678', titulo: 'Lic.', primerNombre: 'Carlos', primerApellido: 'Mendoza' },
  tutorAcademico: { ci: 'V-87654321', titulo: 'MSc.', primerNombre: 'Ana', primerApellido: 'Rivas' },
  coordinadorPP: { nombreCompleto: 'Prof. Luis Fernández', ci: 'V-11223344', cargo: 'Coordinador de Pasantías' },
  coordinadorCarrera: { nombreCompleto: 'Prof. María Torres', ci: 'V-55667788', cargo: 'Coordinador de Carrera' },
  evaluacionTutorInstitucional: { totalScore: 18, observations: 'Buen desempeño', criterios: [{ itemNumber: 1, description: 'Responsabilidad', score: 18 }] },
  evaluacionTutorAcademico: { totalScore: 16, observations: 'Cumple', criterios: [{ itemNumber: 1, description: 'Conocimiento técnico', score: 16 }] },
  evaluacionesComite: [{ evaluationId: 1, evaluatorName: 'Jurado 1', totalScore: 19, observations: 'Excelente', criterios: [{ itemNumber: 1, description: 'Exposición', score: 19 }] }],
  comiteTotalScore: 19,
  evaluacionFinal: {
    weights: { institucional: 0.4, academico: 0.3, comite: 0.3 },
    parciales: { institucional: 18, academico: 16, comite: 19 },
    notaFinal: 17.7,
  },
  practiceTypeName: 'Práctica Profesional',
  hasMultiplePracticeTypes: false,
  practica: { startDate: '2025-09-01', endDate: '2026-01-31', grade: 18 },
};

const mockTextos = {
  encabezado: 'En la ciudad de Acarigua, Estado Portuguesa, se evalúa la práctica profesional de {{estudianteNombreCompleto}}, CI: {{estudianteCi}}, cursante de {{carrera}}, en la institución {{institucionNombre}}, desde {{fechaInicio}} hasta {{fechaFin}}.',
};

export default function TestEvaluacionFinal() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <PDFViewer width="100%" height="100%">
        <EvaluacionFinalPDF data={mockData} textos={mockTextos} />
      </PDFViewer>
    </div>
  );
}
