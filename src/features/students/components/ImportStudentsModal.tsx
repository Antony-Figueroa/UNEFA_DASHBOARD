/**
 * @file ImportStudentsModal.tsx
 * @description Modal para importación masiva de estudiantes desde archivo Excel.
 * 
 * @module features/students/components
 */

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileTextIcon,
  RotateCw,
  X,
  Edit2
} from "lucide-react";
import Button from "../../../components/ui/button/Button";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from "../../../components/ui/modal";
import Badge from "../../../components/ui/badge/Badge";
import {
  validateImport,
  validateImportJson,
  executeImportJson,
  downloadTemplate,
  autoFormatRow,
  ImportValidationRow,
  ImportExecuteResponse
} from "../services/studentsService";

/** Estados del proceso de importación */
type ImportStep = "upload" | "preview" | "editing" | "executing" | "result";

/** Estados de fila en la preview */
type RowStatus = "valid" | "warning" | "error";

/** Propiedades del componente ImportStudentsModal */
interface ImportStudentsModalProps {
  /** Indica si el modal está abierto */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Función llamada después de una importación exitosa */
  onImportComplete?: (created: number, updated: number) => void;
}

/**
 * Modal para importar estudiantes desde Excel.
 * Mantiene consistencia con el sistema de diseño del proyecto.
 */
export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  // Estado del proceso
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [validationRows, setValidationRows] = useState<ImportValidationRow[]>([]);
  const [importResult, setImportResult] = useState<ImportExecuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  
  // Loading states
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Resumen
  const summary = {
    total: validationRows.length,
    valid: validationRows.filter(r => r.status === "valid").length,
    warning: validationRows.filter(r => r.status === "warning").length,
    error: validationRows.filter(r => r.status === "error").length
  };

  const hasErrors = summary.error > 0;
  const hasWarnings = summary.warning > 0;
  const canProceed = summary.total > 0 && !hasErrors;

  // Handlers
  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    const excelFile = acceptedFiles[0];
    if (!excelFile) return;

    setFile(excelFile);
    setError(null);
    setIsValidating(true);
    // nos quedamos en "upload" con el spinner del dropzone hasta que termine

    try {
      const result = await validateImport(excelFile);
      
      if (!result.valid) {
        setError(result.rows.length === 0 
          ? "No se pudo procesar el archivo" 
          : "El archivo contiene errores");
      }
      
      setValidationRows(result.rows);
      setStep("preview");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError("Error al validar el archivo: " + message);
      // se queda en "upload" con el error visible
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (validationRows.length === 0) return;

    setIsExecuting(true);
    setStep("executing");

    try {
      const confirmed = hasWarnings;
      const rawRows = validationRows.map(r => r.originalRow).filter(Boolean);
      if (rawRows.length === 0) {
        setError("No hay datos válidos para importar");
        setStep("upload");
        return;
      }
      const result = await executeImportJson(rawRows, confirmed);
      
      setImportResult(result);
      setStep("result");
      
      if (result.success && onImportComplete) {
        onImportComplete(result.created, result.updated);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError("Error al importar: " + message);
      setStep("preview");
    } finally {
      setIsExecuting(false);
    }
  }, [validationRows, hasWarnings, onImportComplete]);

  const handleSaveEdit = async (updatedRow: any) => {
    setIsValidating(true);
    setError(null);
    try {
      const rawRows = validationRows
        .map(r => r.rowNumber === updatedRow.rowNumber ? updatedRow : r.originalRow)
        .filter(Boolean);
      const result = await validateImportJson(rawRows);
      
      if (!result.valid && result.rows.length === 0) {
        setError("Error al validar datos");
      }
      
      setValidationRows(result.rows);
      setStep('preview');
      setEditingRow(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError("Error al re-validar: " + message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAutoFix = async () => {
    if (!editingRow) return;
    setIsValidating(true);
    setError(null);
    try {
      const result = await autoFormatRow(editingRow);
      setEditingRow(result.row);
      // Mostrar la validación resultante en los mensajes
      if (result.validation?.messages?.length > 0) {
        setError(result.validation.messages.join(", "));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError("Error al auto-corregir: " + message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownloadTemplate = useCallback(async () => {
    setIsDownloading(true);
    
    try {
      const blob = await downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_estudiantes.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading template:", err);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setValidationRows([]);
    setImportResult(null);
    setError(null);
    setEditingRow(null);
    setStep("upload");
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  // Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"]
    },
    maxFiles: 1,
    disabled: isValidating || isExecuting
  });

  // Render helpers
  const getStatusBadge = (status: RowStatus) => {
    switch (status) {
      case "valid":
        return <Badge color="success" variant="solid">Válido</Badge>;
      case "warning":
        return <Badge color="warning" variant="solid">Advertencia</Badge>;
      case "error":
        return <Badge color="error" variant="solid">Error</Badge>;
    }
  };

  const formatMessage = (messages: string[]) => {
    if (messages.length === 0) return "-";
    if (messages.length === 1) return messages[0];
    return messages.join(", ");
  };

  // Render step: upload
  const renderUpload = () => (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Instrucciones
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• El archivo debe estar en formato Excel (.xlsx o .xls)</li>
          <li>• La primera fila debe contener los encabezados de columna</li>
          <li>• Use la plantilla descargable para el formato correcto</li>
        </ul>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-gray-300 dark:border-gray-600 hover:border-primary"
          }
          ${isValidating || isExecuting ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        
        {isValidating ? (
          <div className="space-y-3">
            <RotateCw className="w-12 h-12 mx-auto text-primary animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">
              Validando archivo...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Download className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Arrastra el archivo Excel aquí
              </p>
              <p className="text-sm text-gray-500">
                o haz clic para seleccionar
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Formatos: .xlsx, .xls (máx. 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Botón descargar plantilla */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadTemplate}
          disabled={isDownloading}
          className="text-primary"
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar Plantilla
        </Button>
      </div>

      {/* Error message */}
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

  // Render step: preview
  const renderPreview = () => (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary.total}
          </div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {summary.valid}
          </div>
          <div className="text-xs text-green-600">Válidos</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {summary.warning}
          </div>
          <div className="text-xs text-yellow-600">Advertencias</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">
            {summary.error}
          </div>
          <div className="text-xs text-red-600">Errores</div>
        </div>
      </div>

      {/* Warning banner */}
      {hasWarnings && !hasErrors && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Advertencias detectadas
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Existen {summary.warning} estudiante(s) que podrían tener duplicados.
                ¿Desea continuar de todas formas?
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de preview con más datos */}
      {validationRows.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
                    <table className="w-full text-xs min-w-[900px]">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">#</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Cédula</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Nombre Completo</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Sexo</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Nacimiento</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Email</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Estado</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {validationRows.slice(0, 100).map((row, idx) => (
                <tr key={idx} className={`
                  ${row.status === "error" ? "bg-red-50 dark:bg-red-900/10" : ""}
                  ${row.status === "warning" ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}
                  ${row.status === "valid" ? "bg-green-50/30" : ""}
                `}>
                  <td className="px-2 py-2 text-gray-500">{row.rowNumber}</td>
                  <td className="px-2 py-2 font-mono whitespace-nowrap">{row.cedula || ''}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{row.fullName || ''}</td>
                  <td className="px-2 py-2">{row.sexo || ''}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{row.birthDate || ''}</td>
                  <td className="px-2 py-2 max-w-[200px] truncate" title={row.email}>{row.email || ''}</td>
                  <td className="px-2 py-2">{getStatusBadge(row.status)}</td>
                  <td className="px-2 py-2 text-right">
                    {(row.status === 'error' || row.status === 'warning') && row.originalRow && (
                      <button 
                        onClick={() => { setEditingRow(row.originalRow); setStep('editing'); }}
                        className="text-primary hover:text-primary-focus inline-flex items-center gap-1 text-xs"
                      >
                        <Edit2 className="w-3 h-3" /> Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {validationRows.length > 100 && (
            <div className="px-3 py-2 text-center text-sm text-gray-500 bg-gray-50 dark:bg-gray-800">
              Mostrando 100 de {validationRows.length} filas
            </div>
          )}
        </div>
      </div>
    )}

      {/* Error display */}
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

  const renderEditing = () => {
    if (!editingRow) return null;
    
    // Encontrar los mensajes de error de esta fila para mostrarlos
    const rowValidation = validationRows.find(r => r.rowNumber === editingRow.rowNumber);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Corregir Fila {editingRow.rowNumber}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => { setStep('preview'); setEditingRow(null); }}>
            Volver
          </Button>
        </div>
        
        {rowValidation && rowValidation.messages.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-700 dark:text-red-300">
            <p className="font-semibold mb-1">Problemas detectados:</p>
            <ul className="list-disc pl-5 space-y-1">
              {rowValidation.messages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAutoFix}
            disabled={isValidating}
            className="flex items-center gap-1"
          >
            {isValidating ? (
              <>
                <RotateCw className="w-3 h-3 animate-spin" />
                Corrigiendo...
              </>
            ) : (
              <>
                <RotateCw className="w-3 h-3" />
                Auto-corregir
              </>
            )}
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Formatea: cédula, nombres, email, fechas, teléfonos y listas desplegables
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cédula Prefijo</label>
            <select
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              value={editingRow.cedulaPrefix || 'V'}
              onChange={e => setEditingRow({...editingRow, cedulaPrefix: e.target.value})}
            >
              <option value="V">V</option>
              <option value="E">E</option>
              <option value="J">J</option>
              <option value="P">P</option>
              <option value="G">G</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cédula Número</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              value={editingRow.cedulaNumber || ''}
              onChange={e => setEditingRow({...editingRow, cedulaNumber: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Primer Nombre</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              value={editingRow.firstName || ''}
              onChange={e => setEditingRow({...editingRow, firstName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Segundo Nombre</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              value={editingRow.middleName || ''}
              onChange={e => setEditingRow({...editingRow, middleName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Primer Apellido</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              value={editingRow.lastName || ''}
              onChange={e => setEditingRow({...editingRow, lastName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Segundo Apellido</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              value={editingRow.secondLastName || ''}
              onChange={e => setEditingRow({...editingRow, secondLastName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Sexo (M/F)</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              value={editingRow.sex || ''}
              onChange={e => setEditingRow({...editingRow, sex: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fecha Nacimiento</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="YYYY-MM-DD"
              value={editingRow.birthDate || ''}
              onChange={e => setEditingRow({...editingRow, birthDate: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Estado Civil</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="Soltero, Casado..."
              value={editingRow.civilStatus || ''}
              onChange={e => setEditingRow({...editingRow, civilStatus: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Correo Electrónico</label>
            <input
              type="email"
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              value={editingRow.email || ''}
              onChange={e => setEditingRow({...editingRow, email: e.target.value})}
            />
          </div>

          <div className="flex gap-2">
            <div className="w-1/3">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Pref. Telf</label>
              <input
                className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                placeholder="0412"
                value={editingRow.phonePrefix || ''}
                onChange={e => setEditingRow({...editingRow, phonePrefix: e.target.value})}
              />
            </div>
            <div className="w-2/3">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Teléfono</label>
              <input
                className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                placeholder="1234567"
                value={editingRow.phoneNumber || ''}
                onChange={e => setEditingRow({...editingRow, phoneNumber: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo Estudiante</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="CIV, MIL..."
              value={editingRow.studentType || ''}
              onChange={e => setEditingRow({...editingRow, studentType: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Rango Militar</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="(Opcional)"
              value={editingRow.militaryRank || ''}
              onChange={e => setEditingRow({...editingRow, militaryRank: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Trabaja (SI/NO)</label>
            <input
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              value={editingRow.works || ''}
              onChange={e => setEditingRow({...editingRow, works: e.target.value})}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Dirección</label>
            <textarea
              rows={2}
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white resize-none"
              value={editingRow.address || ''}
              onChange={e => setEditingRow({...editingRow, address: e.target.value})}
            />
          </div>
        </div>
      </div>
    );
  };

  // Render step: result
  const renderResult = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className={`
          p-4 rounded-lg border
          ${importResult.success 
            ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" 
            : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
          }
        `}>
          <div className="flex items-center gap-3">
            {importResult.success ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h4 className="font-semibold text-lg">
                {importResult.success ? "Importación Completada" : "Importación Con Errores"}
              </h4>
              <p className="text-sm">
                Creados: {importResult.created} | 
                Actualizados: {importResult.updated} | 
                Errores: {importResult.failed}
              </p>
            </div>
          </div>
        </div>

        {/* Results table */}
        {importResult.results.length > 0 && (
          <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                  <th className="px-3 py-2 text-left font-medium">Mensaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {importResult.results.slice(0, 50).map((r, idx) => {
                  // Backend devuelve status 'valid'/'warning'/'error':
                  // valid → created (si no existía) o updated (si existía)
                  // warning → no se importó (requería confirmación)
                  // error → falló la importación
                  const isCreated = r.status === 'valid' && !r.existingStudent;
                  const isUpdated = r.status === 'valid' && r.existingStudent;
                  const isSkipped = r.status === 'warning';
                  return (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-gray-500">{r.rowNumber}</td>
                    <td className="px-3 py-2">
                      {isCreated && <Badge color="success" variant="solid">Creado</Badge>}
                      {isUpdated && <Badge color="warning" variant="solid">Actualizado</Badge>}
                      {isSkipped && <Badge color="warning" variant="solid">Sin importar</Badge>}
                      {r.status === "error" && <Badge color="error" variant="solid">Error</Badge>}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {r.messages?.join(', ') || r.fullName || ''}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
    >
      <ModalHeader>
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-primary" />
          <span>Importar Estudiantes</span>
        </div>
      </ModalHeader>

      <ModalBody>
        {step === "upload" && renderUpload()}
        {step === "preview" && renderPreview()}
        {step === "editing" && renderEditing()}
        {step === "executing" && (
          <div className="text-center py-8">
            <RotateCw className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-gray-600">Importando estudiantes...</p>
          </div>
        )}
        {step === "result" && renderResult()}
      </ModalBody>

      <ModalFooter>
        {step === "upload" && (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
          </>
        )}

        {step === "preview" && (
          <>
            <Button variant="ghost" onClick={handleReset}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmImport}
              disabled={!canProceed || isExecuting}
            >
              {hasWarnings ? "Importar con Advertencias" : "Importar"}
            </Button>
          </>
        )}

        {step === "editing" && (
          <Button 
            variant="primary" 
            onClick={() => handleSaveEdit(editingRow)}
            disabled={isValidating}
          >
            {isValidating ? (
              <><RotateCw className="w-4 h-4 mr-2 animate-spin" /> Validando...</>
            ) : "Guardar y Validar"}
          </Button>
        )}

        {step === "result" && (
          <Button variant="primary" onClick={handleClose}>
            Cerrar
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default ImportStudentsModal;