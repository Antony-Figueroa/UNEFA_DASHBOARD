import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { prospectsService } from "../services/prospectsService";
import { useToast } from "@/context/toast";
import { TOAST } from "@/components/ui/dialog/DialogConfig";

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
  const { addToast } = useToast();
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
        addToast({ variant: "error", title: "Sin datos", message: "El archivo no contiene datos" });
        return;
      }

      const rows: ImportRow[] = json.map((row, i) => ({
        rowIndex: i + 1,
        ci: String(
          row.ci || row.CI || row.cedula || row.Cedula ||
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
      addToast({ variant: "error", title: "Error al leer", message: "Error al leer el archivo. Asegurate de que sea un .xlsx o .csv válido." });
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
        addToast({ variant: "error", title: "Sin resultados", message: "No se encontraron estudiantes para importar" });
        return;
      }

      await prospectsService.bulkAddListItems(listId, matchedIds);

      addToast({ variant: "success", title: "Importado", message: `${matchedIds.length} estudiante${matchedIds.length !== 1 ? "s" : ""} importado${matchedIds.length !== 1 ? "s" : ""}${notFound > 0 ? `, ${notFound} omitido${notFound !== 1 ? "s" : ""} (no encontrados)` : ""}` });

      setShowPreview(false);
      onImportComplete();
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al importar estudiantes";
      addToast({ variant: "error", title: "Error al importar", message });
      console.error("[ImportButton] Error importing:", error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        size="sm"
      >
        Importar
      </Button>

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} size="lg">
        <ModalHeader>
          <h3>Vista previa de importación</h3>
        </ModalHeader>
        <ModalBody>
          {parsedRows.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No se pudieron leer datos del archivo.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">CI</th>
                    <th className="text-left py-2 px-3">Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr key={row.rowIndex} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3">{row.rowIndex}</td>
                      <td className="py-2 px-3">{row.ci}</td>
                      <td className="py-2 px-3">{row.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowPreview(false)}>Cancelar</Button>
          <Button onClick={handleConfirmImport} disabled={importing || parsedRows.length === 0}>
            {importing ? "Importando..." : `Importar ${parsedRows.length} registro${parsedRows.length !== 1 ? "s" : ""}`}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default ImportButton;
