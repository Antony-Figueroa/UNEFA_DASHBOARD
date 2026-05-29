import { useState } from 'react';
import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import InputField from '../../../components/form/input/InputField';
import toast from 'react-hot-toast';
import reportsService from '../services/reportsService';
import { SingleReportModal } from '../../../components/ui/pdf/SingleReportModal';
import {
  AceptacionTutorPDF,
  SolicitudInstitucionPDF,
  CartaPostulacionPDF,
  ActaValidacionPDF,
  EvaluacionFinalPDF,
  EvaluacionTutorInstitucionalPDF,
  EvaluacionTutorAcademicoPDF,
  EvaluacionComitePDF,
  ConstanciaTutorAcademicoPDF,
  ConstanciaTutorInstitucionalPDF,
} from '../../../components/ui/pdf/templates/institutional';

const DOCUMENT_CONFIG: Record<string, {
  title: string;
  idLabel: string;
  idPlaceholder: string;
  getData: (id: number) => Promise<any>;
  pdfTemplate: React.FC<{ data: any; textos?: Record<string, string> }>;
}> = {
  'aceptacion-tutor': {
    title: 'Carta de Aceptación del Tutor Académico',
    idLabel: 'ID de la Práctica Profesional',
    idPlaceholder: 'Ej: 123',
    getData: (id) => reportsService.getDocumentData('aceptacion-tutor', id),
    pdfTemplate: AceptacionTutorPDF,
  },
  'solicitud-institucion': {
    title: 'Solicitud de Asignación de Institución',
    idLabel: 'ID de la Práctica Profesional',
    idPlaceholder: 'Ej: 123',
    getData: (id) => reportsService.getDocumentData('solicitud-institucion', id),
    pdfTemplate: SolicitudInstitucionPDF,
  },
  'carta-postulacion': {
    title: 'Carta de Postulación',
    idLabel: 'ID de la Práctica Profesional',
    idPlaceholder: 'Ej: 123',
    getData: (id) => reportsService.getDocumentData('carta-postulacion', id),
    pdfTemplate: CartaPostulacionPDF,
  },
  'acta-validacion': {
    title: 'Acta de Validación de Prácticas Profesionales',
    idLabel: 'ID de la Práctica Profesional',
    idPlaceholder: 'Ej: 123',
    getData: (id) => reportsService.getDocumentData('acta-validacion', id),
    pdfTemplate: ActaValidacionPDF,
  },
  'evaluacion-final': {
    title: 'Evaluación Final de Prácticas Profesionales',
    idLabel: 'ID de la Práctica Profesional',
    idPlaceholder: 'Ej: 123',
    getData: (id) => reportsService.getDocumentData('evaluacion-final', id),
    pdfTemplate: EvaluacionFinalPDF,
  },
  'evaluacion-tutor-institucional': {
    title: 'Evaluación del Tutor Institucional',
    idLabel: 'ID de la Práctica Profesional',
    idPlaceholder: 'Ej: 123',
    getData: (id) => reportsService.getDocumentData('evaluacion-tutor-institucional', id),
    pdfTemplate: EvaluacionTutorInstitucionalPDF,
  },
  'evaluacion-tutor-academico': {
    title: 'Evaluación del Tutor Académico',
    idLabel: 'ID de la Práctica Profesional',
    idPlaceholder: 'Ej: 123',
    getData: (id) => reportsService.getDocumentData('evaluacion-tutor-academico', id),
    pdfTemplate: EvaluacionTutorAcademicoPDF,
  },
  'evaluacion-comite': {
    title: 'Evaluación del Comité Evaluador',
    idLabel: 'ID de la Práctica Profesional',
    idPlaceholder: 'Ej: 123',
    getData: (id) => reportsService.getDocumentData('evaluacion-comite', id),
    pdfTemplate: EvaluacionComitePDF,
  },
  'constancia-tutor-academico': {
    title: 'Constancia de Tutor Académico',
    idLabel: 'ID del Tutor',
    idPlaceholder: 'Ej: 456',
    getData: (id) => reportsService.getDocumentData('constancia-tutor-academico', id),
    pdfTemplate: ConstanciaTutorAcademicoPDF,
  },
  'constancia-tutor-institucional': {
    title: 'Constancia de Tutor Institucional',
    idLabel: 'ID del Tutor',
    idPlaceholder: 'Ej: 456',
    getData: (id) => reportsService.getDocumentData('constancia-tutor-institucional', id),
    pdfTemplate: ConstanciaTutorInstitucionalPDF,
  },
};

interface DocumentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
}

export function DocumentReportModal({ isOpen, onClose, documentType }: DocumentReportModalProps) {
  const config = DOCUMENT_CONFIG[documentType];
  const [recordId, setRecordId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfData, setPdfData] = useState<any>(null);
  const [showPdf, setShowPdf] = useState(false);

  if (!config) return null;

  const handleGenerate = async () => {
    const id = parseInt(recordId, 10);
    if (!id || id <= 0) {
      toast.error('Ingrese un ID válido');
      return;
    }
    setLoading(true);
    try {
      const response = await config.getData(id);
      if (!response?.success || !response?.data) {
        toast.error(response?.message || 'No se encontraron datos');
        return;
      }
      setPdfData(response.data);
      setShowPdf(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const Template = config.pdfTemplate;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary dark:text-text-emphasis">
              {config.title}
            </h2>
            <p className="text-sm text-text-tertiary mt-1">
              Ingrese el ID del registro para generar el documento
            </p>
          </div>

          <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
            {config.idLabel}
          </label>
          <InputField
            placeholder={config.idPlaceholder}
            type="number"
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
          />

          <div className="flex items-center gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Cargando...' : 'Generar Documento'}
            </Button>
          </div>
        </div>
      </Modal>

      {showPdf && pdfData && (
        <SingleReportModal
          isOpen={showPdf}
          onClose={() => { setShowPdf(false); onClose(); }}
          title={config.title}
          subtitle={`ID: ${recordId}`}
          data={pdfData}
          template={(data: any) => <Template data={data} />}
          fileName={`${documentType}_${recordId}`}
          recordInfo={{ label: config.idLabel, value: recordId }}
        />
      )}
    </>
  );
}
