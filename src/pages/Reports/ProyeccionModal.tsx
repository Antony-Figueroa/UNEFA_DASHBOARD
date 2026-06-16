import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/modal";
import { FileIcon, ListIcon, DownloadIcon } from "../../icons";
import CustomSelect from "../../components/form/CustomSelect";
import MultiSelect from "../../components/form/MultiSelect";
import { getPeriods } from "../../features/periods/services/periodService";
import { getCareers } from "../../features/careers/services/careersService";
import { generateProyeccionExcel } from "../../utils/unefaExcelReports";
import { XIcon } from "lucide-react";

interface Career {
  careerId: number;
  careerName: string;
  careerType?: string;
}

interface SelectedCareer {
  careerId: number;
  careerName: string;
  careerType?: string;
  projectedStudents: number;
}

interface ProyeccionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProyeccionModal({ isOpen, onClose }: ProyeccionModalProps) {
  const [periods, setPeriods] = useState<{ value: string; label: string; periodId: string }[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<SelectedCareer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "config">("preview");

  // Load periods and careers when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [periodList, careerList] = await Promise.all([getPeriods(), getCareers()]);

        const periodOptions = (periodList || []).map(p => ({
          value: p.periodId,
          label: p.description,
          periodId: p.periodId
        }));
        setPeriods(periodOptions);

        const careers = Array.isArray(careerList) ? careerList : (careerList as any)?.data || [];
        const careerData = careers.map((c: Career) => ({
          careerId: c.careerId,
          careerName: c.careerName,
          careerType: c.careerType
        }));
        setCareers(careerData);
      } catch (error) {
        console.error("Error loading data for proyeccion:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  // Update selected careers when selection changes
  useEffect(() => {
    const newSelectedCareers: SelectedCareer[] = [];
    selectedCareerIds.forEach(id => {
      const career = careers.find(c => String(c.careerId) === id);
      if (career) {
        const existing = selectedCareers.find(sc => sc.careerId === career.careerId);
        newSelectedCareers.push({
          ...career,
          projectedStudents: existing?.projectedStudents || 0
        });
      }
    });
    setSelectedCareers(newSelectedCareers);
  }, [selectedCareerIds, careers]);

  // Handle projected students change
  const handleProjectedStudentsChange = useCallback((careerId: number, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setSelectedCareers(prev => prev.map(c =>
      c.careerId === careerId ? { ...c, projectedStudents: numValue } : c
    ));
  }, []);

  // Prepare data for Excel export and preview
  const prepareExcelData = useCallback(() => {
    const shortCareers = selectedCareers.filter(c => c.careerType?.toUpperCase() === "CORTA");
    const longCareers = selectedCareers.filter(c => c.careerType?.toUpperCase() !== "CORTA");

    return {
      periodDescription: periods.find(p => p.periodId === selectedPeriodId)?.label || "",
      nuclei: [
        {
          nucleusId: 1,
          name: "NÚCLEO PORTUGUESA",
          region: "PORTUGUESA",
          nucleusType: "",
          extension: "ACARIGUA",
          shortCareers: shortCareers.map(c => ({
            careerId: c.careerId,
            careerName: c.careerName,
            proyectados: c.projectedStudents
          })),
          longCareers: longCareers.map(c => ({
            careerId: c.careerId,
            careerName: c.careerName,
            proyectados: c.projectedStudents
          }))
        }
      ],
      totals: {
        totalShortCareers: shortCareers.length,
        totalLongCareers: longCareers.length,
        totalCareers: selectedCareers.length,
        totalStudents: selectedCareers.reduce((sum, c) => sum + c.projectedStudents, 0)
      }
    };
  }, [selectedCareers, selectedPeriodId, periods]);

  // Prepare preview table data
  const previewTableData = useMemo(() => {
interface PreviewTableRow {
  region: string;
  nucleus: string;
  extension: string;
  shortCareerName: string;
  shortCareerCount: number | string;
  longCareerName: string;
  longCareerCount: number | string;
}

  const data: PreviewTableRow[] = [];
    const proyeccionData = prepareExcelData();
    
    proyeccionData.nuclei.forEach(nucleus => {
      const maxRows = Math.max(nucleus.shortCareers.length, nucleus.longCareers.length, 1);
      for (let i = 0; i < maxRows; i++) {
        const shortCareer = nucleus.shortCareers[i];
        const longCareer = nucleus.longCareers[i];
        data.push({
          region: i === 0 ? nucleus.region : "",
          nucleus: i === 0 ? nucleus.name : "",
          extension: i === 0 ? nucleus.extension : "",
          shortCareerName: shortCareer?.careerName || "",
          shortCareerCount: shortCareer?.proyectados ?? "",
          longCareerName: longCareer?.careerName || "",
          longCareerCount: longCareer?.proyectados ?? ""
        });
      }
    });

    return data;
  }, [prepareExcelData]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!selectedPeriodId) {
      toast.error("Seleccione un período académico");
      return;
    }
    if (selectedCareers.length === 0) {
      toast.error("Seleccione al menos una carrera");
      return;
    }

    try {
      setIsExporting(true);
      const data = prepareExcelData();
      const periodLabel = periods.find(p => p.periodId === selectedPeriodId)?.label || "";
      const fileName = `proyeccion_pasantias_${periodLabel.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`;
      await generateProyeccionExcel(data, periodLabel, fileName);
      toast.success("Reporte exportado exitosamente");
    } catch (error) {
      console.error("Error exporting proyeccion:", error);
      toast.error("Error al exportar el reporte");
    } finally {
      setIsExporting(false);
    }
  }, [selectedPeriodId, selectedCareers, prepareExcelData, periods]);

  // Reset form when closing
  const handleClose = useCallback(() => {
    setSelectedPeriodId("");
    setSelectedCareerIds([]);
    setSelectedCareers([]);
    setActiveTab("preview");
    onClose();
  }, [onClose]);

  const careerOptions = careers.map(c => ({
    value: String(c.careerId),
    text: c.careerName
  }));

  const selectedPeriod = periods.find(p => p.periodId === selectedPeriodId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isFullscreen={true}
      showCloseButton={false}
      className="p-0! rounded-none!"
    >
      <div className="flex flex-col h-screen bg-bg-secondary dark:bg-bg-dark overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-bg-primary border-b border-border-light dark:border-white/5 shadow-sm z-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-brand-500/10 text-brand-500">
              <FileIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-text-primary dark:text-white leading-tight line-clamp-1">
                Proyección de Pasantías
              </h3>
              <p className="text-[10px] sm:text-xs font-medium text-text-tertiary">
                {selectedPeriod 
                  ? `Período: ${selectedPeriod.label} — ${selectedCareers.length} carrera(s) seleccionada(s)`
                  : "Configure el período y las carreras para generar la proyección"}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 hover:bg-bg-secondary dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <XIcon className="h-5 w-5 sm:h-6 sm:w-6 text-text-tertiary" />
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="flex sm:hidden bg-white dark:bg-bg-primary border-b border-border-light dark:border-white/5 z-10">
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "preview"
                ? "border-brand-500 text-brand-500 bg-brand-500/5"
                : "border-transparent text-text-tertiary"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Vista Previa
            </div>
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "config"
                ? "border-brand-500 text-brand-500 bg-brand-500/5"
                : "border-transparent text-text-tertiary"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ListIcon className="h-3.5 w-3.5" />
              Configuración
            </div>
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Preview (left side) */}
          <div className={`flex-1 bg-gray-500/10 dark:bg-black/20 overflow-hidden flex flex-col ${
            activeTab === "preview" ? "flex" : "hidden sm:flex"
          }`}>
            <div className="flex-1 overflow-auto p-2 sm:p-4">
              <div className="min-w-full bg-white dark:bg-bg-primary shadow-xl rounded-lg overflow-hidden border border-border-light dark:border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-bg-secondary dark:bg-white/5 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Región</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Núcleo</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Extensión</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Carrera Corta</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Cant. Proy.</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Carrera Larga</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Cant. Proy.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-white/5">
                      {!selectedPeriodId || selectedCareers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-12 h-12 text-text-tertiary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium">Configure el reporte para ver la vista previa</span>
                              <span className="text-xs">Seleccione un período y al menos una carrera</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        previewTableData.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-bg-secondary/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis uppercase">{row.region}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis uppercase">{row.nucleus}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis uppercase">{row.extension}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis uppercase">{row.shortCareerName}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-text-primary dark:text-text-emphasis font-bold">{row.shortCareerCount}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis uppercase">{row.longCareerName}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-text-primary dark:text-text-emphasis font-bold">{row.longCareerCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals bar */}
                {(selectedPeriodId && selectedCareers.length > 0) && (
                  <div className="px-4 py-3 bg-brand-500/10 border-t border-border-light dark:border-white/5">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs sm:text-sm">
                      <div className="p-2 bg-bg-surface dark:bg-bg-dark-surface rounded-lg">
                        <p className="text-text-tertiary">Carreras Cortas</p>
                        <p className="font-bold text-brand-600 dark:text-brand-400">{prepareExcelData().totals.totalShortCareers}</p>
                      </div>
                      <div className="p-2 bg-bg-surface dark:bg-bg-dark-surface rounded-lg">
                        <p className="text-text-tertiary">Carreras Largas</p>
                        <p className="font-bold text-brand-600 dark:text-brand-400">{prepareExcelData().totals.totalLongCareers}</p>
                      </div>
                      <div className="p-2 bg-bg-surface dark:bg-bg-dark-surface rounded-lg">
                        <p className="text-text-tertiary">Total Carreras</p>
                        <p className="font-bold text-brand-600 dark:text-brand-400">{prepareExcelData().totals.totalCareers}</p>
                      </div>
                      <div className="p-2 bg-bg-surface dark:bg-bg-dark-surface rounded-lg">
                        <p className="text-text-tertiary">Total Estudiantes</p>
                        <p className="font-bold text-brand-600 dark:text-brand-400">{prepareExcelData().totals.totalStudents}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isExporting && (
              <div className="absolute inset-0 bg-white/50 dark:bg-bg-primary/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-30">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  <p className="text-sm font-bold text-brand-500 animate-pulse uppercase tracking-widest">
                    Exportando...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Configuration (right side) */}
          <div className={`w-full sm:max-w-sm bg-white dark:bg-bg-primary border-l border-border-light dark:border-white/5 flex flex-col shadow-xl z-10 ${
            activeTab === "config" ? "flex" : "hidden sm:flex"
          }`}>
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 text-brand-500 mb-6">
                <ListIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <h4 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs">Configuración de Proyección</h4>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Period selector */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                    Período Académico
                  </label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Seleccione un período" },
                      ...periods.map(p => ({ value: p.value, label: p.label }))
                    ]}
                    value={selectedPeriodId}
                    onChange={(e) => setSelectedPeriodId(e as unknown as string)}
                    className="w-full"
                  />
                </div>

                {/* Career multi-select */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                    Carreras
                  </label>
                  <MultiSelect
                    label=""
                    options={careerOptions}
                    value={selectedCareerIds}
                    onChange={(selected) => setSelectedCareerIds(selected)}
                    placeholder="Seleccione carreras"
                  />
                </div>

                {/* Selected careers with number inputs */}
                {selectedCareers.length > 0 && (
                  <div className="space-y-1.5 sm:space-y-2 pt-4 border-t border-border-light dark:border-white/5">
                    <label className="text-[10px] sm:text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                      Estudiantes Proyectados
                    </label>
                    <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
                      {selectedCareers.map(career => (
                        <div
                          key={career.careerId}
                          className="flex items-center justify-between p-3 border border-border-default dark:border-border-dark rounded-lg bg-bg-surface dark:bg-bg-dark-surface hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex-1 pr-3">
                            <p className="text-xs sm:text-sm font-medium text-text-primary dark:text-text-emphasis leading-tight">
                              {career.careerName}
                            </p>
                            <p className="text-[10px] text-text-tertiary mt-0.5">
                              {career.careerType?.toUpperCase() === "CORTA" ? "Carrera Corta" : "Carrera Larga"}
                            </p>
                          </div>

                          <div className="shrink-0">
                            <input
                              type="number"
                              min="0"
                              value={career.projectedStudents}
                              onChange={(e) => handleProjectedStudentsChange(career.careerId, e.target.value)}
                              className="w-20 text-center rounded border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-brand-500/5 border border-brand-500/10 mt-4 sm:mt-8">
                  <p className="text-[10px] sm:text-[11px] text-brand-600 dark:text-brand-400 leading-relaxed italic">
                    * Ingrese la cantidad de estudiantes proyectados para cada carrera. El reporte se exportará con los datos ingresados.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-bg-secondary/30 dark:bg-white/5 border-t border-border-light dark:border-white/5 space-y-2 sm:space-y-3">
              <button
                onClick={handleExport}
                disabled={isExporting || !selectedPeriodId || selectedCareers.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isExporting ? "Exportando..." : "Exportar a Excel"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ProyeccionModal;
