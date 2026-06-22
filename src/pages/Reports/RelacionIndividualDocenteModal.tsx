import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/modal";
import { FileIcon, ListIcon, DownloadIcon } from "../../icons";
import CustomSelect from "../../components/form/CustomSelect";
import { getPeriods } from "../../features/periods/services/periodService";
import { reportsService, TutorSearchResult } from "../../features/reports/services/reportsService";
import { generateRelacionIndividualDocenteExcel } from "../../utils/unefaExcelReports";
import { XIcon } from "lucide-react";

interface RelacionIndividualDocenteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RelacionIndividualDocenteModal({ isOpen, onClose }: RelacionIndividualDocenteModalProps) {
  const [periods, setPeriods] = useState<{ value: string; label: string; periodId: string }[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState<string>("");
  const [tutorSearch, setTutorSearch] = useState("");
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [tutorName, setTutorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const tutorOptions = tutors.map(t => ({
    value: String(t.tutorId),
    label: `${t.fullName} — CI: ${t.ci}`,
  }));

  // Load periods on open
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const periodList = await getPeriods();
        setPeriods((periodList || []).map(p => ({
          value: p.periodId,
          label: p.description,
          periodId: p.periodId,
        })));
      } catch {
        toast.error("Error al cargar períodos");
      }
    })();
  }, [isOpen]);

  // Search tutors with debounce
  const searchTutors = useCallback(async (q: string) => {
    try {
      const res = await reportsService.listTutors(0, 100, q);
      setTutors(res?.data || []);
    } catch {
      // silent
    }
  }, []);

  // Load initial tutors on open
  useEffect(() => {
    if (!isOpen) return;
    searchTutors("");
  }, [isOpen, searchTutors]);

  // Debounced search
  const handleTutorSearchChange = (val: string) => {
    setTutorSearch(val);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => searchTutors(val), 300);
    setSearchTimer(timer);
  };

  // Fetch data when tutor + period selected
  const fetchData = useCallback(async () => {
    if (!selectedTutorId) return;
    const tutorId = parseInt(selectedTutorId);
    const periodId = selectedPeriodId ? parseInt(selectedPeriodId) : undefined;
    setFetching(true);
    try {
      const res = await reportsService.getRelacionIndividualDocente(tutorId);
      setData(res?.data || []);
      setTutorName(res?.tutorName || "");
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setFetching(false);
    }
  }, [selectedTutorId, selectedPeriodId]);

  useEffect(() => {
    if (selectedTutorId) fetchData();
  }, [selectedTutorId, selectedPeriodId, fetchData]);

  const handleExport = async () => {
    if (data.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    setIsExporting(true);
    try {
      const periodLabel = periods.find(p => p.periodId === selectedPeriodId)?.label || "Todos";
      await generateRelacionIndividualDocenteExcel(data, periodLabel, tutorName, `relacion-individual-docente-${tutorName || selectedTutorId}`);
      toast.success("Reporte exportado exitosamente");
    } catch {
      toast.error("Error al exportar");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" className="p-0">
      <div className="flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Relación Individual del Docente
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Config panel */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-56">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                Período
              </label>
              <CustomSelect
                options={periods}
                value={selectedPeriodId}
                onChange={setSelectedPeriodId}
                placeholder="Todos los períodos"
              />
            </div>
            <div className="w-72">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                Tutor Académico
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar tutor..."
                  value={tutorSearch}
                  onChange={e => handleTutorSearchChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>
              <select
                value={selectedTutorId}
                onChange={e => setSelectedTutorId(e.target.value)}
                className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                size={4}
              >
                {tutorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting || data.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              <DownloadIcon className="w-4 h-4" />
              {isExporting ? "Exportando..." : "Exportar Excel"}
            </button>
          </div>
        </div>

        {/* Preview table */}
        <div className="flex-1 overflow-auto p-6">
          {fetching ? (
            <div className="flex items-center justify-center h-32 text-gray-400">Cargando...</div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              {selectedTutorId ? "Sin datos para el tutor y período seleccionados" : "Seleccioná un tutor académico"}
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-2 py-2 border text-center w-10">N°</th>
                  <th className="px-2 py-2 border">Región</th>
                  <th className="px-2 py-2 border">Núcleo</th>
                  <th className="px-2 py-2 border">Extensión</th>
                  <th className="px-2 py-2 border">Carrera</th>
                  <th className="px-2 py-2 border">Est. Nombre</th>
                  <th className="px-2 py-2 border">Est. Apellido</th>
                  <th className="px-2 py-2 border">Cédula</th>
                  <th className="px-2 py-2 border">Sexo</th>
                  <th className="px-2 py-2 border">Tipo</th>
                  <th className="px-2 py-2 border">Teléfono</th>
                  <th className="px-2 py-2 border">Inst. Nombre</th>
                  <th className="px-2 py-2 border">Inst. Tipo</th>
                  <th className="px-2 py-2 border">Tut. Nombre</th>
                  <th className="px-2 py-2 border">Tut. Apellido</th>
                  <th className="px-2 py-2 border">Tut. CI</th>
                  <th className="px-2 py-2 border">Tut. Cargo</th>
                  <th className="px-2 py-2 border">Dirección</th>
                  <th className="px-2 py-2 border">Observ.</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any) => (
                  <tr key={row.nro} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-2 py-1 border text-center">{row.nro}</td>
                    <td className="px-2 py-1 border">{row.region}</td>
                    <td className="px-2 py-1 border">{row.nucleo}</td>
                    <td className="px-2 py-1 border">{row.extension}</td>
                    <td className="px-2 py-1 border">{row.carrera}</td>
                    <td className="px-2 py-1 border">{row.estudiante?.nombre || ''}</td>
                    <td className="px-2 py-1 border">{row.estudiante?.apellido || ''}</td>
                    <td className="px-2 py-1 border">{row.estudiante?.ci || ''}</td>
                    <td className="px-2 py-1 border">{row.estudiante?.sexo || ''}</td>
                    <td className="px-2 py-1 border">{row.estudiante?.tipo || ''}</td>
                    <td className="px-2 py-1 border">{row.estudiante?.telefono || ''}</td>
                    <td className="px-2 py-1 border">{row.institucion?.nombre || ''}</td>
                    <td className="px-2 py-1 border">{row.institucion?.tipo || ''}</td>
                    <td className="px-2 py-1 border">{row.tutorInstitucional?.nombre || ''}</td>
                    <td className="px-2 py-1 border">{row.tutorInstitucional?.apellido || ''}</td>
                    <td className="px-2 py-1 border">{row.tutorInstitucional?.ci || ''}</td>
                    <td className="px-2 py-1 border">{row.tutorInstitucional?.cargo || ''}</td>
                    <td className="px-2 py-1 border">{row.direccion || ''}</td>
                    <td className="px-2 py-1 border">{row.observaciones || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default RelacionIndividualDocenteModal;