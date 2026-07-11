import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "../../context/toast";
import { TOAST } from "../../components/ui/dialog/DialogConfig";
import { Modal } from "../../components/ui/modal";
import { MODAL_CONFIG } from "../../components/ui/dialog/DialogConfig";
import { FileIcon, ListIcon, DownloadIcon } from "../../icons";
import CustomSelect from "../../components/form/CustomSelect";
import MultiSelect from "../../components/form/MultiSelect";
import { getPeriods } from "../../features/periods/services/periodService";
import { getInstitutions, getInstitutionCareers } from "../../features/institutions/services/institutionsService";
import { generateRelacionInstitucionesSolicitanExcel } from "../../utils/unefaExcelReports";
import { XIcon } from "lucide-react";
import apiClient from "../../api/apiClient";

interface Period {
  periodId: string;
  description: string;
}

interface Institution {
  institutionId: string;
  name: string;
  rif: string;
  institutionType: string;
  phone: string;
  status: boolean;
}

interface Career {
  careerId: string;
  name: string;
}

interface RelacionInstitucionesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RelacionInstitucionesModal({ isOpen, onClose }: RelacionInstitucionesModalProps) {
  const { addToast } = useToast();
  const [periods, setPeriods] = useState<{ value: string; label: string; periodId: string }[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
  const [selectedInstIds, setSelectedInstIds] = useState<string[]>([]);
  const [institutionCareers, setInstitutionCareers] = useState<Record<string, Career[]>>({});
  const [studentsMap, setStudentsMap] = useState<Record<string, number>>({});
  const [responsibleMap, setResponsibleMap] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "config">("preview");
  const [sysLocation, setSysLocation] = useState({ region: 'LOS LLANOS', nucleus: 'PORTUGUESA', extension: 'ACARIGUA' });

  // Load periods + institutions when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        setLoading(true);
        const [periodList, instList, sysInstRes] = await Promise.all([
          getPeriods(),
          getInstitutions(),
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
        const institutions = Array.isArray(instList) ? instList : (instList?.data ?? []);
        setAllInstitutions(institutions);
      } catch (error) {
        console.error("Error loading data:", error);
        addToast(TOAST.loadError());
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen]);

  // Load careers when institutions are selected
  useEffect(() => {
    const loadCareers = async () => {
      const newMap: Record<string, Career[]> = {};
      for (const id of selectedInstIds) {
        if (!institutionCareers[id]) {
          try {
            const careers = await getInstitutionCareers(id);
            newMap[id] = careers || [];
          } catch {
            newMap[id] = [];
          }
        }
      }
      if (Object.keys(newMap).length > 0) {
        setInstitutionCareers(prev => ({ ...prev, ...newMap }));
      }
    };
    if (selectedInstIds.length > 0) loadCareers();
  }, [selectedInstIds]);

  const handleStudentsChange = useCallback((instId: string, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setStudentsMap(prev => ({ ...prev, [instId]: numValue }));
  }, []);

  const handleResponsibleChange = useCallback((instId: string, value: string) => {
    setResponsibleMap(prev => ({ ...prev, [instId]: value }));
  }, []);

  // Filtered institution objects
  const selectedInstitutions = useMemo(() => {
    return allInstitutions.filter(inst => selectedInstIds.includes(inst.institutionId));
  }, [allInstitutions, selectedInstIds]);

  // Solo instituciones activas (status === true)
  const activeInstitutions = useMemo(() => {
    return allInstitutions.filter(inst => inst.status !== false);
  }, [allInstitutions]);

  const institutionOptions: { value: string; text: string }[] = activeInstitutions.map(inst => ({
    value: inst.institutionId,
    text: `${inst.name} (${inst.rif || 'S/RIF'})`
  }));

  // Options filtradas por búsqueda (para el MultiSelect)
  const filteredInstOptions = useMemo(() => {
    if (!searchTerm) return institutionOptions;
    const q = searchTerm.toLowerCase();
    return institutionOptions.filter(o =>
      o.text.toLowerCase().includes(q) ||
      activeInstitutions.find(i => i.institutionId === o.value)?.institutionType?.toLowerCase().includes(q)
    );
  }, [institutionOptions, searchTerm, activeInstitutions]);

  // Prepare data for Excel export
  const prepareExcelData = useCallback(() => {
    if (selectedInstitutions.length === 0) return null;

    const periodLabel = periods.find(p => p.periodId === selectedPeriodId)?.label || '';
    const rows: any[] = [];

    selectedInstitutions.forEach(inst => {
      const careers = institutionCareers[inst.institutionId] || [];
      const careerNames = careers.map(c => c.name).filter(Boolean).join(', ');
      rows.push({
        empresa: inst.name,
        responsable: responsibleMap[inst.institutionId] || '',
        numeroContacto: inst.phone || 'N/A',
        tipoEmpresa: inst.institutionType || '',
        carreras: careerNames,
        cantidadEstudiantes: studentsMap[inst.institutionId] || 0,
      });
    });

    return { periodDescription: periodLabel, rows };
  }, [selectedInstitutions, institutionCareers, responsibleMap, studentsMap, periods, selectedPeriodId]);

  // Preview table rows
  const previewTableData = useMemo(() => {
    const data = prepareExcelData();
    return data?.rows || [];
  }, [prepareExcelData]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (selectedInstitutions.length === 0) {
      addToast({ variant: "error", title: "Dato requerido", message: "Seleccione al menos una institución" });
      return;
    }

    try {
      setIsExporting(true);
      const data = prepareExcelData();
      if (!data || data.rows.length === 0) {
        addToast({ variant: "error", title: "Error al exportar", message: "No hay datos para exportar" });
        return;
      }
      const periodLabel = periods.find(p => p.periodId === selectedPeriodId)?.label || "Todos";
      const fileName = `relacion_instituciones_${periodLabel.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`;
      await generateRelacionInstitucionesSolicitanExcel(data.rows, periodLabel, fileName);
      addToast({ variant: "success", title: "Exportado", message: "Reporte exportado exitosamente" });
    } catch (error) {
      console.error("Error exporting relacion instituciones:", error);
      addToast({ variant: "error", title: "Error al exportar", message: "Error al exportar el reporte" });
    } finally {
      setIsExporting(false);
    }
  }, [selectedInstitutions, prepareExcelData, periods, selectedPeriodId]);

  // Reset when closing
  const handleClose = useCallback(() => {
    setSelectedPeriodId("");
    setSelectedInstIds([]);
    setStudentsMap({});
    setResponsibleMap({});
    setInstitutionCareers({});
    setSearchTerm("");
    setActiveTab("preview");
    onClose();
  }, [onClose]);

  const selectedPeriod = periods.find(p => p.periodId === selectedPeriodId);
  const totalStudents = selectedInstitutions.reduce((sum, inst) => sum + (studentsMap[inst.institutionId] || 0), 0);

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
                Relación de Instituciones
              </h3>
              <p className="text-[10px] sm:text-xs font-medium text-text-tertiary">
                {selectedPeriod
                  ? `${selectedPeriod.label} — ${sysLocation.region} / ${sysLocation.nucleus} / ${sysLocation.extension}`
                  : "Seleccione período e instituciones"}
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
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Empresa o Institución</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Responsable</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Contacto</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Tipo</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Carreras</th>
                        <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold uppercase tracking-wider text-text-tertiary whitespace-nowrap">Cant. Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-white/5">
                      {selectedInstIds.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-text-tertiary">
                            <div className="flex flex-col items-center gap-2">
                              <svg className="w-12 h-12 text-text-tertiary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="font-medium">Seleccione instituciones para ver la vista previa</span>
                              <span className="text-xs">Elija período + instituciones + cantidades</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        previewTableData.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-bg-secondary/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis uppercase font-medium">{row.empresa}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis uppercase">{row.responsable}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis">{row.numeroContacto}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis uppercase">{row.tipoEmpresa}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary dark:text-text-emphasis max-w-[200px] truncate" title={row.carreras}>{row.carreras}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-text-primary dark:text-text-emphasis font-bold">{row.cantidadEstudiantes}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals bar */}
                {selectedInstIds.length > 0 && (
                  <div className="px-4 py-3 bg-brand-500/10 border-t border-border-light dark:border-white/5">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs sm:text-sm">
                      <div className="p-2 bg-bg-surface dark:bg-bg-dark-surface rounded-lg">
                        <p className="text-text-tertiary">Instituciones</p>
                        <p className="font-bold text-brand-600 dark:text-brand-400">{selectedInstitutions.length}</p>
                      </div>
                      <div className="p-2 bg-bg-surface dark:bg-bg-dark-surface rounded-lg">
                        <p className="text-text-tertiary">Total Estudiantes</p>
                        <p className="font-bold text-brand-600 dark:text-brand-400">{totalStudents}</p>
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
            {/* Non-scrollable top: period + multiselect */}
            <div className="shrink-0 p-4 sm:p-6 pb-2 sm:pb-2">
              <div className="flex items-center gap-2 text-brand-500 mb-4">
                <ListIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <h4 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs">Configuración</h4>
              </div>

              <div className="space-y-3 sm:space-y-4">
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

                {/* Institution search + multiselect */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">
                    Instituciones
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar instituciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-text-tertiary"
                  />
                  <MultiSelect
                    label=""
                    options={filteredInstOptions}
                    value={selectedInstIds}
                    onChange={(ids) => {
                      setSelectedInstIds(ids);
                      // Inicializar responsable para las nuevas
                      ids.forEach(id => {
                        if (!(id in responsibleMap)) {
                          setResponsibleMap(prev => ({ ...prev, [id]: '' }));
                        }
                      });
                      // Limpiar responsables de las removidas
                      setResponsibleMap(prev => {
                        const next = { ...prev };
                        Object.keys(next).forEach(k => {
                          if (!ids.includes(k)) delete next[k];
                        });
                        return next;
                      });
                    }}
                    placeholder={selectedInstIds.length > 0 ? `${selectedInstIds.length} seleccionadas` : "Seleccione instituciones..."}
                  />
                </div>
              </div>
            </div>

            {/* Scrollable area: selected cards, location, info */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Selected institutions */}
                {selectedInstitutions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary pl-1">
                      Instituciones seleccionadas ({selectedInstitutions.length})
                    </p>
                    <div className="divide-y divide-border-light dark:divide-white/5 border border-border-light dark:border-white/10 rounded-lg overflow-hidden">
                      {selectedInstitutions.map(inst => {
                        const careers = institutionCareers[inst.institutionId] || [];
                        return (
                          <div key={inst.institutionId} className="p-3 space-y-2 hover:bg-gray-50/50 dark:hover:bg-white/5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-text-primary dark:text-text-emphasis truncate">
                                  {inst.name}
                                </p>
                                <p className="text-[10px] text-text-tertiary">
                                  RIF: {inst.rif || 'N/A'} · {inst.institutionType || 'N/A'} · {inst.phone || 'N/A'}
                                </p>
                                {careers.length > 0 && (
                                  <p className="text-[10px] text-text-tertiary mt-0.5">
                                    Carreras: {careers.map(c => c.name).join(', ')}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedInstIds(prev => prev.filter(id => id !== inst.institutionId))}
                                className="text-red-500 hover:text-red-600 p-1 shrink-0"
                                title="Quitar"
                              >
                                <XIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest block mb-0.5">
                                  Responsable
                                </label>
                                <input
                                  type="text"
                                  placeholder="Nombre del responsable"
                                  value={responsibleMap[inst.institutionId] || ''}
                                  onChange={(e) => handleResponsibleChange(inst.institutionId, e.target.value)}
                                  className="w-full rounded border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface px-1.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest block mb-0.5">
                                  Cant. Estudiantes
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={studentsMap[inst.institutionId] || ''}
                                  onChange={(e) => handleStudentsChange(inst.institutionId, e.target.value)}
                                  className="w-full text-center rounded border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface px-1.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Location info */}
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

                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-brand-500/5 border border-brand-500/10 mt-4 sm:mt-8">
                  <p className="text-[10px] sm:text-[11px] text-brand-600 dark:text-brand-400 leading-relaxed italic">
                    * Agregue instituciones e ingrese la cantidad de estudiantes que solicitan. Región/Núcleo/Extensión: {sysLocation.region} / {sysLocation.nucleus} / {sysLocation.extension}.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-bg-secondary/30 dark:bg-white/5 border-t border-border-light dark:border-white/5 space-y-2 sm:space-y-3">
              <button
                onClick={handleExport}
                disabled={isExporting || selectedInstitutions.length === 0}
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

export default RelacionInstitucionesModal;
