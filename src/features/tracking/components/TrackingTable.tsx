/**
 * @file TrackingTable.tsx
 * @description Tabla para visualizar y gestionar los seguimientos de estudiantes.
 */

import { useState, useMemo } from "react";
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
}: TrackingTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Lógica de paginación
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return data.slice(start, start + itemsPerPage);
    }, [data, currentPage, itemsPerPage]);

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
                    totalItems={data.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            )}
        </div>
    );
}
