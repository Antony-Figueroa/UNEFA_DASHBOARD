/**
 * @file PreEnrollmentTable.tsx
 * @description Componente de tabla para visualizar y gestionar pre-inscripciones.
 * Incluye funcionalidades de filtrado, ordenamiento, paginación y acciones masivas.
 */

import { useState, useEffect, useMemo } from "react";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { PreEnrollmentRowData } from "../types";
import { useDebounce } from "../../../hooks/useDebounce";
import { useCareers } from "../../careers/hooks/useCareers";
import { TableSkeleton } from "../../../components/ui/skeleton";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import Button from "../../../components/ui/button/Button";
import Checkbox from "../../../components/form/input/Checkbox";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import { maskIdentification } from "../../../utils/maskData";
import { matchSearch } from "../../../utils/searchNormalizer";

/**
 * Representa una opción de filtrado en la tabla.
 */
interface FilterOption {
  value: string;
  label: string;
  id?: string | number;
}

/**
 * Propiedades del componente PreEnrollmentTable.
 */
interface PreEnrollmentTableProps {
  /** Lista de pre-inscripciones a mostrar */
  data: PreEnrollmentRowData[];
  /** Estado de carga de la lista */
  status: "loading" | "success" | "error" | "idle";
  /** Error en caso de que la carga falle */
  error: Error | null;
  /** Función para editar una pre-inscripción */
  onEdit?: (item: PreEnrollmentRowData) => void;
  /** Función para cambiar el estado (activar/desactivar) de una pre-inscripción */
  onToggleStatus?: (item: PreEnrollmentRowData) => void;
  /** Función para ver detalles de una pre-inscripción */
  onView?: (item: PreEnrollmentRowData) => void;
  /** Función para exportar a inscripción definitiva */
  onExportToEnrollment?: (item: PreEnrollmentRowData) => void;
  /** Función para eliminación masiva */
  onBulkDelete?: (ids: string[]) => void;
  /** Función para restauración masiva */
  onBulkRestore?: (ids: string[]) => void;
  /** Pestaña activa actual */
  activeTab?: "Activas" | "Inactivas";
  /** Indica si se está realizando una acción de carga */
  loading?: boolean;
  /** Opciones para filtrar por período */
  periodOptions?: FilterOption[];
  /** Opciones para filtrar por tipo de práctica */
  practiceTypeOptions?: FilterOption[];
  /** Opciones para filtrar por carrera */
  careerOptions?: FilterOption[];
  /** Callback que notifica si hay filas seleccionadas (para bloquear botonera externa) */
  onSelectionChange?: (selecting: boolean) => void;
}

type SortKey = "identificationNumber" | "studentName" | "period" | "preEnrollmentDate" | "enrollmentCode";
type SortOrder = "asc" | "desc";

interface ActionButtonsProps {
    onEdit?: () => void;
    onToggleStatus?: () => void;
    onView?: () => void;
    onExportToEnrollment?: () => void;
    status: boolean;
    isMobile?: boolean;
    disableAll?: boolean;
}

const ActionButtons = ({
    onEdit,
    onToggleStatus,
    onView,
    onExportToEnrollment,
    status,
    isMobile = false,
    disableAll = false,
}: ActionButtonsProps) => {
    const containerClasses = isMobile 
        ? "flex flex-col gap-3 pt-2" 
        : "flex justify-end gap-3";

    const ExportIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
    );

    return (
        <div className={containerClasses}>
            {onView && (
                <AsyncActionButton
                    onClick={async () => onView()}
                    icon={<EyeIcon />}
                    tooltip="Ver Detalles"
                    label={isMobile ? "Ver Detalles" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                    disabled={disableAll}
                />
            )}
            {onEdit && (
                <AsyncActionButton
                    onClick={async () => onEdit()}
                    icon={<EditIcon />}
                    tooltip="Editar"
                    label={isMobile ? "Editar Pre-inscripción" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                    disabled={disableAll}
                />
            )}
            {onExportToEnrollment && (
                <AsyncActionButton
                    onClick={async () => onExportToEnrollment()}
                    icon={<ExportIcon />}
                    tooltip="Exportar a Inscripción"
                    label={isMobile ? "Exportar a Inscripción" : undefined}
                    variant="info"
                    fullWidth={isMobile}
                    disabled={disableAll}
                />
            )}
            {onToggleStatus && (
                <AsyncActionButton
                    onClick={async () => onToggleStatus()}
                    icon={status ? <TrashIcon /> : <RefreshIcon />}
                    tooltip={status ? "Eliminar" : "Restaurar"}
                    label={isMobile ? (status ? "Eliminar Pre-inscripción" : "Restaurar Pre-inscripción") : undefined}
                    variant={status ? "error" : "success"}
                    fullWidth={isMobile}
                    disabled={disableAll}
                />
            )}
        </div>
    );
};

export default function PreEnrollmentTable({
    data = [],
    status,
    error,
    onEdit,
    onToggleStatus,
    onView,
    onExportToEnrollment,
    onBulkDelete,
    onBulkRestore,
    activeTab = "Activas",
    loading: externalLoading,
    periodOptions = [],
    practiceTypeOptions = [],
    careerOptions = [],
    onSelectionChange,
}: PreEnrollmentTableProps) {
    const { careers: allCareers } = useCareers();
    const [searchTerm, setSearchTerm] = useState("");
    const [periodFilter, setPeriodFilter] = useState("");
    const [practiceTypeFilter, setPracticeTypeFilter] = useState("");
    const [careerFilter, setCareerFilter] = useState("");

    // Limpiar filtro de carrera si ya no es válido para el tipo de práctica seleccionado
    useEffect(() => {
        if (practiceTypeFilter && careerFilter && practiceTypeOptions) {
            const selectedType = practiceTypeOptions.find(opt => opt.value === practiceTypeFilter);
            if (selectedType && selectedType.id) {
                const typeId = String(selectedType.id);
                const career = allCareers.find(c => c.careerName.toUpperCase() === careerFilter.toUpperCase());
                if (career && career.internshipTypeIds && !career.internshipTypeIds.includes(typeId)) {
                    setCareerFilter("");
                }
            }
        }
    }, [practiceTypeFilter, allCareers, careerFilter, practiceTypeOptions]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
        key: "studentName",
        order: "asc",
    });

    const debouncedSearch = useDebounce(searchTerm, 300);

    // Notificar a la página cuando hay selección activa (para bloquear botonera)
    useEffect(() => {
        onSelectionChange?.(selectedIds.length > 0);
    }, [selectedIds, onSelectionChange]);

    useEffect(() => {
        setSelectedIds([]);
    }, [activeTab]);

    const filteredData = useMemo(() => {
        const search = debouncedSearch.trim().toLowerCase();
        const periodSearch = periodFilter.trim().toLowerCase();
        const practiceTypeSearch = practiceTypeFilter.trim().toLowerCase();
        const careerSearch = careerFilter.trim().toLowerCase();

        const filtered = data.filter((s) => {
            const matchesSearch = !search || 
                matchSearch(s.identificationNumber, search) || 
                matchSearch(s.studentName, search);
            const matchesPeriod = !periodSearch || s.period.toLowerCase() === periodSearch;
            const matchesPracticeType = !practiceTypeSearch || s.practiceType.toLowerCase() === practiceTypeSearch;
            const matchesCareer = !careerSearch || (s.careerName || "").toLowerCase().includes(careerSearch);
            const matchesTab = activeTab === "Activas" ? s.status === true : s.status === false;

            return matchesSearch && matchesPeriod && matchesPracticeType && matchesCareer && matchesTab;
        });

        filtered.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            const strA = String(valA ?? "").toLowerCase();
            const strB = String(valB ?? "").toLowerCase();

            if (strA < strB) return sortConfig.order === "asc" ? -1 : 1;
            if (strA > strB) return sortConfig.order === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [data, debouncedSearch, periodFilter, practiceTypeFilter, careerFilter, activeTab, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, periodFilter, practiceTypeFilter, careerFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paged = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handleSort = (key: SortKey) => {
        setSortConfig((prev) => ({
            key,
            order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
        }));
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const deletableIds = paged
                .filter((p) => !p.isInUse)
                .map((p) => p.preEnrollmentId)
                .filter((id): id is string => Boolean(id));
            setSelectedIds(deletableIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((item) => item !== id));
        }
    };

    const toggleRowExpansion = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const toggleAllRows = () => {
        if (expandedRows.size === paged.length) {
            setExpandedRows(new Set());
        } else {
            const allIds = paged.map((s: PreEnrollmentRowData, index: number) => s.preEnrollmentId ?? `idx-${index}`);
            setExpandedRows(new Set(allIds));
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setPeriodFilter("");
        setPracticeTypeFilter("");
        setCareerFilter("");
    };

    const SortIndicator = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) {
            return (
                <svg className="ml-1 icon-xs text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortConfig.order === "asc" ? (
            <svg className="ml-1 icon-xs text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="ml-1 icon-xs text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    // Get unique periods for the filter dropdown
    const uniquePeriods = useMemo(() => {
        if (periodOptions.length > 0) return periodOptions;
        
        const fromData = Array.from(new Set(data.map(item => item.period).filter(Boolean))).sort();
        return fromData.map(p => ({ value: p, label: p }));
    }, [data, periodOptions]);

    const uniqueCareers = useMemo(() => {
        // Si hay un tipo de práctica seleccionado, filtrar carreras por ese tipo
        let filteredCareers = allCareers;
        if (practiceTypeFilter && practiceTypeOptions) {
            const selectedType = practiceTypeOptions.find(opt => opt.value === practiceTypeFilter);
            if (selectedType && selectedType.id) {
                const typeId = String(selectedType.id);
                filteredCareers = allCareers.filter(c => c.internshipTypeIds && c.internshipTypeIds.includes(typeId));
            }
        }

        if (careerOptions && careerOptions.length > 0) {
            // Si nos pasan opciones de carrera, las filtramos si es necesario
            if (practiceTypeFilter) {
                const validNames = new Set(filteredCareers.map(c => c.careerName.toUpperCase()));
                return careerOptions.filter(opt => validNames.has(opt.value.toUpperCase()));
            }
            return careerOptions;
        }

        // De lo contrario, usamos las carreras del backend que coincidan con los datos actuales
        const dataCareerNames = new Set(data.map(item => (item.careerName || "").toUpperCase()));
        
        return filteredCareers
            .filter(c => dataCareerNames.has(c.careerName.toUpperCase()))
            .map(c => ({ 
                value: c.careerName.toUpperCase(), 
                label: c.careerName.toUpperCase() 
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [data, careerOptions, allCareers, practiceTypeFilter, practiceTypeOptions]);

    if (status === "loading" || externalLoading) {
        return (
            <div className="table-container">
                <TableSkeleton columns={6} rows={itemsPerPage} />
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-error-500 animate-fadeIn">
                <h3 className="text-lg font-semibold text-error-600 dark:text-error-400">Error de conexión</h3>
                <p className="mt-2 text-text-secondary dark:text-text-tertiary font-medium">
                    No hay conexión a la BD
                </p>
                {error && error.message !== 'no hay conexión a la BD' && (
                    <div className="mt-4 text-xs text-error-500/70 italic">
                        Detalles: {error.message}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="table-container">
            {/* Search and Filter Bar */}
            <div className="p-4 border-b border-border-light dark:border-border-dark space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Buscador General */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por cédula o nombre"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </span>
                    </div>

                    {/* Filtro por Periodo */}
                    <div className="relative">
                        <select
                            value={periodFilter}
                            onChange={(e) => setPeriodFilter(e.target.value)}
                            className="w-full h-11 min-h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis appearance-none"
                        >
                            <option value="" className="dark:bg-bg-dark">Período</option>
                            {uniquePeriods.map((opt) => (
                                <option key={opt.value} value={opt.value} className="dark:bg-bg-dark">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Filtro por Tipo de Práctica */}
                    <div className="relative">
                        <select
                            value={practiceTypeFilter}
                            onChange={(e) => setPracticeTypeFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis appearance-none"
                        >
                            <option value="" className="dark:bg-bg-dark">Tipo de Práctica</option>
                            {practiceTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value} className="dark:bg-bg-dark">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Filtro por Carrera */}
                    <div className="relative">
                        <select
                            value={careerFilter}
                            onChange={(e) => setCareerFilter(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis appearance-none"
                        >
                            <option value="" className="dark:bg-bg-dark">Carrera</option>
                            {uniqueCareers.map((opt) => (
                                <option key={opt.value} value={opt.value} className="dark:bg-bg-dark">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-3">


                        {(searchTerm || periodFilter || practiceTypeFilter || careerFilter) && (
                            <button
                                onClick={clearFilters}
                                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition-colors min-h-11 px-2"
                            >
                                <RefreshIcon className="icon-xs" />
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {paged.length > 0 && (
                            <Button variant="ghost" size="sm" className="md:hidden" onClick={toggleAllRows}>
                                {expandedRows.size === paged.length ? (
                                    <>
                                        <ChevronUpIcon className="icon-sm" />
                                        Contraer todo
                                    </>
                                ) : (
                                    <>
                                        <ChevronDownIcon className="icon-sm" />
                                        Expandir todo
                                    </>
                                )}
                            </Button>
                        )}

                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-fadeIn">
                                <span className="hidden sm:inline text-xs font-medium text-text-secondary dark:text-text-tertiary mr-2">
                                    {selectedIds.length} seleccionados
                                </span>
                                {activeTab === "Activas" ? (
                                    <Button variant="error" size="sm" onClick={async () => onBulkDelete?.(selectedIds)}>
                                        Eliminar
                                    </Button>
                                ) : (
                                    <Button variant="success" size="sm" onClick={() => onBulkRestore?.(selectedIds)}>
                                        Restaurar
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Vista de Escritorio (Tabla) */}
            <div className="hidden md:block max-w-full overflow-x-auto table-scrollbar">
                <Table className="table-root">
                    <TableHeader className="table-header-row bg-bg-secondary dark:bg-bg-dark/50">
                        <TableRow>
                            <TableCell isHeader className="table-header-cell w-10">
                                <Checkbox
                                    checked={
                                        paged.length > 0 &&
                                        paged.filter((p) => !p.isInUse).length > 0 &&
                                        paged.filter((p) => !p.isInUse).every((p) => selectedIds.includes(p.preEnrollmentId))
                                    }
                                    onChange={handleSelectAll}
                                    ariaLabel="Seleccionar todos"
                                />
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("identificationNumber")}>
                                <div className="flex items-center">Cédula <SortIndicator column="identificationNumber" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("studentName")}>
                                <div className="flex items-center">Estudiante <SortIndicator column="studentName" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("period")}>
                                <div className="flex items-center">Período <SortIndicator column="period" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("enrollmentCode")}>
                                <div className="flex items-center">Matrícula <SortIndicator column="enrollmentCode" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("preEnrollmentDate")}>
                                <div className="flex items-center">Fecha <SortIndicator column="preEnrollmentDate" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell text-right">
                                &nbsp;
                            </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border-light dark:divide-border-dark">
                        {paged.length > 0 ? (
                            paged.map((s: PreEnrollmentRowData, index: number) => (
                                <TableRow 
                                    key={s.preEnrollmentId}
                                    className={`table-row-hover ${index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-bg-secondary/50 dark:bg-white/2"} ${selectedIds.includes(s.preEnrollmentId) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                                >
                                    <TableCell className="table-cell">
                                        <Tooltip 
                                            content={s.isInUse ? "Esta pre-inscripción ya tiene tutores asignados y no puede ser seleccionada para eliminar" : ""}
                                            isDisabled={!s.isInUse}
                                        >
                                            <div>
                                                <Checkbox 
                                                    checked={selectedIds.includes(s.preEnrollmentId)}
                                                    onChange={(checked) => handleSelectRow(s.preEnrollmentId, checked)}
                                                    disabled={s.isInUse}
                                                />
                                            </div>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="table-cell font-medium text-text-primary dark:text-text-emphasis">
                                        {s.identificationPrefix}-{s.identificationNumber}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.studentName}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.period}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.enrollmentCode}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.preEnrollmentDate}
                                    </TableCell>
                                    <TableCell className="table-cell text-right">
                                        <ActionButtons
                                            onView={onView ? () => onView(s) : undefined}
                                            onEdit={activeTab === "Activas" && onEdit ? () => onEdit(s) : undefined}
                                            onToggleStatus={onToggleStatus ? () => onToggleStatus(s) : undefined}
                                            onExportToEnrollment={activeTab === "Activas" && onExportToEnrollment ? () => onExportToEnrollment(s) : undefined}
                                            status={s.status}
                                            disableAll={selectedIds.length > 0}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="p-0 border-0">
                                <div className="py-20">
                                    <EmptyState
                                        title="No se encontraron pre-inscripciones"
                                        description={
                                            searchTerm || periodFilter || practiceTypeFilter || careerFilter
                                                ? "Intenta ajustar los filtros para encontrar lo que buscas."
                                                : "Comienza creando una nueva pre-inscripción."
                                        }
                                        action={
                                            searchTerm || periodFilter || practiceTypeFilter || careerFilter ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={clearFilters}
                                                    className="flex items-center gap-2 mx-auto"
                                                >
                                                    <RefreshIcon className="icon-xs" />
                                                    Limpiar filtros
                                                </Button>
                                            ) : undefined
                                        }
                                    />
                                </div>
                            </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View (Card format) */}
            <div className="md:hidden divide-y divide-border-light dark:divide-border-dark">
                {paged.length > 0 ? (
                    paged.map((s: PreEnrollmentRowData, index: number) => {
                        const preEnrollmentId = s.preEnrollmentId || `idx-${index}`;
                        const isExpanded = expandedRows.has(preEnrollmentId);

                        return (
                            <div key={preEnrollmentId} className="relative p-4 bg-white dark:bg-transparent transition-colors overflow-hidden">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex-1 text-center">
                                            <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis leading-tight truncate px-8 uppercase">
                                                {s.studentName}
                                            </h3>
                                            <p className="text-xs text-text-secondary mt-1 truncate">{s.identificationPrefix}-{s.identificationNumber}</p>
                                        </div>
                                        <button
                                            onClick={async () => toggleRowExpansion(preEnrollmentId)}
                                            className="absolute right-2 top-2 p-2 text-text-tertiary hover:bg-bg-secondary dark:hover:bg-white/5 rounded-full min-h-12 min-w-12 flex items-center justify-center transition-transform duration-200"
                                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                            aria-label={isExpanded ? "Contraer" : "Expandir"}
                                        >
                                            <ChevronDownIcon className="icon-sm" />
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 space-y-6 animate-fadeIn border-t border-border-light dark:border-border-dark pt-6">
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Período</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium">{s.period}</p>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Fecha</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium">{s.preEnrollmentDate}</p>
                                            </div>
                                            <div className="flex flex-col items-center col-span-2">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-secondary mb-1.5">Código de Matrícula</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium">{s.enrollmentCode}</p>
                                            </div>
                                        </div>

                                        <ActionButtons
                                            onView={onView ? () => onView(s) : undefined}
                                            onEdit={activeTab === "Activas" && onEdit ? () => onEdit(s) : undefined}
                                            onToggleStatus={onToggleStatus ? () => onToggleStatus(s) : undefined}
                                            onExportToEnrollment={activeTab === "Activas" && onExportToEnrollment ? () => onExportToEnrollment(s) : undefined}
                                            status={s.status}
                                            isMobile={true}
                                            disableAll={selectedIds.length > 0}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center animate-fadeIn">
                        <EmptyState
                            title="No se encontraron pre-inscripciones"
                            description={
                                searchTerm || periodFilter || practiceTypeFilter || careerFilter
                                    ? "Intenta ajustar los filtros para encontrar lo que buscas."
                                    : "Comienza creando una nueva pre-inscripción."
                            }
                            action={
                                (searchTerm || periodFilter || practiceTypeFilter || careerFilter) ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 mx-auto"
                                    >
                                        <RefreshIcon className="icon-xs" />
                                        Limpiar filtros
                                    </Button>
                                ) : undefined
                            }
                        />
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={(val) => {
                    setItemsPerPage(val);
                    setCurrentPage(1);
                }}
                itemsPerPageOptions={[5, 10, 25]}
            />
        </div>
    );
}
