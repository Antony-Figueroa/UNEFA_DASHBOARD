import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileSpreadsheet, Download, Upload, CheckCircle, AlertTriangle, XCircle, RotateCw, Users, FileText, ArrowLeft } from 'lucide-react';
import Button from '../../../components/ui/button/Button';
import Badge from '../../../components/ui/badge/Badge';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../../components/ui/modal';
import { useBulkImport } from '../hooks/useBulkImport';
import type { ImportType, PreviewRow } from '../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Icons for import type cards */
const TYPE_ICONS: Record<ImportType, typeof Users> = { students: Users, enrollments: FileText };
const TYPE_LABELS: Record<ImportType, string> = { students: 'Estudiantes', enrollments: 'Inscripciones' };

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const {
    step, type, preview, options, results, loading, error, setOptions, setStep,
    selectType, downloadTemplate, uploadFile, confirmImport, reset,
  } = useBulkImport();

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  // ── Step 1: SelectType ──────────────────────────────────────
  const renderSelectType = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto py-8">
      {(['students', 'enrollments'] as const).map(t => {
        const Icon = TYPE_ICONS[t];
        return (
          <button
            key={t}
            onClick={() => selectType(t)}
            className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed border-border-medium dark:border-border-dark hover:border-brand-500 dark:hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-all cursor-pointer group"
          >
            <div className="p-4 rounded-full bg-brand-50 dark:bg-brand-500/10 group-hover:bg-brand-100 dark:group-hover:bg-brand-500/20 transition-colors">
              <Icon className="w-10 h-10 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">
                {TYPE_LABELS[t]}
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                {t === 'students' ? 'Importar estudiantes desde Excel' : 'Importar inscripciones desde Excel'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );

  // ── Step 2: Upload ──────────────────────────────────────────
  const UploadContent = () => {
    const onDrop = useCallback((accepted: File[]) => {
      const f = accepted[0];
      if (f) uploadFile(f);
    }, [uploadFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
      maxFiles: 1,
      disabled: loading,
    });

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Instrucciones</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• El archivo debe estar en formato Excel (.xlsx)</li>
            <li>• La primera fila debe contener los encabezados de columna</li>
            <li>• Use la plantilla descargable para el formato correcto</li>
          </ul>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10'
              : 'border-border-medium dark:border-border-dark hover:border-brand-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {loading ? (
            <div className="space-y-3">
              <RotateCw className="w-12 h-12 mx-auto text-brand-500 animate-spin" />
              <p className="text-text-secondary">Procesando archivo...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-12 h-12 mx-auto text-text-tertiary" />
              <div>
                <p className="text-text-primary font-medium">Arrastra el archivo Excel aquí</p>
                <p className="text-sm text-text-tertiary">o haz clic para seleccionar</p>
              </div>
              <p className="text-xs text-text-tertiary">Formato: .xlsx</p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={downloadTemplate} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Descargar Plantilla
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Step 3: Preview ─────────────────────────────────────────
  const renderPreview = () => {
    if (!preview) return null;
    const invalidCount = preview.rows.filter(r => r.errors.length > 0).length;
    const validCount = preview.rows.length - invalidCount;
    // ponytail: duplicate count derived inline, no extra state
    const duplicateCount = preview.duplicates?.length ?? 0;

    return (
      <div className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg p-3 text-center border border-border-light dark:border-border-dark">
            <div className="text-2xl font-bold text-text-primary">{preview.rows.length}</div>
            <div className="text-xs text-text-tertiary">Total</div>
          </div>
          <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-success-600">{validCount}</div>
            <div className="text-xs text-success-600">Válidos</div>
          </div>
          <div className="bg-error-50 dark:bg-error-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-error-600">{invalidCount}</div>
            <div className="text-xs text-error-600">Inválidos</div>
          </div>
          <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-warning-600">{duplicateCount}</div>
            <div className="text-xs text-warning-600">Duplicados</div>
          </div>
        </div>

        {/* Warning for invalid rows */}
        {invalidCount > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Hay <strong>{invalidCount} filas</strong> con errores. Se importarán solo las válidas.
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        {preview.rows.length > 0 && (
          <div className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden max-h-[400px] overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead className="bg-bg-secondary/50 dark:bg-white/5 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-text-secondary">#</th>
                  {preview.columns.map(col => (
                    <th key={col} className="px-3 py-2 text-left font-semibold text-text-secondary">{col}</th>
                  ))}
                  <th className="px-3 py-2 text-left font-semibold text-text-secondary">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {preview.rows.slice(0, 100).map(row => (
                  <tr
                    key={row.row}
                    className={row.errors.length > 0
                      ? 'bg-red-50/50 dark:bg-red-900/10'
                      : row.warnings.length > 0
                        ? 'bg-yellow-50/50 dark:bg-yellow-900/10'
                        : ''
                    }
                    title={row.errors.join(', ') || row.warnings.join(', ') || ''}
                  >
                    <td className="px-3 py-2 text-text-tertiary">{row.row}</td>
                    {preview.columns.map(col => (
                      <td key={col} className="px-3 py-2 text-text-primary">{row.data[col] ?? ''}</td>
                    ))}
                    <td className="px-3 py-2">
                      {row.errors.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-error-600" title={row.errors.join(', ')}>
                          <XCircle className="w-3.5 h-3.5" />
                          Error
                        </span>
                      ) : row.warnings.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-warning-600" title={row.warnings.join(', ')}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Advertencia
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-success-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Válido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 100 && (
              <div className="px-3 py-2 text-center text-sm text-text-tertiary bg-bg-secondary/50">
                Mostrando 100 de {preview.rows.length} filas
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Step 4: Confirm ─────────────────────────────────────────
  const renderConfirm = () => {
    if (!preview || !type) return null;
    const validCount = preview.rows.filter(r => r.errors.length === 0).length;

    return (
      <div className="space-y-6 max-w-lg mx-auto py-4">
        <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-800 rounded-lg p-6 text-center">
          <FileSpreadsheet className="w-10 h-10 mx-auto text-brand-500 mb-3" />
          <h3 className="text-lg font-semibold text-text-primary">Confirmar Importación</h3>
          <p className="text-3xl font-bold text-brand-600 mt-2">{validCount}</p>
          <p className="text-sm text-text-tertiary">
            {TYPE_LABELS[type].toLowerCase()} serán importados
          </p>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-bg-secondary/50 cursor-pointer">
            <div>
              <p className="font-medium text-text-primary">Saltar duplicados</p>
              <p className="text-xs text-text-tertiary">No importar registros existentes</p>
            </div>
            <input
              type="checkbox"
              checked={options.skipDuplicates}
              onChange={e => setOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
              className="w-5 h-5 rounded border-border-medium text-brand-500 focus:ring-brand-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-bg-secondary/50 cursor-pointer">
            <div>
              <p className="font-medium text-text-primary">Actualizar existentes</p>
              <p className="text-xs text-text-tertiary">Actualizar datos si el registro ya existe</p>
            </div>
            <input
              type="checkbox"
              checked={options.updateExisting}
              onChange={e => setOptions(prev => ({ ...prev, updateExisting: e.target.checked }))}
              className="w-5 h-5 rounded border-border-medium text-brand-500 focus:ring-brand-500"
            />
          </label>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Step 5: Results ─────────────────────────────────────────
  const renderResults = () => {
    if (!results) return null;
    const hasErrors = results.errors > 0;

    return (
      <div className="space-y-4">
        <div className={`p-6 rounded-lg border ${hasErrors ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-300' : 'bg-success-50 dark:bg-success-900/20 border-success-300'}`}>
          <div className="flex items-center gap-3">
            {hasErrors ? (
              <AlertTriangle className="w-8 h-8 text-warning-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-success-600" />
            )}
            <div>
              <h4 className="font-semibold text-lg text-text-primary">
                Importación {hasErrors ? 'Completada con Errores' : 'Exitosa'}
              </h4>
              <div className="flex gap-4 mt-1 text-sm">
                <span className="text-success-600 font-medium">✅ {results.inserted} insertados</span>
                <span className="text-warning-600 font-medium">🔄 {results.updated} actualizados</span>
                <span className="text-error-600 font-medium">❌ {results.errors} errores</span>
              </div>
            </div>
          </div>
        </div>

        {results.details.length > 0 && (
          <div className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary/50 dark:bg-white/5 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Fila</th>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Estado</th>
                  <th className="px-3 py-2 text-left font-medium text-text-secondary">Mensaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {results.details.map((d, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-text-tertiary">{d.row}</td>
                    <td className="px-3 py-2">
                      {d.status === 'inserted' && <Badge color="success" variant="solid">Insertado</Badge>}
                      {d.status === 'updated' && <Badge color="warning" variant="solid">Actualizado</Badge>}
                      {d.status === 'error' && <Badge color="error" variant="solid">Error</Badge>}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">{d.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────
  const stepTitle = step === 'select-type' ? 'Importación Masiva' :
    step === 'upload' ? `Importar ${type ? TYPE_LABELS[type] : ''}` :
    step === 'preview' ? 'Vista Previa' :
    step === 'confirm' ? 'Confirmar Importación' : 'Resultados';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="3xl">
      <ModalHeader>
        <div className="flex items-center gap-3">
          {step !== 'select-type' && (
            <button onClick={() => reset()} className="p-1 rounded hover:bg-bg-secondary transition-colors" title="Volver">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
          )}
          <FileSpreadsheet className="w-6 h-6 text-brand-500" />
          <span>{stepTitle}</span>
        </div>
      </ModalHeader>

      <ModalBody>
        {step === 'select-type' && renderSelectType()}
        {step === 'upload' && <UploadContent />}
        {step === 'preview' && renderPreview()}
        {step === 'confirm' && renderConfirm()}
        {step === 'results' && renderResults()}
      </ModalBody>

      <ModalFooter>
        {step === 'select-type' && (
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
        )}
        {step === 'upload' && (
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
        )}
        {step === 'preview' && (
          <>
            <Button variant="ghost" onClick={() => { reset(); selectType(type!); }}>
              Volver a subir
            </Button>
            <Button
              variant="primary"
              onClick={() => setOptions(prev => ({ ...prev })) /* trigger re-render */ }
              className="hidden"
            >
              ‍
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep('confirm')}
              disabled={preview?.rows.filter(r => r.errors.length === 0).length === 0}
            >
              Continuar
            </Button>
          </>
        )}
        {step === 'confirm' && (
          <>
            <Button variant="ghost" onClick={() => setStep('preview')}>Atrás</Button>
            <Button variant="primary" onClick={confirmImport} loading={loading} loadingText="Importando...">
              Confirmar Importación
            </Button>
          </>
        )}
        {step === 'results' && (
          <>
            <Button variant="ghost" onClick={reset}>Nueva Importación</Button>
            <Button variant="primary" onClick={handleClose}>Cerrar</Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default BulkImportModal;
