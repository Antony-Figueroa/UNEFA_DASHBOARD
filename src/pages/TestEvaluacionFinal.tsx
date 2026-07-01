import { EvaluacionFinalPDF } from '@/components/ui/pdf/templates/institutional/EvaluacionFinalPDF';
import { PDFViewer } from '@react-pdf/renderer';

const mockData = {
  estudiante: {
    ci: 'V-24156789',
    primerNombre: 'María',
    segundoNombre: 'Alejandra',
    primerApellido: 'González',
    segundoApellido: 'Pérez',
  },
  carrera: { nombre: 'INGENIERÍA EN INFORMÁTICA' },
  institucion: { nombre: 'EMPRESA DE TECNOLOGÍA VENEZOLANA S.A.' },
  practica: {
    startDate: '2025-09-01',
    endDate: '2026-01-31',
    grade: 18,
  },
  evaluaciones: {
    tutorInstitucional: { parcial: 18, weight: 0.4 },
    tutorAcademico: { parcial: 16, weight: 0.3 },
    comiteEvaluador: { parcial: 19, weight: 0.3 },
    notaFinal: 17.7,
  },
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
