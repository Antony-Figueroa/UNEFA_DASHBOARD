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
import { ActionButton } from "../../../components/common/ActionButton";
import Badge from "../../../components/ui/badge/Badge";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { TableSkeleton } from "../../../components/ui/table/TableSkeleton";
import InputField from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import {
    EditIcon,
    TrashIcon,
    EyeIcon,
    RefreshIcon,
} from "../../../icons/actions";
import { TrackingRowData } from "../types";

interface TrackingTableProps {
    data: TrackingRowData[];
    status: "loading" | "success" | "error";
    error: Error | null;
    onEdit?: (tracking: TrackingRowData) => void;
    onDelete?: (id: string) => void;
    onRestore?: (tracking: TrackingRowData) => void;
    onView?: (tracking: TrackingRowData) => void;
    transferOptions?: { value: string; label: string }[];
}

interface ActionButtonsProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onRestore?: () => void;
    onView?: () => void;
    status: boolean;
    isMobile?: boolean;
}

const ActionButtons = ({
    onEdit,
    onDelete,
    onRestore,
    onView,
    status,
    isMobile = false,
}: ActionButtonsProps) => {
    const containerClasses = isMobile 
        ? "flex flex-col gap-3 pt-2" 
        : "flex justify-end gap-3";

    return (
        <div className={containerClasses}>
            {onView && (
                <ActionButton
                    onClick={() => onView()}
                    icon={<EyeIcon />}
                    tooltip="Ver Detalles"
                    label={isMobile ? "Ver Detalles" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                />
            )}
            {onEdit && (
                <ActionButton
                    onClick={() => onEdit()}
                    icon={<EditIcon />}
                    tooltip="Editar"
                    label={isMobile ? "Editar Seguimiento" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                />
            )}
            {status ? (
                onDelete && (
                    <ActionButton
                        onClick={() => onDelete()}
                        icon={<TrashIcon />}
                        tooltip="Inactivar"
                        label={isMobile ? "Inactivar Seguimiento" : undefined}
                        variant="danger"
                        fullWidth={isMobile}
                    />
                )
            ) : (
                onRestore && (
                    <ActionButton
                        onClick={() => onRestore()}
                        icon={<RefreshIcon />}
                        tooltip="Restaurar"
                        label={isMobile ? "Restaurar Seguimiento" : undefined}
                        variant="success"
                        fullWidth={isMobile}
                    />
                )
            )}
        </div>
    );
};

export default function TrackingTable({
    data,
    status,
    error,
    onEdit,
    onDelete,
    onRestore,
    onView,
    transferOptions = [],
}: TrackingTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [idFilter, setIdFilter] = useState("");
    const [nameFilter, setNameFilter] = useState("");
    const [transferFilter, setTransferFilter] = useState("");

    // Filtrado de datos
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesId = item.studentIdNumber.toLowerCase().includes(idFilter.toLowerCase());
            const matchesName = item.studentName.toLowerCase().includes(nameFilter.toLowerCase());
            const matchesTransfer = transferFilter === "" || String(item.transfer) === transferFilter;

            return matchesId && matchesName && matchesTransfer;
        });
    }, [data, idFilter, nameFilter, transferFilter]);

    // Lógica de paginación
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    // Resetear a la primera página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [idFilter, nameFilter, transferFilter]);

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-text-secondary dark:text-text-tertiary px-1">
                        Cédula
                    </label>
                    <InputField
                        placeholder="Filtrar por cédula..."
                        value={idFilter}
                        onChange={(e) => setIdFilter(e.target.value)}
                        className="bg-white dark:bg-white/5"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-text-secondary dark:text-text-tertiary px-1">
                        Nombre
                    </label>
                    <InputField
                        placeholder="Filtrar por nombre..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="bg-white dark:bg-white/5"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-text-secondary dark:text-text-tertiary px-1">
                        Traslado
                    </label>
                    <Select
                        options={[{ value: "", label: "Todos" }, ...transferOptions]}
                        value={transferFilter}
                        onChange={(value) => setTransferFilter(value)}
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
                            <TableCell isHeader>Título Informe</TableCell>
                            <TableCell isHeader>Traslado</TableCell>
                            <TableCell isHeader>Estado</TableCell>
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
                                <TableCell className="text-text-secondary dark:text-text-tertiary max-w-xs truncate">
                                    {item.reportTitle}
                                </TableCell>
                                <TableCell>
                                    <Badge color={item.transfer ? "info" : "light"}>
                                        {item.transfer ? "Sí" : "No"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge color={item.status ? "success" : "error"}>
                                        {item.status ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="table-cell text-right">
                                    <ActionButtons
                                        onView={onView ? () => onView(item) : undefined}
                                        onEdit={onEdit ? () => onEdit(item) : undefined}
                                        onDelete={onDelete ? () => onDelete(item.trackingId) : undefined}
                                        onRestore={onRestore ? () => onRestore(item) : undefined}
                                        status={item.status}
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
