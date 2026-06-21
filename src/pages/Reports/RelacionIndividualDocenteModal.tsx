import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/modal";
import AsyncButton from "../../components/ui/button/AsyncButton";
import CustomSelect from "../../components/form/CustomSelect";
import { getTutors } from "../../features/tutors/services/tutorsService";
import { reportsService } from "../../features/reports/services/reportsService";

interface TutorOption {
  value: string;
  label: string;
  tutorId: number;
}

interface RelacionIndividualDocenteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RelacionIndividualDocenteModal({ isOpen, onClose }: RelacionIndividualDocenteModalProps) {
  const [tutors, setTutors] = useState<TutorOption[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadTutors = async () => {
      try {
        setLoading(true);
        const response = await getTutors();
        const tutorList = Array.isArray(response) ? response : (response as any)?.data || [];
        const options = tutorList.map((t: any) => ({
          value: String(t.tutorId || t.id),
          label: `${t.firstName || ""} ${t.lastName || ""} - ${t.identificationNumber || t.cedula || ""}`.trim(),
          tutorId: t.tutorId || t.id,
        }));
        setTutors(options);
      } catch (error) {
        console.error("[RelacionIndividualDocenteModal] Error loading tutors:", error);
        toast.error("Error al cargar lista de tutores");
      } finally {
        setLoading(false);
      }
    };

    loadTutors();
  }, [isOpen]);

  const handleExport = useCallback(async () => {
    if (!selectedTutorId) {
      toast.error("Seleccione un tutor");
      return;
    }

    try {
      setIsExporting(true);
      const tutorId = Number(selectedTutorId);
      const blob = await reportsService.exportReportExcel("relacion-individual-docente", undefined, undefined, undefined, tutorId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relacion_individual_docente_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Reporte exportado exitosamente");
      onClose();
    } catch (error: any) {
      console.error("[RelacionIndividualDocenteModal] Error exporting:", error);
      const msg = error?.response?.data?.message || "Error al exportar el reporte";
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  }, [selectedTutorId, onClose]);

  const handleClose = useCallback(() => {
    setSelectedTutorId("");
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-text-primary dark:text-white">
            Relación Individual Docente
          </h3>
          <p className="text-sm text-text-tertiary mt-1">
            Seleccione un tutor para generar el reporte individual.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
            Tutor
          </label>
          <CustomSelect
            options={[
              { value: "", label: loading ? "Cargando..." : "Seleccione un tutor" },
              ...tutors.map(t => ({ value: t.value, label: t.label })),
            ]}
            value={selectedTutorId}
            onChange={(val) => setSelectedTutorId(val as string)}
            className="w-full"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
          <AsyncButton
            onClick={handleExport}
            disabled={!selectedTutorId}
            loading={isExporting}
          >
            Exportar a Excel
          </AsyncButton>
        </div>
      </div>
    </Modal>
  );
}

export default RelacionIndividualDocenteModal;
