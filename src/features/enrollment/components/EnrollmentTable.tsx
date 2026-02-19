import { useState, useEffect, useMemo } from "react";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { EditIcon, TrashIcon, RefreshIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons/actions";
import { EnrollmentRowData } from "../types";
import { getStudents } from "../../students/services/studentsService";
import { getCareers } from "../../careers/services/careersService";
import { Student } from "../../students/types";
import { Career } from "../../careers/types";
import { useDebounce } from "../../../hooks/useDebounce";
import { TableSkeleton } from "../../../components/ui/skeleton";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { generateMatricula } from "../../../utils/matricula";
import { maskIdentification } from "../../../utils/maskData";

/**
 * Interface for filter options used in select inputs.
 */
interface FilterOption {
  /** The value of the option */
  value: string;
  /** The display label of the option */
  label: string;
  /** Optional unique identifier */
  id?: string | number;
}

/**
 * Props for the EnrollmentTable component.
 */
interface EnrollmentTableProps {
  /** Array of enrollment data to display */
  data: EnrollmentRowData[];
  /** Loading status of the data */
  status: "loading" | "success" | "error" | "idle";
  /** Error object if status is 'error' */
  error: Error | null;
  /** Callback for when an item is selected for editing */
  onEdit?: (item: EnrollmentRowData) => void;
  /** Callback for when an item's status is toggled */
  onToggleStatus?: (item: EnrollmentRowData) => void;
  /** Callback for when an item is selected for viewing */
  onView?: (item: EnrollmentRowData) => void;
  /** The currently active tab ('Activas' or 'Inactivas') */
  activeTab?: "Activas" | "Inactivas";
  /** External loading state */
  loading?: boolean;
  /** Available period filter options */
  periodOptions?: FilterOption[];
  /** Available practice type filter options */
  practiceTypeOptions?: FilterOption[];
  /** Available career filter options */
  careerOptions?: FilterOption[];
  /** Callback to generate a report from the filtered data */
  onReport?: (data: EnrollmentRowData[]) => void;
}

/**
 * Keys available for sorting the table.
 */
type SortKey = "studentName" | "careerName" | "academicTutorName" | "methodologicalTutorName" | "institutionName" | "practiceType" | "period";

/**
 * Sorting order.
 */
type SortOrder = "asc" | "desc";

/**
 * Props for the ActionButtons sub-component.
 */
interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  status: boolean;
  isMobile?: boolean;
  canEdit?: boolean;
  canToggle?: boolean;
}

/**
 * Sub-component for rendering action buttons (view, edit, toggle status).
 */
const ActionButtons = ({
  onView,
  onEdit,
  onToggleStatus,
  status,
  isMobile = false,
  canEdit = false,
  canToggle = false,
}: ActionButtonsProps) => {
  const containerClasses = isMobile 
    ? "flex flex-col gap-3 pt-2" 
    : "flex justify-end gap-3";

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
        />
      )}
      {canEdit && status && onEdit && (
        <AsyncActionButton
          onClick={async () => onEdit()}
          icon={<EditIcon />}
          tooltip="Editar"
          label={isMobile ? "Editar Inscripción" : undefined}
          variant="primary"
          fullWidth={isMobile}
        />
      )}
      {canToggle && onToggleStatus && (
        <AsyncActionButton
          onClick={async () => onToggleStatus()}
          icon={status ? <TrashIcon /> : <RefreshIcon />}
          tooltip={status ? "Eliminar" : "Restaurar"}
          label={isMobile ? (status ? "Eliminar Inscripción" : "Restaurar Inscripción") : undefined}
          variant={status ? "danger" : "success"}
          fullWidth={isMobile}
        />
      )}
    </div>
  );
};

/**
 * Table component for displaying and filtering student enrollments.
 * 
 * Supports searching, multiple filters (period, practice type, career),
 * sorting, and pagination. Also includes a mobile-responsive expanded view.
 */
export default function EnrollmentTable({
  data = [],
  status,
  error,
  onEdit,
  onToggleStatus,
  onView,
  activeTab = "Activas",
  loading: externalLoading,
  periodOptions = [],
  practiceTypeOptions = [],
  careerOptions = [],
}: EnrollmentTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [periodFilter, setPeriodFilter] = useState("");
    const [practiceTypeFilter, setPracticeTypeFilter] = useState("");
    const [careerFilter, setCareerFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
        key: "studentName",
        order: "asc",
    });

    const debouncedSearch = useDebounce(searchTerm, 300);
    const [students, setStudents] = useState<Student[]>([]);
    const [allCareers, setAllCareers] = useState<Career[]>([]);
    const [careerAbbrById, setCareerAbbrById] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadRefs = async () => {
            try {
                const [studentsResp, careers] = await Promise.all([getStudents(), getCareers()]);
                setStudents(studentsResp.data);
                setAllCareers(careers);
                const map: Record<string, string> = {};
                careers.forEach(c => { map[String(c.careerId)] = (c.careerAbbreviation || "").toUpperCase(); });
                setCareerAbbrById(map);
            } catch {
                // silencioso: si falla, simplemente no mostramos matrícula
            }
        };
        loadRefs();
    }, []);

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

    const computeMatricula = (row: EnrollmentRowData): string => {
        const ci = `${row.identificationPrefix}-${row.identificationNumber}`;
        const student = students.find(s => `${s.identificationPrefix}-${s.identificationNumber}` === ci);
        if (!student) return "";
        const abbr = careerAbbrById[String(student.careerId ?? "")] || "GEN";
        return generateMatricula({
            careerAbbreviation: abbr,
            regime: student.regime,
            semester: student.semester,
            section: student.section,
        });
    };

    const filteredData = useMemo(() => {
        const search = debouncedSearch.trim().toLowerCase();
        const periodSearch = periodFilter.trim().toLowerCase();
        const practiceTypeSearch = practiceTypeFilter.trim().toLowerCase();
        const careerSearch = careerFilter.trim().toLowerCase();

        const filtered = data.filter((s) => {
            const matchesSearch = !search || 
                s.identificationNumber.toLowerCase().includes(search) || 
                s.studentName.toLowerCase().includes(search) ||
                (s.careerName && s.careerName.toLowerCase().includes(search));
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
            const allIds = paged.map((s: EnrollmentRowData, index: number) => s.enrollmentId ?? `idx-${index}`);
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

    const uniquePeriods = useMemo(() => {
        if (periodOptions.length > 0) return periodOptions;
        
        const fromData = Array.from(new Set(data.map(item => item.period).filter(Boolean))).sort();
        return fromData.map(p => ({ value: p, label: p }));
    }, [data, periodOptions]);

    const uniqueCareers = useMemo(() => {
        // Si hay un tipo de práctica seleccionado, filtrar carreras por ese tipo
        let filteredCareers = allCareers;
        if (practiceTypeFilter) {
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

    if ((status === "loading" || externalLoading) && data.length === 0) {
        return (
            <div className="table-container">
                <TableSkeleton columns={8} rows={itemsPerPage} />
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-bg-main dark:bg-bg-dark rounded-xl border border-border-light dark:border-border-dark">
                <div className="w-12 h-12 bg-error-50 dark:bg-error-950 rounded-full flex items-center justify-center text-error-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-error-600 dark:text-error-400">Error de conexión</h3>
                <p className="mt-2 text-text-secondary dark:text-text-tertiary font-medium">
                    no hay conexion a la bd
                </p>
                {error && error.message !== 'no hay conexion a la bd' && (
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
                            placeholder="Buscar por cédula, nombre o carrera"
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
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis appearance-none"
                        >
                            <option value="" className="dark:bg-bg-dark">Todos los Períodos</option>
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
                            <option value="" className="dark:bg-bg-dark">Todos los Tipos de Prácticas</option>
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
                            <option value="" className="dark:bg-bg-dark">Todas las Carreras</option>
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
                    {(searchTerm || periodFilter || practiceTypeFilter || careerFilter) && (
                        <button
                            onClick={clearFilters}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition-colors"
                        >
                            <RefreshIcon className="icon-xs" />
                            Limpiar filtros
                        </button>
                    )}

                    <div className="flex items-center gap-2">
                        {paged.length > 0 && (
                            <button
                                onClick={toggleAllRows}
                                className="md:hidden flex items-center gap-2 rounded-lg bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-emphasis dark:bg-white/5 dark:text-text-tertiary transition-colors min-h-12"
                            >
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
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block max-w-full overflow-x-auto table-scrollbar">
                <Table className="table-root">
                    <TableHeader className="table-header-row">
                        <TableRow>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("studentName")}>
                                <div className="flex items-center">Estudiante <SortIndicator column="studentName" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("careerName")}>
                                <div className="flex items-center">Carrera <SortIndicator column="careerName" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell">Matrícula</TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("academicTutorName")}>
                                <div className="flex items-center">Tutor Académico <SortIndicator column="academicTutorName" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("methodologicalTutorName")}>
                                <div className="flex items-center">Tutor Metodológico <SortIndicator column="methodologicalTutorName" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("institutionName")}>
                                <div className="flex items-center">Institución <SortIndicator column="institutionName" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell">Responsable</TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("practiceType")}>
                                <div className="flex items-center">Tipo Práctica <SortIndicator column="practiceType" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell cursor-pointer group" onClick={async () => handleSort("period")}>
                                <div className="flex items-center">Periodo <SortIndicator column="period" /></div>
                            </TableCell>
                            <TableCell isHeader className="table-header-cell text-right">&nbsp;</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border-light dark:divide-border-dark">
                        {paged.length > 0 ? (
                            paged.map((s: EnrollmentRowData) => (
                                <TableRow 
                                    key={s.enrollmentId}
                                    className="table-row-hover"
                                >
                                    <TableCell className="table-cell font-medium text-text-primary dark:text-text-emphasis">
                                        <div className="flex flex-col">
                                            <span>{s.studentName}</span>
                                            <span className="text-xs text-text-tertiary uppercase">{s.identificationPrefix}-{maskIdentification(s.identificationNumber)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.careerName || "No asignada"}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {computeMatricula(s) || "—"}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.academicTutorName}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.methodologicalTutorName}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.institutionName}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.institutionResponsibleName}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.practiceType}
                                    </TableCell>
                                    <TableCell className="table-cell text-text-secondary dark:text-text-tertiary">
                                        {s.period}
                                    </TableCell>
                                    <TableCell className="table-cell text-right">
                                        <ActionButtons
                                            onView={onView ? () => onView(s) : undefined}
                                            onEdit={onEdit ? () => onEdit(s) : undefined}
                                            onToggleStatus={onToggleStatus ? () => onToggleStatus(s) : undefined}
                                            status={s.status}
                                            canEdit={!!onEdit}
                                            canToggle={!!onToggleStatus}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="p-0">
                                    <EmptyState
                                        title="No se encontraron inscripciones"
                                        description={searchTerm || periodFilter ? "Pruebe ajustando sus filtros de búsqueda." : "No hay registros de inscripciones para mostrar."}
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View (Card format) */}
            <div className="md:hidden divide-y divide-border-light dark:divide-border-dark">
                {paged.length > 0 ? (
                    paged.map((s: EnrollmentRowData) => {
                        const isExpanded = expandedRows.has(s.enrollmentId ?? "");

                        return (
                            <div key={s.enrollmentId} className="relative p-4 bg-bg-main dark:bg-transparent transition-colors overflow-hidden">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex-1 text-center">
                                            <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis leading-tight truncate px-8 uppercase">
                                                {s.studentName}
                                            </h3>
                                            <p className="text-xs text-text-tertiary mt-1 truncate uppercase">{s.identificationPrefix}-{maskIdentification(s.identificationNumber)}</p>
                                        </div>
                                        <button
                                            onClick={async () => toggleRowExpansion(s.enrollmentId ?? "")}
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
                                            <div className="flex flex-col items-center col-span-2">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Carrera</p>
                                                <p className="text-sm font-bold text-text-primary dark:text-text-emphasis leading-tight">{s.careerName || "No asignada"}</p>
                                            </div>
                                            <div className="flex flex-col items-center col-span-2">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Institución</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium">{s.institutionName}</p>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Tutor Académico</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium text-center line-clamp-2">{s.academicTutorName}</p>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Tipo Práctica</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium">{s.practiceType}</p>
                                            </div>
                                            <div className="flex flex-col items-center col-span-2">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Periodo</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium">{s.period}</p>
                                            </div>
                                            <div className="flex flex-col items-center col-span-2">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary dark:text-text-tertiary mb-1.5">Matrícula</p>
                                                <p className="text-sm text-text-primary dark:text-text-secondary font-medium">{computeMatricula(s) || "—"}</p>
                                            </div>
                                        </div>

                                        <ActionButtons
                                            onView={onView ? () => onView(s) : undefined}
                                            onEdit={onEdit ? () => onEdit(s) : undefined}
                                            onToggleStatus={onToggleStatus ? () => onToggleStatus(s) : undefined}
                                            status={s.status}
                                            canEdit={!!onEdit}
                                            canToggle={!!onToggleStatus}
                                            isMobile={true}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center animate-fadeIn">
                        <EmptyState
                            title="No se encontraron inscripciones"
                            description={searchTerm || periodFilter ? "Pruebe ajustando sus filtros de búsqueda." : "No hay registros de inscripciones para mostrar."}
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
