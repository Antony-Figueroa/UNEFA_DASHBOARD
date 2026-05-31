import { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import InputField from '../../../components/form/input/InputField';
import toast from 'react-hot-toast';
import reportsService, { PracticeSearchResult } from '../services/reportsService';
import { getAllDocumentTexts } from '../services/reportTextsService';
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

const PRACTICE_DOCS = new Set([
  'aceptacion-tutor', 'solicitud-institucion', 'carta-postulacion',
  'acta-validacion', 'evaluacion-final', 'evaluacion-tutor-institucional',
  'evaluacion-tutor-academico', 'evaluacion-comite',
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
  const isPracticeDoc = PRACTICE_DOCS.has(documentType);
  const [recordId, setRecordId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfData, setPdfData] = useState<any>(null);
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [showPdf, setShowPdf] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PracticeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setRecordId('');
    }
  }, [isOpen, documentType]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isPracticeDoc || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await reportsService.searchPractices(searchTerm);
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm, isPracticeDoc]);

  const selectResult = (result: PracticeSearchResult) => {
    setRecordId(String(result.practiceId));
    setSearchTerm('');
    setSearchResults([]);
  };

  if (!config) return null;

  const handleGenerate = async () => {
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
              {isPracticeDoc
                ? 'Busque el estudiante por CI o nombre, o ingrese el ID directamente'
                : 'Ingrese el ID del registro para generar el documento'
              }
            </p>
          </div>

          {isPracticeDoc && (
            <div className="relative">
              <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
                Buscar Estudiante
              </label>
              <InputField
                placeholder="CI o nombre del estudiante..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searching && (
                <div className="absolute right-3 top-9">
                  <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full" />
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((r) => (
                    <button
                      key={r.practiceId}
                      type="button"
                      onClick={() => selectResult(r)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-border-default dark:border-border-dark last:border-b-0 transition-colors"
                    >
                      <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                        {r.studentName}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        CI: {r.studentCi} · {r.careerName} · ID Práctica: {r.practiceId}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {searchTerm.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-xs text-text-tertiary mt-1">Sin resultados. Puede ingresar el ID manualmente.</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
              {config.idLabel}
            </label>
            <InputField
              placeholder={config.idPlaceholder}
              type="number"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
            />
          </div>

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
          template={(data: any) => <Template data={data} textos={textos} />}
          fileName={`${documentType}_${recordId}`}
          recordInfo={{ label: config.idLabel, value: recordId }}
        />
      )}
    </>
  );
}
