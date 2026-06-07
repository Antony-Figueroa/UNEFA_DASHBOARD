import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import { prospectsService } from "../services/prospectsService";
import toast from "react-hot-toast";

interface ImportRow {
  rowIndex: number;
  ci: string;
  name: string;
}

interface ImportButtonProps {
  listId: number;
  periodId?: number;
  onImportComplete: () => void;
}

export function ImportButton({ listId, periodId, onImportComplete }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

      if (json.length === 0) {
        toast.error("El archivo no contiene datos");
        return;
      }

      const rows: ImportRow[] = json.map((row, i) => ({
        rowIndex: i + 1,
        ci: String(
          row.ci || row.CI || row.Cédula || row.Cedula || row.cedula ||
          row.identificacion || row.identification || Object.values(row)[0] || ""
        ),
        name: String(
          row.nombre || row.Nombre || row.name || row.Name ||
          row.nombres || row.Nombres || Object.values(row)[1] || ""
        ),
      }));

      setParsedRows(rows);
      setShowPreview(true);
    } catch (error) {
      toast.error("Error al leer el archivo. Asegurate de que sea un .xlsx o .csv válido.");
      console.error("[ImportButton] Error parsing file:", error);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    const matchedIds: number[] = [];
    let notFound = 0;

    try {
      for (const row of parsedRows) {
        if (!row.ci) {
          notFound++;
          continue;
        }
        try {
          const { data: results } = await prospectsService.getEligibleStudents({
            search: row.ci,
            periodId,
            limit: 5,
          });
          const match = results.find(
            (s) =>
              s.studentCi === row.ci ||
              s.identificationNumber === row.ci ||
              `${s.identificationPrefix}-${s.identificationNumber}` === row.ci
          );
          if (match) {
            matchedIds.push(match.studentsId);
          } else {
            notFound++;
          }
        } catch {
          notFound++;
        }
      }

      if (matchedIds.length === 0) {
        toast.error("No se encontraron estudiantes para importar");
        return;
      }

      await prospectsService.bulkAddListItems(listId, matchedIds);

      toast.success(
        `${matchedIds.length} estudiante${matchedIds.length !== 1 ? "s" : ""} importado${matchedIds.length !== 1 ? "s" : ""}${notFound > 0 ? `, ${notFound} omitido${notFound !== 1 ? "s" : ""} (no encontrados)` : ""}`
      );

      setShowPreview(false);
      onImportComplete();
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al importar estudiantes";
      toast.error(message);
      console.error("[ImportButton] Error importing:", error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
        Importar Excel
      </Button>

      <Modal isOpen={showPreview} onClose={() => !importing && setShowPreview(false)} size="lg">
        <ModalHeader>Vista previa de importación</ModalHeader>
        <ModalBody>
          <p className="text-sm text-text-secondary mb-4">
            Se encontraron {parsedRows.length} filas en el archivo. Al confirmar se buscarán los estudiantes por CI
            para agregarlos a la lista.
          </p>
          <div className="max-h-64 overflow-y-auto border border-border-light dark:border-border-dark rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/5 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-text-tertiary uppercase tracking-wider">N°</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-text-tertiary uppercase tracking-wider">CI</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-text-tertiary uppercase tracking-wider">Nombre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {parsedRows.map((row) => (
                  <tr key={row.rowIndex} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-3 py-2 text-text-tertiary">{row.rowIndex}</td>
                    <td className="px-3 py-2 font-mono text-sm">{row.ci || "—"}</td>
                    <td className="px-3 py-2 text-sm">{row.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowPreview(false)} disabled={importing}>
            Cancelar
          </Button>
          <AsyncButton variant="primary" onClick={handleConfirmImport} loading={importing}>
            Importar {parsedRows.length} estudiante{parsedRows.length !== 1 ? "s" : ""}
          </AsyncButton>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default ImportButton;
