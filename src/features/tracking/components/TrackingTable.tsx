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
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import Badge from "../../../components/ui/badge/Badge";
import Button from "../../../components/ui/button/Button";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { TableSkeleton } from "../../../components/ui/table/TableSkeleton";
import {
    EditIcon,
    TrashIcon,
    ThreeDotsIcon,
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
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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
                            <TableCell isHeader className="text-right pr-10">Acciones</TableCell>
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
                                <TableCell className="text-right relative pr-10">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="ml-auto"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(openDropdownId === item.trackingId ? null : item.trackingId);
                                        }}
                                    >
                                        <ThreeDotsIcon className="h-5 w-5" />
                                    </Button>
                                    <Dropdown
                                        isOpen={openDropdownId === item.trackingId}
                                        onClose={() => setOpenDropdownId(null)}
                                        className="w-40"
                                    >
                                        <DropdownItem onItemClick={() => { onView?.(item); setOpenDropdownId(null); }}>
                                            <div className="flex items-center">
                                                <EyeIcon className="mr-2 h-4 w-4" />
                                                Ver Detalles
                                            </div>
                                        </DropdownItem>
                                        <DropdownItem onItemClick={() => { onEdit?.(item); setOpenDropdownId(null); }}>
                                            <div className="flex items-center">
                                                <EditIcon className="mr-2 h-4 w-4" />
                                                Editar
                                            </div>
                                        </DropdownItem>
                                        {item.status ? (
                                            <DropdownItem
                                                onItemClick={() => { onDelete?.(item.trackingId); setOpenDropdownId(null); }}
                                                className="text-error-500"
                                            >
                                                <div className="flex items-center">
                                                    <TrashIcon className="mr-2 h-4 w-4" />
                                                    Inactivar
                                                </div>
                                            </DropdownItem>
                                        ) : (
                                            <DropdownItem
                                                onItemClick={() => { onRestore?.(item); setOpenDropdownId(null); }}
                                                className="text-success-500"
                                            >
                                                <div className="flex items-center">
                                                    <RefreshIcon className="mr-2 h-4 w-4" />
                                                    Restaurar
                                                </div>
                                            </DropdownItem>
                                        )}
                                    </Dropdown>
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
