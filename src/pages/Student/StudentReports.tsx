import { useEffect, useState, useCallback } from 'react';
import { FileText, ClipboardCheck, Star } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { SingleReportModal } from '../../components/ui/pdf/SingleReportModal';
import { reportsService } from '../../features/reports/services/reportsService';
import { getAllDocumentTexts } from '../../features/reports/services/reportTextsService';
import {
  CartaPostulacionPDF,
  ActaValidacionPDF,
  EvaluacionFinalPDF,
} from '../../components/ui/pdf/templates/institutional';
import { useToast } from '../../context/toast';
import { TOAST } from '../../components/ui/dialog/DialogConfig';

interface StudentInfo {
  studentName: string;
  studentCi: string;
  careerName: string;
  practiceId: number;
  institutionName: string;
  period: string;
  status: string;
}

interface ReportOption {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  documentType: string;
  getData: (id: number) => Promise<any>;
  pdfTemplate: React.FC<{ data: any; textos: Record<string, string>; verificationHash?: string; qrCodeDataUri?: string }>;
}

const DOCUMENT_TYPES = ['carta-postulacion', 'acta-validacion', 'evaluacion-final'] as const;

const REPORTS: ReportOption[] = [
  {
    key: 'carta-postulacion',
    title: 'Carta de Postulación',
    description: 'Documento que formaliza tu postulación para la práctica profesional',
    icon: <FileText className="w-8 h-8" />,
    documentType: 'carta-postulacion',
    getData: (id) => reportsService.getDocumentData('carta-postulacion', id),
    pdfTemplate: CartaPostulacionPDF,
  },
  {
    key: 'acta-validacion',
    title: 'Acta de Validación',
    description: 'Acta que valida las horas y actividades realizadas en tu práctica',
    icon: <ClipboardCheck className="w-8 h-8" />,
    documentType: 'acta-validacion',
    getData: (id) => reportsService.getDocumentData('acta-validacion', id),
    pdfTemplate: ActaValidacionPDF,
  },
  {
    key: 'evaluacion-final',
    title: 'Actas Evaluativas',
    description: 'Evaluación final consolidada de tu práctica profesional',
    icon: <Star className="w-8 h-8" />,
    documentType: 'evaluacion-final',
    getData: (id) => reportsService.getDocumentData('evaluacion-consolidada', id),
    pdfTemplate: EvaluacionFinalPDF,
  },
];

export default function StudentReports() {
  const { addToast } = useToast();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfState, setPdfState] = useState<{
    isOpen: boolean;
    title: string;
    data: any;
    template: any;
    fileName: string;
    documentType: string;
  } | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/student/dashboard');
      const data = res.data?.data;
      if (!data) {
        addToast({ variant: 'error', title: 'Error', message: 'No se pudieron cargar tus datos' });
        return;
      }
      const internship = data.internship || {};
      const student = data.student || {};
      setStudentInfo({
        studentName: `${student.name || ''} ${student.surname || ''}`.trim() || 'Estudiante',
        studentCi: student.ci || '',
        careerName: internship.careerName || '',
        practiceId: internship.professionalPracticeId,
        institutionName: internship.institutionName || '',
        period: internship.period || '',
        status: internship.status || '',
      });
    } catch (err) {
      console.error('[StudentReports] Error:', err);
      addToast({ variant: 'error', title: 'Error', message: 'Error al cargar datos del estudiante' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = useCallback(async (report: ReportOption) => {
    if (!studentInfo?.practiceId) {
      addToast({ variant: 'error', title: 'Sin práctica', message: 'No tenés una práctica profesional activa' });
      return;
    }

    try {
      const [response, allTextos] = await Promise.all([
        report.getData(studentInfo.practiceId),
        getAllDocumentTexts(),
      ]);
      if (!response?.success || !response?.data) {
        addToast({ variant: 'error', title: 'Sin datos', message: response?.message || 'No se encontraron datos para generar el reporte' });
        return;
      }

      const dbKey = report.documentType.replace(/-/g, '_');
      const textos = allTextos[dbKey] || {};
      const data = JSON.parse(JSON.stringify(response.data));

      const template = (d: any, vh?: string, qr?: string) =>
        <report.pdfTemplate data={d} textos={textos} verificationHash={vh} qrCodeDataUri={qr} />;

      setPdfState({
        isOpen: true,
        title: report.title,
        data,
        template,
        fileName: `${report.documentType}_${studentInfo.practiceId}`,
        documentType: report.documentType,
      });
    } catch (err: any) {
      addToast(err?.response?.data?.message
        ? { variant: 'error', title: 'Error al cargar', message: err.response.data.message }
        : { ...TOAST.loadError(), message: 'Error al generar el reporte. Intentá de nuevo.' });
    }
  }, [studentInfo, addToast]);

  const handleClosePdf = useCallback(() => {
    setPdfState(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!studentInfo?.practiceId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FileText className="w-16 h-16 text-text-tertiary mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">Sin práctica activa</h3>
        <p className="text-sm text-text-tertiary max-w-md">
          Necesitás tener una práctica profesional asignada para generar reportes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen del estudiante */}
      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-border-light dark:border-border-dark">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-text-tertiary">Estudiante</span>
            <p className="font-semibold text-text-primary">{studentInfo.studentName}</p>
          </div>
          <div>
            <span className="text-text-tertiary">CI</span>
            <p className="font-semibold text-text-primary">{studentInfo.studentCi}</p>
          </div>
          <div>
            <span className="text-text-tertiary">Carrera</span>
            <p className="font-semibold text-text-primary">{studentInfo.careerName}</p>
          </div>
          <div>
            <span className="text-text-tertiary">Institución</span>
            <p className="font-semibold text-text-primary">{studentInfo.institutionName || '-'}</p>
          </div>
        </div>
      </div>

      {/* Reportes disponibles */}
      <h3 className="text-lg font-semibold text-text-primary">Reportes disponibles</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORTS.map((report) => (
          <button
            key={report.key}
            onClick={() => handleGenerate(report)}
            className="flex flex-col items-start p-6 bg-white dark:bg-gray-800/50 rounded-xl border border-border-light dark:border-border-dark hover:border-brand-500/50 dark:hover:border-brand-500/50 hover:shadow-md transition-all text-left group"
          >
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 mb-4 group-hover:scale-105 transition-transform">
              {report.icon}
            </div>
            <h4 className="font-semibold text-text-primary mb-1">{report.title}</h4>
            <p className="text-sm text-text-tertiary">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Modal de PDF */}
      {pdfState && (
        <SingleReportModal
          isOpen={pdfState.isOpen}
          onClose={handleClosePdf}
          title={pdfState.title}
          data={pdfState.data}
          template={pdfState.template}
          fileName={pdfState.fileName}
          verificationConfig={{ docType: pdfState.documentType }}
        />
      )}
    </div>
  );
}
