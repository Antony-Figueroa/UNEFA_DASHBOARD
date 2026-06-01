import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import toast from 'react-hot-toast';
import { TOAST_SUCCESS, TOAST_ERROR } from '@/components/ui/dialog/DialogConfig';
import reportsService, { PracticeSearchResult, TutorSearchResult } from '../services/reportsService';

const resourceName = 'Reporte';
import { getAllDocumentTexts } from '../services/reportTextsService';
import { SingleReportModal } from '../../../components/ui/pdf/SingleReportModal';
import { SearchableInput } from './SearchableInput';
import { RecordListModal } from './RecordListModal';
import { SelectionSummary } from './SelectionSummary';
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

const PRACTICE_DOCS = new Set([
  'aceptacion-tutor', 'solicitud-institucion', 'carta-postulacion',
  'acta-validacion', 'evaluacion-final', 'evaluacion-tutor-institucional',
  'evaluacion-tutor-academico', 'evaluacion-comite',
]);

const TUTOR_DOCS = new Set([
  'constancia-tutor-academico', 'constancia-tutor-institucional',
]);

const DOCUMENT_CONFIG: Record<string, {
  title: string;
  idLabel: string;
  idPlaceholder: string;
  getData: (id: number) => Promise<any>;
  pdfTemplate: React.FC<{ data: any; textos: Record<string, string> }>;
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

  // Early return ANTES de cualquier hook para evitar "Rendered more hooks than during previous render"
  if (!config) return null;

  const isPracticeDoc = PRACTICE_DOCS.has(documentType);
  const isTutorDoc = TUTOR_DOCS.has(documentType);

  const [recordId, setRecordId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfData, setPdfData] = useState<any>(null);
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [showPdf, setShowPdf] = useState(false);

  // Selection state for summary card
  const [selectedRecord, setSelectedRecord] = useState<PracticeSearchResult | TutorSearchResult | null>(null);

  // Record list modal
  const [showRecordList, setShowRecordList] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRecordId('');
      setSelectedRecord(null);
      setShowRecordList(false);
    }
  }, [isOpen, documentType]);

  const handleSelectPractice = (item: PracticeSearchResult | TutorSearchResult) => {
    const practice = item as PracticeSearchResult;
    setRecordId(String(practice.practiceId));
    setSelectedRecord(item);
  };

  const handleSelectTutor = (item: PracticeSearchResult | TutorSearchResult) => {
    const tutor = item as TutorSearchResult;
    setRecordId(String(tutor.tutorId));
    setSelectedRecord(item);
  };

  const handleClearSelection = () => {
    setRecordId('');
    setSelectedRecord(null);
  };

  const handleGenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    const id = parseInt(recordId, 10);
    if (!id || id <= 0) {
      toast.error('Ingrese un ID válido');
      return;
    }
    setLoading(true);
    try {
      const [response, allTextos] = await Promise.all([
        config.getData(id),
        getAllDocumentTexts(),
      ]);
      if (!response?.success || !response?.data) {
        toast.error(response?.message || 'No se encontraron datos');
        return;
      }
      const dbKey = documentType.replace(/-/g, '_');
      setTextos(allTextos[dbKey] || {});
      setPdfData(response.data);
      setShowPdf(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || TOAST_ERROR.load(resourceName));
    } finally {
      setLoading(false);
    }
  };

  const Template = config.pdfTemplate;

  const renderTemplate = useCallback(
    (data: any) => <Template data={data} textos={textos} />,
    [Template, textos]
  );

  const searchSubtitle = isPracticeDoc
    ? 'Buscá el estudiante por CI o nombre, o explorá la lista de prácticas'
    : isTutorDoc
      ? 'Buscá el tutor por CI o nombre, o explorá la lista de tutores'
      : 'Ingresá el ID del registro para generar el documento';

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary dark:text-text-emphasis">
              {config.title}
            </h2>
            <p className="text-sm text-text-tertiary mt-1">{searchSubtitle}</p>
          </div>

          {/* Search section for practice or tutor docs */}
          {(isPracticeDoc || isTutorDoc) && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest">
                {isPracticeDoc ? 'Buscar Estudiante' : 'Buscar Tutor'}
              </label>

              <SearchableInput
                placeholder={isPracticeDoc ? 'CI o nombre del estudiante...' : 'CI o nombre del tutor...'}
                search={(q) => (isPracticeDoc ? reportsService.searchPractices(q).then(r => r.data || []) : reportsService.searchTutors(q).then(r => r.data || [])) as Promise<{ id: string | number }[]>}
                renderItem={(item: any) => (
                  <div>
                    <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                      {isPracticeDoc ? item.studentName : item.fullName}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      CI: {isPracticeDoc ? item.studentCi : item.ci}
                      {isPracticeDoc && item.careerName && ` · ${item.careerName}`}
                      {!isPracticeDoc && item.careers && ` · ${item.careers}`}
                      {isPracticeDoc && ` · ID: ${item.practiceId}`}
                      {!isPracticeDoc && ` · ID: ${item.tutorId}`}
                    </p>
                  </div>
                )}
                onSelect={(item) => isPracticeDoc ? handleSelectPractice(item as any) : handleSelectTutor(item as any)}
                getKey={(item: any) => isPracticeDoc ? item.practiceId : item.tutorId}
              />

              <button
                type="button"
                onClick={() => setShowRecordList(true)}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                Ver lista completa →
              </button>
            </div>
          )}

          {/* Selection summary */}
          {selectedRecord && (
            <SelectionSummary
              type={isPracticeDoc ? 'practice' : 'tutor'}
              data={selectedRecord}
              onChange={handleClearSelection}
            />
          )}

          <div className="flex items-center gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="button" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Cargando...' : 'Generar Documento'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record list explorer modal */}
      <RecordListModal
        isOpen={showRecordList}
        onClose={() => setShowRecordList(false)}
        recordType={isPracticeDoc ? 'practice' : 'tutor'}
        onSelect={(item) => {
          setShowRecordList(false);
          if (isPracticeDoc) {
            handleSelectPractice(item);
          } else {
            handleSelectTutor(item);
          }
        }}
      />

      {showPdf && pdfData && (
        <SingleReportModal
          isOpen={showPdf}
          onClose={() => { setShowPdf(false); onClose(); }}
          title={config.title}
          subtitle={`ID: ${recordId}`}
          data={pdfData}
          template={renderTemplate}
          fileName={`${documentType}_${recordId}`}
          recordInfo={{ label: config.idLabel, value: recordId }}
        />
      )}
    </>
  );
}
