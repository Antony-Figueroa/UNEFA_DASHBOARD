import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import CustomInput from '../../../components/ui/form/input/CustomInput';

import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
import reportsService, { PracticeSearchResult, TutorSearchResult } from '../services/reportsService';
import type { EligibleStudent } from '../../prospectos/types';

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
  ConstanciaTutorAcademicoPDF,
  ConstanciaTutorInstitucionalPDF,
} from '../../../components/ui/pdf/templates/institutional';

const PRACTICE_DOCS = new Set([
  'aceptacion-tutor', 'solicitud-institucion', 'carta-postulacion',
  'acta-validacion', 'evaluacion-final',
]);

const TUTOR_DOCS = new Set([
  'constancia-tutor-academico', 'constancia-tutor-institucional',
]);

const DOCUMENT_CONFIG: Record<string, {
  title: string;
  idLabel: string;
  idPlaceholder: string;
  getData: (id: number) => Promise<any>;
  pdfTemplate: React.FC<{ data: any; textos: Record<string, string>; verificationHash?: string; qrCodeDataUri?: string }>;
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
    getData: (id) => reportsService.getDocumentData('evaluacion-consolidada', id),
    pdfTemplate: EvaluacionFinalPDF,
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
  const { addToast } = useToast();
  const config = DOCUMENT_CONFIG[documentType];
  const isPracticeDoc = PRACTICE_DOCS.has(documentType);
  const isTutorDoc = TUTOR_DOCS.has(documentType);
  const isSolicitudInstitucion = documentType === 'solicitud-institucion';

  const [recordId, setRecordId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfData, setPdfData] = useState<any>(null);
  const [editableData, setEditableData] = useState<any>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [editableTextos, setEditableTextos] = useState<Record<string, string>>({});
  const [showPdf, setShowPdf] = useState(false);

  // Selection state for summary card
  const [selectedRecord, setSelectedRecord] = useState<PracticeSearchResult | TutorSearchResult | EligibleStudent | null>(null);

  // Record list modal
  const [showRecordList, setShowRecordList] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRecordId('');
      setSelectedRecord(null);
      setShowRecordList(false);
      setEditableTextos({});
      setEditableData(null);
    }
  }, [isOpen, documentType]);

  // Initialize editable texts when textos are loaded
  useEffect(() => {
    if (Object.keys(textos).length > 0) {
      setEditableTextos({...textos});
    }
  }, [textos]);

  const handleSelectPractice = (item: PracticeSearchResult | TutorSearchResult | EligibleStudent) => {
    const practice = item as PracticeSearchResult;
    setRecordId(String(practice.practiceId));
    setSelectedRecord(item);
  };

  const handleSelectTutor = (item: PracticeSearchResult | TutorSearchResult | EligibleStudent) => {
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
      addToast({ variant: "error", title: "Dato inválido", message: "Ingrese un CI válido" });
      return;
    }
    setLoading(true);
    try {
      const [response, allTextos] = await Promise.all([
        config.getData(id),
        getAllDocumentTexts(),
      ]);
      if (!response?.success || !response?.data) {
        addToast({ variant: "error", title: "Sin datos", message: response?.message || 'No se encontraron datos' });
        return;
      }
      const dbKey = documentType.replace(/-/g, '_');
      setTextos(allTextos[dbKey] || {});
      const initData = JSON.parse(JSON.stringify(response.data));
      // Inicializar título del tutor con abreviatura de la DB
      if (initData.tutor?.tituloAbrev) {
        initData.tutor.titulo = initData.tutor.tituloAbrev;
      }
      // Inicializar fecha de validación editable para carta-postulacion
      if (documentType === 'carta-postulacion' && !initData.fechaValidacion) {
        const hoy = new Date();
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        initData.fechaValidacion = `${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;
      }
      setPdfData(initData);
      setEditableData(initData);
      setShowPdf(true);
    } catch (error: any) {
      addToast(error?.response?.data?.message ? { variant: "error", title: "Error al cargar", message: error.response.data.message } : { ...TOAST.loadError(), message: `Error al cargar ${resourceName.toLowerCase()}. Intentá de nuevo.` });
    } finally {
      setLoading(false);
    }
  };

  const handleEditableTextChange = (key: string, value: string) => {
    setEditableTextos(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDataChange = (path: string, value: any) => {
    setEditableData((prev: any) => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
    setRenderKey(k => k + 1);
  };

const renderTemplate = useCallback(
    (data: any, verificationHash?: string, qrCodeDataUri?: string) => {
      const Tpl = DOCUMENT_CONFIG[documentType]?.pdfTemplate;
      const dataToUse = editableData || data;
      const textosToUse = Object.keys(editableTextos).length > 0 ? editableTextos : textos;
      return Tpl ? <Tpl key={renderKey} data={dataToUse} textos={textosToUse} verificationHash={verificationHash} qrCodeDataUri={qrCodeDataUri} /> : <></>;
    },
    [documentType, textos, editableTextos, editableData, renderKey]
  );

  const searchSubtitle = isPracticeDoc
    ? 'Busca el estudiante por CI o nombre, o explora la lista de prácticas'
    : isTutorDoc
      ? 'Busca el tutor por CI o nombre, o explora la lista de tutores'
      : 'Ingresa el ID del registro para generar el documento';

  // Guard después de TODOS los hooks
  if (!config) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md" className="max-w-full rounded-none min-h-screen max-h-full sm:max-w-md sm:rounded-2xl sm:min-h-0 sm:max-h-[95vh]">
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
            <Button variant="primary" onClick={handleGenerate} loading={loading} loadingText="Generando...">
              Generar Documento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record list explorer modal */}
      <RecordListModal
        isOpen={showRecordList}
        onClose={() => setShowRecordList(false)}
        recordType={isPracticeDoc ? 'practice' : 'tutor'}
        documentType={isPracticeDoc ? documentType : undefined}
        onSelect={(item) => {
          setShowRecordList(false);
          if (isPracticeDoc) {
            handleSelectPractice(item as PracticeSearchResult | TutorSearchResult);
          } else {
            handleSelectTutor(item as PracticeSearchResult | TutorSearchResult);
          }
        }}
      />

      {showPdf && pdfData && (
        <SingleReportModal
          isOpen={showPdf}
          onClose={() => { setShowPdf(false); onClose(); }}
          title={config.title}
          subtitle={`${config.title}`}
          data={pdfData}
          template={renderTemplate}
          fileName={`${documentType}_${recordId}`}
          verificationConfig={{ docType: documentType }}
          recordInfo={
            selectedRecord
              ? {
                  label: isPracticeDoc ? 'Estudiante' : 'Tutor',
                  value: isPracticeDoc
                    ? (selectedRecord as PracticeSearchResult).studentName
                    : (selectedRecord as TutorSearchResult).fullName,
                }
              : undefined
          }
          extraSidebarContent={
            <div className="space-y-4">
              {/* Info básica del registro */}
              {selectedRecord && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                      CI / Rif
                    </label>
                    <p className="text-xs font-semibold text-text-primary dark:text-white/90">
                      {isPracticeDoc
                        ? (selectedRecord as PracticeSearchResult).studentCi
                        : (selectedRecord as TutorSearchResult).ci}
                    </p>
                  </div>
                  {isPracticeDoc && (selectedRecord as PracticeSearchResult).careerName && (
                    <div className="p-3 rounded-lg bg-bg-secondary/50 dark:bg-white/5 border border-border-light dark:border-white/10">
                      <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                        Carrera
                      </label>
                      <p className="text-xs font-semibold text-text-primary dark:text-white/90">
                        {(selectedRecord as PracticeSearchResult).careerName}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Opciones de configuración para Solicitud de Institución */}
              {isSolicitudInstitucion && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-500 mb-1">
                  </div>

                  <CustomInput
                    label="Destinatario (Atte:)"
                    placeholder="Nombre del destinatario"
                    value={editableTextos.destinatario || ''}
                    onChange={(e) => handleEditableTextChange('destinatario', e.target.value)}
                  />

                  <CustomInput
                    label="Cargo Destinatario"
                    placeholder="Cargo del destinatario"
                    value={editableTextos.cargo || ''}
                    onChange={(e) => handleEditableTextChange('cargo', e.target.value)}
                  />

                  <CustomInput
                    label="Nombre de la Firma"
                    placeholder="Nombre de quien firma"
                    value={editableTextos.firmaNombre || ''}
                    onChange={(e) => handleEditableTextChange('firmaNombre', e.target.value)}
                  />

                  <CustomInput
                    label="Cargo de la Firma"
                    placeholder="Cargo de quien firma"
                    value={editableTextos.firmaCargo || ''}
                    onChange={(e) => handleEditableTextChange('firmaCargo', e.target.value)}
                  />

                  <CustomInput
                    label="Orden Administrativa"
                    placeholder="Según Orden administrativa..."
                    value={editableTextos.firmaOrden || ''}
                    onChange={(e) => handleEditableTextChange('firmaOrden', e.target.value)}
                  />

                  <div className="p-3 rounded-lg sm:rounded-xl bg-info-500/5 border border-info-500/10">
                    <p className="text-[10px] sm:text-[11px] text-info-600 dark:text-info-400 leading-relaxed">
                      <span className="font-bold">Nota:</span> Los cambios se reflejan automáticamente en la vista previa del documento.
                    </p>
                  </div>
                </div>
              )}

              {/* Opciones editables para Constancia Tutor Institucional */}
              {documentType === 'constancia-tutor-institucional' && editableData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-500 mb-1">
                    <h4 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                      Datos Editables
                    </h4>
                  </div>

                  <CustomInput
                    label="Destinatario (Señor(a):)"
                    placeholder="Nombre y título del destinatario"
                    value={editableTextos.destinatario || ''}
                    onChange={(e) => handleEditableTextChange('destinatario', e.target.value)}
                  />

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-primary dark:text-white/90">
                      Horas Totales
                    </label>
                    <select
                      value={String(editableData.hoursRequired || 480)}
                      onChange={(e) => handleDataChange('hoursRequired', parseInt(e.target.value))}
                      className="w-full rounded-lg border border-border-default dark:border-border-dark bg-transparent px-4 py-2.5 text-sm text-text-primary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                    >
                      <option value="480">480 horas</option>
                      <option value="620">620 horas</option>
                    </select>
                  </div>

                  <CustomInput
                    label="Nombre de la Institución"
                    placeholder="Nombre de la institución"
                    value={editableData.institucion?.nombre || ''}
                    onChange={(e) => handleDataChange('institucion.nombre', e.target.value)}
                  />

                  <CustomInput
                    label="Responsable de la Institución (Señor(a):)"
                    placeholder="Nombre completo del responsable"
                    value={editableData.responsable?.nombreCompleto || ''}
                    onChange={(e) => handleDataChange('responsable.nombreCompleto', e.target.value)}
                  />

                  <CustomInput
                    label="Título del Responsable"
                    placeholder="Ej: LICDO., LCDO., TSU."
                    value={editableData.responsable?.titulo || ''}
                    onChange={(e) => handleDataChange('responsable.titulo', e.target.value)}
                  />

                  <CustomInput
                    label="Título del Tutor"
                    placeholder="Ej: TÉCNICO SUPERIOR UNIVERSITARIO"
                    value={editableData.tutor?.titulo || ''}
                    onChange={(e) => handleDataChange('tutor.titulo', e.target.value)}
                  />

                  <CustomInput
                    label="Período Académico"
                    placeholder="Ej: 2-2026"
                    value={editableData.periodo?.description || ''}
                    onChange={(e) => handleDataChange('periodo.description', e.target.value)}
                  />

                  <CustomInput
                    label="Fecha de Inicio"
                    placeholder="dd/mm/aaaa"
                    value={editableData.periodo?.startDate || ''}
                    onChange={(e) => handleDataChange('periodo.startDate', e.target.value)}
                  />

                  <CustomInput
                    label="Fecha de Fin"
                    placeholder="dd/mm/aaaa"
                    value={editableData.periodo?.endDate || ''}
                    onChange={(e) => handleDataChange('periodo.endDate', e.target.value)}
                  />

                  <CustomInput
                    label="Atnn. (Destinatario)"
                    placeholder="Ej: LCDO. JUAN PÉREZ."
                    value={editableTextos.atnn || textos.atnn || ''}
                    onChange={(e) => handleEditableTextChange('atnn', e.target.value)}
                  />

                  <hr className="border-border-light dark:border-white/10 my-2" />

                  <CustomInput
                    label="Nombre de la Firma"
                    placeholder="Nombre de quien firma"
                    value={editableTextos.firmaNombre || textos.firmaNombre || ''}
                    onChange={(e) => handleEditableTextChange('firmaNombre', e.target.value)}
                  />

                  <CustomInput
                    label="Cargo de la Firma"
                    placeholder="Cargo de quien firma"
                    value={editableTextos.firmaCargo || textos.firmaCargo || ''}
                    onChange={(e) => handleEditableTextChange('firmaCargo', e.target.value)}
                  />

                  <CustomInput
                    label="Orden Administrativa"
                    placeholder="Según Orden administrativa..."
                    value={editableTextos.firmaOrden || textos.firmaOrden || ''}
                    onChange={(e) => handleEditableTextChange('firmaOrden', e.target.value)}
                  />

                  <div className="p-3 rounded-lg sm:rounded-xl bg-info-500/5 border border-info-500/10">
                    <p className="text-[10px] sm:text-[11px] text-info-600 dark:text-info-400 leading-relaxed">
                      <span className="font-bold">Nota:</span> Los cambios se reflejan automáticamente en la vista previa del documento.
                    </p>
                  </div>
                </div>
              )}

              {/* Opciones editables para Carta de Postulación */}
              {documentType === 'carta-postulacion' && editableData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-500 mb-1">
                    <h4 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                      Datos Editables
                    </h4>
                  </div>

                  <CustomInput
                    label="Teléfono de Contacto"
                    placeholder="Ej: 0412-5555555"
                    value={editableData.estudiante?.telefono || ''}
                    onChange={(e) => handleDataChange('estudiante.telefono', e.target.value)}
                  />

                  <CustomInput
                    label="Correo Electrónico"
                    placeholder="Ej: correo@ejemplo.com"
                    value={editableData.estudiante?.email || ''}
                    onChange={(e) => handleDataChange('estudiante.email', e.target.value)}
                  />

                  <CustomInput
                    label="Semestre"
                    placeholder="Ej: 8"
                    value={editableData.practica?.semester || ''}
                    onChange={(e) => handleDataChange('practica.semester', e.target.value)}
                  />

                  <CustomInput
                    label="Régimen (DIURNO / NOCTURNO)"
                    placeholder="DIURNO"
                    value={editableData.practica?.regime || ''}
                    onChange={(e) => handleDataChange('practica.regime', e.target.value)}
                  />

                  <CustomInput
                    label="Trabaja (dejar vacío = NO, cualquier valor = SÍ)"
                    placeholder="Ej: SÍ"
                    value={editableData.estudiante?.empleo || ''}
                    onChange={(e) => handleDataChange('estudiante.empleo', e.target.value)}
                  />

                  <CustomInput
                    label="Nombre de la Institución"
                    placeholder="Nombre de la institución"
                    value={editableData.institucion?.nombre || ''}
                    onChange={(e) => handleDataChange('institucion.nombre', e.target.value)}
                  />

                  <CustomInput
                    label="Nombre del Gerente de Talento Humano (en sección firma)"
                    placeholder="Nombre completo"
                    value={editableTextos.gerenteTalentoHumano || ''}
                    onChange={(e) => handleEditableTextChange('gerenteTalentoHumano', e.target.value)}
                  />

                  <CustomInput
                    label="Fecha de Validación"
                    placeholder="Ej: 6 de julio de 2026"
                    value={editableData.fechaValidacion || ''}
                    onChange={(e) => handleDataChange('fechaValidacion', e.target.value)}
                  />
                </div>
              )}

              {/* Opciones editables para Constancia Tutor Académico */}
              {documentType === 'constancia-tutor-academico' && editableData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-500 mb-1">
                    <h4 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs">
                      Datos Editables
                    </h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-primary dark:text-white/90">
                      Horas Totales
                    </label>
                    <select
                      value={String(editableData.totalHours || 480)}
                      onChange={(e) => handleDataChange('totalHours', parseInt(e.target.value))}
                      className="w-full rounded-lg border border-border-default dark:border-border-dark bg-transparent px-4 py-2.5 text-sm text-text-primary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors"
                    >
                      <option value="480">480 horas</option>
                      <option value="620">620 horas</option>
                    </select>
                  </div>

                  <CustomInput
                    label="Título del Tutor"
                    placeholder="Ej: LCDO."
                    value={editableData.tutor?.titulo || ''}
                    onChange={(e) => handleDataChange('tutor.titulo', e.target.value)}
                  />

                  <CustomInput
                    label="Condición del Tutor"
                    placeholder="Ej: TITULAR"
                    value={editableData.tutor?.condicion || ''}
                    onChange={(e) => handleDataChange('tutor.condicion', e.target.value)}
                  />

                  <CustomInput
                    label="Dedicación del Tutor"
                    placeholder="Ej: TIEMPO COMPLETO"
                    value={editableData.tutor?.dedicacion || ''}
                    onChange={(e) => handleDataChange('tutor.dedicacion', e.target.value)}
                  />

                  <CustomInput
                    label="Período Académico"
                    placeholder="Ej: 1-2026"
                    value={editableData.periodo?.description || ''}
                    onChange={(e) => handleDataChange('periodo.description', e.target.value)}
                  />

                  <CustomInput
                    label="Fecha de Inicio"
                    placeholder="dd/mm/aaaa"
                    value={editableData.periodo?.startDate || ''}
                    onChange={(e) => handleDataChange('periodo.startDate', e.target.value)}
                  />

                  <CustomInput
                    label="Fecha de Fin"
                    placeholder="dd/mm/aaaa"
                    value={editableData.periodo?.endDate || ''}
                    onChange={(e) => handleDataChange('periodo.endDate', e.target.value)}
                  />

                  <div className="border-t border-border-light dark:border-white/10 pt-3 mt-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary dark:text-white/60 mb-2">
                      Sección de Firma
                    </h5>

                    <CustomInput
                      label="Código de Referencia"
                      placeholder="Ej: MVR/"
                      value={editableTextos.firmaCodigo || ''}
                      onChange={(e) => handleEditableTextChange('firmaCodigo', e.target.value)}
                    />

                    <CustomInput
                      label="Nombre de la Firmante"
                      placeholder="Ej: MSc. Marbelys del Valle Rivero"
                      value={editableTextos.firmaNombre || ''}
                      onChange={(e) => handleEditableTextChange('firmaNombre', e.target.value)}
                    />

                    <CustomInput
                      label="Cargo de la Firmante"
                      placeholder="Ej: Decana del Núcleo Portuguesa"
                      value={editableTextos.firmaCargo || ''}
                      onChange={(e) => handleEditableTextChange('firmaCargo', e.target.value)}
                    />

                    <CustomInput
                      label="Orden Administrativa"
                      placeholder="Ej: Según Orden administrativa N° 0005..."
                      value={editableTextos.firmaOrden || ''}
                      onChange={(e) => handleEditableTextChange('firmaOrden', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Opciones editables para Evaluación Final — secciones colapsables */}
              {documentType === 'evaluacion-final' && <EvaluacionFinalEditableFields
                editableTextos={editableTextos}
                textos={textos}
                handleEditableTextChange={handleEditableTextChange}
              />}
            </div>
          }
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   Sección Colapsable + Componente de Firmas Editables
   ───────────────────────────────────────────── */
function CollapsibleSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border-light dark:border-white/10 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-bg-secondary/50 dark:bg-white/5 hover:bg-bg-secondary dark:hover:bg-white/10 transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-text-primary dark:text-white/90">{title}</span>
        <svg className={`w-4 h-4 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-3 space-y-3 border-t border-border-light dark:border-white/10">{children}</div>}
    </div>
  );
}

function EvaluacionFinalEditableFields({
  editableTextos,
  textos,
  handleEditableTextChange,
}: {
  editableTextos: Record<string, string>;
  textos: Record<string, string>;
  handleEditableTextChange: (key: string, value: string) => void;
}) {
  const FirmaField = ({ label, placeholder, textKey }: { label: string; placeholder: string; textKey: string }) => (
    <CustomInput
      label={label}
      placeholder={placeholder}
      value={editableTextos[textKey] || textos[textKey] || ''}
      onChange={(e) => handleEditableTextChange(textKey, e.target.value)}
    />
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-brand-500 mb-1">
        <h4 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs">
          Datos Editables por Página
        </h4>
      </div>

      {/* Página 1: Comité Evaluador */}
      <CollapsibleSection title="Página 1 — Comité Evaluador">
        <FirmaField label="Coordinador PP — Nombre" placeholder="Nombre y apellido" textKey="comiteFirma1Nombre" />
        <FirmaField label="Coordinador PP — Cargo" placeholder="Cargo" textKey="comiteFirma1Cargo" />
        <hr className="border-border-light dark:border-white/10" />
        <FirmaField label="Coordinador Carrera — Nombre" placeholder="Nombre y apellido" textKey="comiteFirma2Nombre" />
        <FirmaField label="Coordinador Carrera — Cargo" placeholder="Cargo" textKey="comiteFirma2Cargo" />
        <hr className="border-border-light dark:border-white/10" />
        <FirmaField label="Tutor Académico — Nombre" placeholder="Nombre y apellido" textKey="comiteFirma3Nombre" />
        <FirmaField label="Tutor Académico — Cargo" placeholder="Cargo" textKey="comiteFirma3Cargo" />
      </CollapsibleSection>

      {/* Página 2: Tutor Académico */}
      <CollapsibleSection title="Página 2 — Tutor Académico">
        <FirmaField label="Tutor Académico — Nombre" placeholder="Nombre y apellido" textKey="academicoFirmaNombre" />
        <FirmaField label="Tutor Académico — Cargo" placeholder="Cargo" textKey="academicoFirmaCargo" />
      </CollapsibleSection>

      {/* Página 3: Tutor Institucional */}
      <CollapsibleSection title="Página 3 — Tutor Institucional">
        <FirmaField label="Tutor(a) Institucional — Nombre" placeholder="Nombre y apellido" textKey="institucionalFirmaNombre" />
        <FirmaField label="Tutor(a) Institucional — Cargo" placeholder="Cargo" textKey="institucionalFirmaCargo" />
      </CollapsibleSection>

      {/* Página 4: Evaluación Final */}
      <CollapsibleSection title="Página 4 — Evaluación Final" defaultOpen={true}>
        <FirmaField label="Firma 1 — Nombre" placeholder="Nombre de quien firma" textKey="firma1Nombre" />
        <FirmaField label="Firma 1 — Cargo" placeholder="Jefa del Equipo de Trabajo de Prácticas Profesionales" textKey="firma1Cargo" />
        <hr className="border-border-light dark:border-white/10" />
        <FirmaField label="Firma 2 — Nombre" placeholder="Nombre" textKey="firma2Nombre" />
        <FirmaField label="Firma 2 — Cargo" placeholder="Jefe del Área de Secretaría" textKey="firma2Cargo" />
        <hr className="border-border-light dark:border-white/10" />
        <FirmaField label="Firma 3 — Nombre" placeholder="Nombre" textKey="firma3Nombre" />
        <FirmaField label="Firma 3 — Cargo" placeholder="Jefa del Área Académica" textKey="firma3Cargo" />
        <hr className="border-border-light dark:border-white/10" />
        <FirmaField label="Firma 4 — Nombre" placeholder="Nombre" textKey="firma4Nombre" />
        <FirmaField label="Firma 4 — Cargo" placeholder="Jefa de la Unidad de Gestión Educativa" textKey="firma4Cargo" />
        <hr className="border-border-light dark:border-white/10" />
        <FirmaField label="Firma 5 — Nombre" placeholder="Nombre" textKey="firma5Nombre" />
        <FirmaField label="Firma 5 — Cargo" placeholder="Decana del Núcleo" textKey="firma5Cargo" />
        <FirmaField label="Firma 5 — Orden Administrativa" placeholder="Según Orden administrativa N° ..." textKey="firma5Orden" />
      </CollapsibleSection>

      <div className="p-3 rounded-lg sm:rounded-xl bg-info-500/5 border border-info-500/10">
        <p className="text-[10px] sm:text-[11px] text-info-600 dark:text-info-400 leading-relaxed">
          <span className="font-bold">Nota:</span> Los cambios se reflejan automáticamente en la vista previa del documento.
        </p>
      </div>
    </div>
  );
}
