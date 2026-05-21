/**
 * @file TrackingTable.tsx
 * @description Tabla para visualizar y gestionar los seguimientos de estudiantes.
 */

import { useState, useMemo, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    Pagination,
} from "../../../components/ui/table";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { TableSkeleton } from "../../../components/ui/skeleton";
import CustomSelect from "../../../components/form/CustomSelect";
import {
    EditIcon,
    TrashIcon,
    EyeIcon,
    RefreshIcon,
    CalendarIcon,
} from "../../../icons/actions";
import { TrackingRowData } from "../types";
import { matchSearch } from "../../../utils/searchNormalizer";

/**
 * Propiedades del componente TrackingTable.
 */
interface TrackingTableProps {
    /** Arreglo de datos de seguimiento para mostrar */
    data: TrackingRowData[];
    /** Estado de carga de los datos */
    status: "loading" | "success" | "error" | "idle";
    /** Error capturado si el estado es 'error' */
    error: Error | null;
    /** Función llamada al solicitar editar un registro */
    onEdit?: (tracking: TrackingRowData) => void;
    /** Función llamada al solicitar eliminar/inactivar un registro */
    onDelete?: (tracking: TrackingRowData) => void;
    /** Función llamada al solicitar restaurar un registro inactivo */
    onRestore?: (tracking: TrackingRowData) => void;
    /** Función llamada al solicitar ver detalles de un registro */
    onView?: (tracking: TrackingRowData) => void;
    /** Función llamada al solicitar ir a registro de visitas */
    onVisitRegistration?: (tracking: TrackingRowData) => void;
    /** Función llamada al solicitar ir a registro de actividades */
    onActivityLogs?: (tracking: TrackingRowData) => void;
    /** Opciones para el filtro de traslado */
    transferOptions?: { value: string; label: string }[];
}

/**
 * Propiedades del componente interno ActionButtons.
 */
interface ActionButtonsProps {
    /** Callback for requesting a confirmation dialog */
    onRequestConfirm: (type: 'edit' | 'delete' | 'restore') => void;
    /** Callback for ver detalles */
    onView?: () => void;
    /** Callback for ir a registro de visitas */
    onVisitRegistration?: () => void;
    /** Callback for ir a registro de actividades */
    onActivityLogs?: () => void;
    /** Estado actual del registro (activo/inactivo) */
    status: boolean;
    /** Indica si se debe renderizar en modo móvil */
    isMobile?: boolean;
    /** Whether editing is allowed */
    canEdit?: boolean;
    /** Whether deleting is allowed */
    canDelete?: boolean;
    /** Whether restoring is allowed */
    canRestore?: boolean;
}

/**
 * Componente interno para renderizar los botones de acción de cada fila.
 */
const ActionButtons = ({
    onRequestConfirm,
    onView,
    onVisitRegistration,
    onActivityLogs,
    status,
    isMobile = false,
    canEdit = false,
    canDelete = false,
    canRestore = false,
}: ActionButtonsProps) => {
    const containerClasses = isMobile 
        ? "flex flex-col gap-2 pt-2" 
        : "flex justify-end gap-2";

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
            {canEdit && (
                <AsyncActionButton
                    onClick={async () => onRequestConfirm('edit')}
                    icon={<EditIcon />}
                    tooltip="Editar"
                    label={isMobile ? "Editar Seguimiento" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                />
            )}
            {/* Botón de Visitas en la botonera (versión móvil) */}
            {onVisitRegistration && (
                <AsyncActionButton
                    onClick={async () => onVisitRegistration()}
                    icon={<CalendarIcon />}
                    tooltip="Registro de Visitas"
                    label={isMobile ? "Visitas" : undefined}
                    variant="info"
                    fullWidth={isMobile}
                />
            )}
            {onActivityLogs && (
                <AsyncActionButton
                    onClick={async () => onActivityLogs()}
                    icon={<CalendarIcon />}
                    tooltip="Registro de Actividades"
                    label={isMobile ? "Actividades" : undefined}
                    variant="warning"
                    fullWidth={isMobile}
                />
            )}
        </div>
    );
};

/**
 * Componente TrackingTable.
 * 
 * Muestra una tabla paginada y filtrable de registros de seguimiento.
 * Permite realizar acciones de edición, eliminación y visualización.
 */
export default function TrackingTable({
    data,
    status,
    error,
    onEdit,
    onDelete,
    onRestore,
    onView,
    onVisitRegistration,
    onActivityLogs,
    transferOptions = [],
}: TrackingTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [transferFilter, setTransferFilter] = useState("");

    const handleRequestConfirm = (type: 'edit' | 'delete' | 'restore', item: TrackingRowData) => {
        // Direct action without confirmation dialog
        if (type === 'edit' && onEdit) {
            onEdit(item);
        } else if (type === 'delete' && onDelete) {
            onDelete(item);
        } else if (type === 'restore' && onRestore) {
            onRestore(item);
        }
    };

    // Filtrado de datos
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch = !searchTerm.trim() || matchSearch(item.studentIdNumber, searchTerm) || matchSearch(item.studentName, searchTerm);
            const matchesTransfer = transferFilter === "" || String(item.transfer) === transferFilter;

            return matchesSearch && matchesTransfer;
        });
    }, [data, searchTerm, transferFilter]);

    // Lógica de paginación
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    // Resetear a la primera página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, transferFilter]);

    if (status === "loading") {
        return <TableSkeleton rows={5} />;
    }

    if (status === "error") {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-error-500 font-medium">Error al cargar los datos</p>
                <p className="text-text-secondary text-sm">{error?.message}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return <EmptyState title="No hay seguimientos registrados" description="Comienza creando uno nuevo." />;
    }

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">Búsqueda</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por cédula o nombre"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent px-4 py-2.5 pl-10 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-border-dark dark:text-text-emphasis"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-text-secondary dark:text-text-tertiary px-1">
                        Traslado
                    </label>
                    <CustomSelect
                        id="transferFilter"
                        options={[{ value: "", label: "Todos" }, ...transferOptions].map(opt => ({ value: String(opt.value), label: opt.label }))}
                        value={String(transferFilter)}
                        onChange={(value) => setTransferFilter(value)}
                        placeholder="Filtrar por traslado"
                        className="bg-white dark:bg-white/5"
                    />
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border-light dark:border-white/5 bg-white dark:bg-white/3">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableCell isHeader>Cédula</TableCell>
                            <TableCell isHeader>Estudiante</TableCell>
                            <TableCell isHeader>Carrera</TableCell>
                            <TableCell isHeader>Título Informe</TableCell>
                            <TableCell isHeader>Visitas</TableCell>
                            <TableCell isHeader className="text-right pr-10">&nbsp;</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((item) => (
                            <TableRow key={item.trackingId}>
                                <TableCell className="font-medium text-text-primary dark:text-white/90">
                                    {item.studentIdNumber}
                                </TableCell>
                                <TableCell className="text-text-secondary dark:text-text-tertiary">
                                    {item.studentName}
                                </TableCell>
                                <TableCell className="text-text-secondary dark:text-text-tertiary">
                                    {item.careerName || "-"}
                                </TableCell>
                                <TableCell className="text-text-secondary dark:text-text-tertiary max-w-xs truncate">
                                    {item.reportTitle}
                                </TableCell>
                                <TableCell className="text-center">
                                    {onVisitRegistration && (
                                        <AsyncActionButton
                                            onClick={async () => onVisitRegistration(item)}
                                            icon={<CalendarIcon />}
                                            tooltip="Registro de Visitas"
                                            variant="primary"
                                        />
                                    )}
                                </TableCell>
                                <TableCell className="table-cell text-right">
                                    <ActionButtons
                                        onView={onView ? () => onView(item) : undefined}
                                        onRequestConfirm={(type) => handleRequestConfirm(type, item)}
                                        status={item.status}
                                        canEdit={!!onEdit}
                                        canDelete={!!onDelete}
                                        canRestore={!!onRestore}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredData.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            )}


        </div>
    );
}
