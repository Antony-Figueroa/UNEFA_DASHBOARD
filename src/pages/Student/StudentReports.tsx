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

interface StudentPractice {
  practiceId: number;
  practiceTypeName: string;
  institutionName: string;
  period: string;
  status: number;
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
  const [studentPractices, setStudentPractices] = useState<StudentPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfState, setPdfState] = useState<{
    isOpen: boolean;
    title: string;
    data: any;
    template: any;
    fileName: string;
    documentType: string;
  } | null>(null);
  // Diálogo para seleccionar tipo de práctica cuando hay múltiples
  const [practiceSelector, setPracticeSelector] = useState<{
    isOpen: boolean;
    practices: StudentPractice[];
    report: ReportOption;
  } | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [dashRes, practicesRes] = await Promise.all([
        apiClient.get('/student/dashboard'),
        apiClient.get('/student/practices'),
      ]);
      const data = dashRes.data?.data;
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
      setStudentPractices(practicesRes.data?.data || []);
    } catch (err) {
      console.error('[StudentReports] Error:', err);
      addToast({ variant: 'error', title: 'Error', message: 'Error al cargar datos del estudiante' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = useCallback(async (report: ReportOption) => {
    const practices = studentPractices;
    
    // Obtener tipos de práctica únicos
    const uniqueTypes = [...new Set(practices.map(p => p.practiceTypeName).filter(Boolean))];
    
    // Si el estudiante tiene múltiples tipos de práctica y es el reporte de evaluacion-final, mostrar selector
    if (report.key === 'evaluacion-final' && uniqueTypes.length > 1) {
      setPracticeSelector({ isOpen: true, practices, report });
      return;
    }

    // Si no, usar la práctica activa (first available)
    const targetPracticeId = studentInfo?.practiceId || practices[0]?.practiceId;
    if (!targetPracticeId) {
      addToast({ variant: 'error', title: 'Sin práctica', message: 'No tenés una práctica profesional activa' });
      return;
    }

    await generateReport(report, targetPracticeId);
  }, [studentInfo, studentPractices, addToast]);

  const generateReport = async (report: ReportOption, targetPracticeId: number) => {
    try {
      const [response, allTextos] = await Promise.all([
        report.getData(targetPracticeId),
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
        fileName: `${report.documentType}_${targetPracticeId}`,
        documentType: report.documentType,
      });
    } catch (err: any) {
      addToast(err?.response?.data?.message
        ? { variant: 'error', title: 'Error al cargar', message: err.response.data.message }
        : { ...TOAST.loadError(), message: 'Error al generar el reporte. Intentá de nuevo.' });
    }
  };

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

      {/* Selector de tipo de práctica cuando hay múltiples */}
      {practiceSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-border-light dark:border-border-dark w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-semibold text-text-primary dark:text-white">
                Seleccionar Tipo de Práctica
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Tenés múltiples prácticas registradas. Seleccioná para cuál querés generar el reporte:
              </p>
            </div>
            <div className="px-6 py-4 space-y-2 max-h-60 overflow-y-auto">
              {practiceSelector.practices.map((p) => (
                <button
                  key={p.practiceId}
                  onClick={() => {
                    const report = practiceSelector.report;
                    setPracticeSelector(null);
                    generateReport(report, p.practiceId);
                  }}
                  className="w-full text-left p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-brand-500/50 dark:hover:border-brand-500/50 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {p.practiceTypeName}
                      </p>
                      <p className="text-sm text-text-tertiary mt-0.5">
                        {p.institutionName}{p.institutionName && p.period ? ' · ' : ''}{p.period}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-text-tertiary group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex justify-end">
              <button
                onClick={() => setPracticeSelector(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
