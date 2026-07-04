import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "../../context/toast";
import { TOAST } from "../../components/ui/dialog/DialogConfig";
import { Modal } from "../../components/ui/modal";
import { MODAL_CONFIG } from "../../components/ui/dialog/DialogConfig";
import { FileIcon, ListIcon, DownloadIcon } from "../../icons";
import CustomSelect from "../../components/form/CustomSelect";
import MultiSelect from "../../components/form/MultiSelect";
import { getPeriods } from "../../features/periods/services/periodService";
import { getCareers } from "../../features/careers/services/careersService";
import { generateProyeccionExcel } from "../../utils/unefaExcelReports";
import { XIcon } from "lucide-react";
import apiClient from "../../api/apiClient";

interface Career {
  careerId: number;
  careerName: string;
  careerType?: string;
}

interface ProyeccionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProyeccionModal({ isOpen, onClose }: ProyeccionModalProps) {
  const { addToast } = useToast();
  const [periods, setPeriods] = useState<{ value: string; label: string; periodId: string }[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [allCareers, setAllCareers] = useState<Career[]>([]);
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([]);
  const [proyectadosMap, setProyectadosMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "config">("preview");
  const [sysLocation, setSysLocation] = useState({ region: 'LOS LLANOS', nucleus: 'PORTUGUESA', extension: 'ACARIGUA' });

  // Load periods + careers when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        setLoading(true);
        const [periodList, careerList, sysInstRes] = await Promise.all([
          getPeriods(),
          getCareers(),
          apiClient.get('/system-institution').catch(() => null)
        ]);
        if (sysInstRes?.data) {
          setSysLocation({
            region: sysInstRes.data.region || 'LOS LLANOS',
            nucleus: sysInstRes.data.nucleus || 'PORTUGUESA',
            extension: sysInstRes.data.extension || 'ACARIGUA'
          });
        }
        const periodOptions = (periodList || []).map(p => ({
          value: p.periodId,
          label: p.description,
          periodId: p.periodId
        }));
        setPeriods(periodOptions);
        const careers = (Array.isArray(careerList) ? careerList : (careerList?.data ?? [])) as Career[];
        setAllCareers(careers);
      } catch (error) {
        console.error("Error loading data:", error);
        addToast(TOAST.loadError());
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen]);

  // Handle projected students change
  const handleProyectadosChange = useCallback((careerId: number, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setProyectadosMap(prev => ({
      ...prev,
      [String(careerId)]: numValue
    }));
  }, []);

  // Selected career objects
  const selectedCareers = useMemo(() => {
    return allCareers.filter(c => selectedCareerIds.includes(String(c.careerId)));
  }, [allCareers, selectedCareerIds]);

  // Prepare data for Excel export
  const prepareExcelData = useCallback(() => {
    if (!selectedPeriodId || selectedCareers.length === 0) return null;

    const shortCareers = selectedCareers
      .filter(c => c.careerType?.toUpperCase() === "CORTA")
      .map(c => ({
        careerId: c.careerId,
        careerName: c.careerName,
        careerType: c.careerType,
        proyectados: proyectadosMap[String(c.careerId)] || 0
      }));

    const longCareers = selectedCareers
      .filter(c => c.careerType?.toUpperCase() !== "CORTA")
      .map(c => ({
        careerId: c.careerId,
        careerName: c.careerName,
        careerType: c.careerType,
        proyectados: proyectadosMap[String(c.careerId)] || 0
      }));

    const periodLabel = periods.find(p => p.periodId === selectedPeriodId)?.label || "";
    const totalStudents =
      shortCareers.reduce((s, c) => s + c.proyectados, 0) +
      longCareers.reduce((s, c) => s + c.proyectados, 0);

    return {
      periodDescription: periodLabel,
      nuclei: [{
        nucleusId: 0,
        name: sysLocation.nucleus,
        region: sysLocation.region,
        nucleusType: "NÚCLEO",
        extension: sysLocation.extension,
        shortCareers,
        longCareers
      }],
      totals: {
        totalShortCareers: shortCareers.length,
        totalLongCareers: longCareers.length,
        totalCareers: shortCareers.length + longCareers.length,
        totalStudents
      }
    };
  }, [selectedPeriodId, selectedCareers, proyectadosMap, periods]);

  // Preview table rows — one career per row, nucleus+extension in every row
  const previewTableData = useMemo(() => {
    const data = prepareExcelData();
    if (!data) return [];

    const rows: any[] = [];
    data.nuclei.forEach((nucleus: any) => {
      const careerRows: { shortName: string; shortCount: number | string; longName: string; longCount: number | string }[] = [];
      (nucleus.shortCareers || []).forEach((c: any) =>
        careerRows.push({ shortName: c.careerName, shortCount: c.proyectados, longName: "", longCount: "" })
      );
      (nucleus.longCareers || []).forEach((c: any) =>
        careerRows.push({ shortName: "", shortCount: "", longName: c.careerName, longCount: c.proyectados })
      );

      careerRows.forEach((row, i) => {
        rows.push({
          region: i === 0 ? nucleus.region : "",
          nucleus: nucleus.name,
          extension: nucleus.extension,
          shortCareerName: row.shortName,
          shortCareerCount: row.shortCount,
          longCareerName: row.longName,
          longCareerCount: row.longCount
        });
      });
    });

    return rows;
  }, [prepareExcelData]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!selectedPeriodId) {
      addToast({ variant: "error", title: "Dato requerido", message: "Seleccione un período académico" });
      return;
    }
    if (selectedCareerIds.length === 0) {
      addToast({ variant: "error", title: "Dato requerido", message: "Seleccione al menos una carrera" });
      return;
    }

    try {
      setIsExporting(true);
      const data = prepareExcelData();
      if (!data) {
        addToast({ variant: "error", title: "Error al exportar", message: "Error al preparar los datos" });
        return;
      }
      const periodLabel = periods.find(p => p.periodId === selectedPeriodId)?.label || "";
      const fileName = `proyeccion_pasantias_${periodLabel.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`;
      await generateProyeccionExcel(data, periodLabel, fileName);
      addToast({ variant: "success", title: "Exportado", message: "Reporte exportado exitosamente" });
    } catch (error) {
      console.error("Error exporting proyeccion:", error);
      addToast({ variant: "error", title: "Error al exportar", message: "Error al exportar el reporte" });
    } finally {
      setIsExporting(false);
    }
  }, [selectedPeriodId, selectedCareerIds, prepareExcelData, periods]);

  // Reset when closing
  const handleClose = useCallback(() => {
    setSelectedPeriodId("");
    setSelectedCareerIds([]);
    setProyectadosMap({});
    setActiveTab("preview");
    onClose();
  }, [onClose]);

  const selectedPeriod = periods.find(p => p.periodId === selectedPeriodId);
  const careerOptions = allCareers.map(c => ({ value: String(c.careerId), text: `${c.careerName} (${c.careerType || "LG"})` }));

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
                  ? `${selectedPeriod.label} — ${sysLocation.region} / ${sysLocation.nucleus} / ${sysLocation.extension}`
                  : "Seleccione período y carreras"}
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
                      {!selectedPeriodId || selectedCareerIds.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-12 h-12 text-text-tertiary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium">Configure el reporte para ver la vista previa</span>
                              <span className="text-xs">Seleccione período + carreras + cantidades</span>
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
                {(selectedPeriodId && selectedCareerIds.length > 0) && (
                  <div className="px-4 py-3 bg-brand-500/10 border-t border-border-light dark:border-white/5">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs sm:text-sm">
                      <div className="p-2 bg-bg-surface dark:bg-bg-dark-surface rounded-lg">
                        <p className="text-text-tertiary">Carreras Cortas</p>
                        <p className="font-bold text-brand-600 dark:text-brand-400">{prepareExcelData()?.totals?.totalShortCareers ?? 0}</p>
                      </div>
                      <div className="p-2 bg-bg-surface dark:bg-bg-dark-surface rounded-lg">
                        <p className="text-text-tertiary">Carreras Largas</p>
                        <p className="font-bold text-brand-600 dark:text-brand-400">{prepareExcelData()?.totals?.totalLongCareers ?? 0}</p>
                      </div>
                      <div className="p-2 bg-bg-surface dark:bg-bg-dark-surface rounded-lg">
                        <p className="text-text-tertiary">Total Carreras</p>
                        <p className="font-bold text-brand-600 dark:text-brand-400">{prepareExcelData()?.totals?.totalCareers ?? 0}</p>
                      </div>
                      <div className="p-2 bg-bg-surface dark:bg-bg-dark-surface rounded-lg">
                        <p className="text-text-tertiary">Total Estudiantes</p>
                        <p className="font-bold text-brand-600 dark:text-brand-400">{prepareExcelData()?.totals?.totalStudents ?? 0}</p>
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

                {/* MultiSelect for careers */}
                <div className="space-y-1.5 sm:space-y-2">
                  <MultiSelect
                    label="Carreras"
                    options={careerOptions}
                    value={selectedCareerIds}
                    onChange={setSelectedCareerIds}
                    placeholder="Seleccione carreras..."
                  />
                </div>

                {/* System location info */}
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 space-y-1 border border-blue-100 dark:border-blue-900/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    Ubicación
                  </p>
                  <p className="text-xs text-text-primary dark:text-text-emphasis">
                    <span className="font-medium">Región:</span> {sysLocation.region}
                  </p>
                  <p className="text-xs text-text-primary dark:text-text-emphasis">
                    <span className="font-medium">Núcleo:</span> {sysLocation.nucleus}
                  </p>
                  <p className="text-xs text-text-primary dark:text-text-emphasis">
                    <span className="font-medium">Extensión:</span> {sysLocation.extension}
                  </p>
                </div>

                {/* Projected counts per career */}
                {selectedCareers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary pl-1">
                      Cantidad Proyectada
                    </p>
                    <div className="divide-y divide-border-light dark:divide-white/5 border border-border-light dark:border-white/10 rounded-lg overflow-hidden">
                      {selectedCareers.map(career => (
                        <div key={career.careerId} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50/50 dark:hover:bg-white/5">
                          <div className="flex-1 pr-2 min-w-0">
                            <p className="text-xs font-medium text-text-primary dark:text-text-emphasis truncate">
                              {career.careerName}
                            </p>
                            <p className="text-[10px] text-text-tertiary">
                              {career.careerType?.toUpperCase() === "CORTA" ? "Carrera Corta" : "Carrera Larga"}
                            </p>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={proyectadosMap[String(career.careerId)] || 0}
                            onChange={(e) => handleProyectadosChange(career.careerId, e.target.value)}
                            className="w-16 text-center rounded border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-brand-500/5 border border-brand-500/10 mt-4 sm:mt-8">
                  <p className="text-[10px] sm:text-[11px] text-brand-600 dark:text-brand-400 leading-relaxed italic">
                    * Seleccione las carreras e ingrese la cantidad proyectada. Región/Núcleo/Extensión: {sysLocation.region} / {sysLocation.nucleus} / {sysLocation.extension}.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-bg-secondary/30 dark:bg-white/5 border-t border-border-light dark:border-white/5 space-y-2 sm:space-y-3">
              <button
                onClick={handleExport}
                disabled={isExporting || !selectedPeriodId || selectedCareerIds.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isExporting ? MODAL_CONFIG.button.exportLoading : MODAL_CONFIG.button.exportExcel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ProyeccionModal;
