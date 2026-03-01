import { useState, useRef } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { importFromExcel, validateExcelHeaders } from "../../utils/excel";
import { useToast } from "../../context/toast";
import { DownloadIcon, FileIcon } from "../../icons";
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, unknown>[]) => Promise<void>;
  requiredHeaders?: string[];
  templateData?: Record<string, unknown>[];
  title?: string;
}

const DEFAULT_REQUIRED_HEADERS = [
  "identificationPrefix",
  "identificationNumber",
  "firstName",
  "lastName",
  "sex",
  "birthDate",
  "phone",
  "email",
  "careerId",
  "regime"
];

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImport,
  requiredHeaders = DEFAULT_REQUIRED_HEADERS,
  templateData,
  title = "Importar desde Excel"
}: ExcelImportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, headers: fileHeaders } = await importFromExcel(file);
      setHeaders(fileHeaders);
      setPreviewData(data.slice(0, 5));

      const validation = validateExcelHeaders(fileHeaders, requiredHeaders);
      if (!validation.valid) {
        setError(`Faltan columnas requeridas: ${validation.missing.join(", ")}`);
      }
    } catch (err) {
      setError("Error al leer el archivo. Asegúrese que sea un archivo Excel válido.");
      console.error("[ExcelImportModal] Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewData || error) return;

    setIsLoading(true);
    try {
      await onImport(previewData);
      addToast({
        variant: "success",
        title: "Importación exitosa",
        message: `Se importaron ${previewData.length} registros`
      });
      handleClose();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Error",
        message: "Error al importar los datos"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPreviewData(null);
    setHeaders([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const downloadTemplate = () => {
    if (!templateData || templateData.length === 0) return;
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    XLSX.writeFile(workbook, "plantilla_estudiantes.xlsx");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader>
        <div className="w-full">
          <span className="font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90">
            {title}
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal mt-1">
            Seleccione un archivo Excel (.xlsx) para importar datos
          </p>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-file-input"
            />
            <label
              htmlFor="excel-file-input"
              className="cursor-pointer flex flex-col items-center"
            >
              <FileIcon className="w-12 h-12 text-gray-400 mb-3" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Haga clic para seleccionar un archivo
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Archivos permitidos: .xlsx, .xls
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {previewData && previewData.length > 0 && !error && (
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">
                Vista previa ({previewData.length} registros encontrados):
              </p>
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {headers.map((header, idx) => (
                        <th key={idx} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {headers.map((header, hidx) => (
                          <td key={hidx} className="px-3 py-2 text-gray-700 dark:text-gray-300">
                            {String(row[header] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              startIcon={<DownloadIcon className="w-4 h-4" />}
            >
              Descargar Plantilla
            </Button>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancelar
        </button>
        <Button
          onClick={handleImport}
          disabled={!previewData || !!error || isLoading}
          loading={isLoading}
        >
          Importar Datos
        </Button>
      </ModalFooter>
    </Modal>
  );
}
