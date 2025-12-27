import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
import { EditIcon, TrashIcon, ThreeDotsIcon } from "../../../icons/actions";
import { Periodo, PeriodoRowData } from "../types";

interface ActionMenuProps {
    onEdit: () => void;
    onDelete: () => void;
    onOpen: () => void;
    onClose: () => void;
}

const ActionMenu = ({ onEdit, onDelete, onOpen, onClose }: ActionMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const dropdown = useRef<HTMLDivElement>(null);
    const [isTop, setIsTop] = useState(false);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
            setHighlighted(false);
            onClose();
        } else {
            if (trigger.current) {
                const rect = trigger.current.getBoundingClientRect();
                setTriggerRect(rect);
                const spaceBelow = window.innerHeight - rect.bottom;
                const menuHeight = 120; // Altura estimada del menú
                const showTop = spaceBelow < menuHeight;
                setIsTop(showTop);
                setIsOpen(true);
                setHighlighted(true);
                onOpen();
            }
        }
    };

    // Efecto para manejar el cierre del menú al hacer clic fuera,
    // hacer scroll o presionar la tecla 'Escape'.
    useEffect(() => {
        // Cierra el menú si se hace clic fuera de él.
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdown.current &&
                !dropdown.current.contains(event.target as Node) &&
                trigger.current &&
                !trigger.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setHighlighted(false);
                onClose();
            }
        };

        // Cierra el menú al hacer scroll para evitar que quede flotando.
        const handleScroll = () => {
            if (isOpen) {
                setIsOpen(false);
                setHighlighted(false);
                onClose();
            }
        };

        // Cierra el menú al presionar la tecla 'Escape'.
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setHighlighted(false);
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, true);
            window.addEventListener("resize", handleScroll);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleScroll);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]); // Depende de 'isOpen' para añadir/quitar listeners y de 'onClose' para que esté actualizado.

    return (
        <div className={`relative flex justify-end ${highlighted ? 'z-50' : ''}`}>
            <button
                ref={trigger}
                onClick={toggleMenu}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                title="Acciones"
            >
                <ThreeDotsIcon className="w-5 h-5" />
            </button>
            {isOpen && triggerRect && createPortal(
                <div
                    ref={dropdown}
                    style={{
                        position: "fixed",
                        top: isTop ? "auto" : triggerRect.bottom + 5,
                        bottom: isTop ? window.innerHeight - triggerRect.top + 5 : "auto",
                        left: triggerRect.right,
                        transform: "translateX(-100%)",
                        zIndex: 9999,
                    }}
                    className="w-40 min-w-[150px] rounded-md border border-stroke bg-white p-2 shadow-lg dark:border-strokedark dark:bg-boxdark animate-fadeIn"
                >
                    {/* La animación se define en un bloque de estilo global o aquí para encapsulamiento */}
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateX(-100%) scale(0.95); }
                            to { opacity: 1; transform: translateX(-100%) scale(1); }
                        }
                        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
                    `}</style>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); setHighlighted(false); onClose(); onEdit(); }}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-meta-4"
                    >
                        <EditIcon className="w-4 h-4" />
                        Editar
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); setHighlighted(false); onClose(); onDelete(); }}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:text-red-500 dark:hover:bg-meta-4"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Eliminar
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

interface PeriodTableProps {
    data: PeriodoRowData[];
    status: 'loading' | 'success' | 'error';
    error: Error | null;
    onEdit: (periodo: PeriodoRowData) => void;
    onDelete: (id: number) => void;
}

export default function PeriodTable({ data, status, error, onEdit, onDelete }: PeriodTableProps) {
    const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
    const getStatusColor = (status: Periodo['status']) => {
        switch (status) {
            case 'En Curso':
                return 'success';
            case 'Pendiente':
                return 'warning';
            case 'Finalizado':
                return 'error';
        }
    };

    if (status === 'error') {
        return (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
                <p className="font-medium text-red-600 dark:text-red-400">¡Ocurrió un error al cargar los datos!</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{error?.message || "Error desconocido"}</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                        <TableRow>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Lapso Académico</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha de Inicio</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha de Cierre</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {status === 'loading' ? (
                            <TableRow>
                                <td colSpan={5} className="py-10 text-center text-gray-500 dark:text-gray-400">Cargando periodos...</td>
                            </TableRow>
                        ) : data.length > 0 ? (
                            data.map((periodo) => (
                                <TableRow key={periodo.id} className={highlightedRow === periodo.id ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                                    <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{periodo.lapso}</TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{periodo.fechaInicio}</TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{periodo.fechaFin}</TableCell>
                                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                                        <Badge size="sm" color={getStatusColor(periodo.status)}>{periodo.status}</Badge>
                                    </TableCell>
                                    <TableCell className="px-5 py-3 text-end">
                                        <ActionMenu
                                            onEdit={() => onEdit(periodo)}
                                            onDelete={() => onDelete(periodo.id)}
                                            onOpen={() => setHighlightedRow(periodo.id)}
                                            onClose={() => setHighlightedRow(null)} />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <td colSpan={5} className="py-10 text-center text-gray-500 dark:text-gray-400">No hay periodos para mostrar.</td>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}