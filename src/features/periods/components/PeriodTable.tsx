import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../context/ThemeContext";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
import { EditIcon, TrashIcon, ThreeDotsIcon, PlayIcon, CheckCircleIcon, RefreshIcon, EyeIcon } from "../../../icons/actions";
import { Periodo, PeriodoRowData } from "../types";

interface ActionMenuProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onStart?: () => void;
    onCulminate?: () => void;
    onRestore?: () => void;
    onView?: () => void;
    onOpen: () => void;
    onClose: () => void;
    periodo: PeriodoRowData;
}

const ActionMenu = ({ onEdit, onDelete, onStart, onCulminate, onRestore, onView, onOpen, onClose, periodo }: ActionMenuProps) => {
    const { colorMode } = useTheme();
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
                >
                    <Dropdown
                        isOpen={isOpen}
                        onClose={() => { setIsOpen(false); setHighlighted(false); onClose(); }} // Cierra el menú y resetea el estado
                        className={`w-40 min-w-[150px] rounded-md border border-stroke bg-white p-2 shadow-lg dark:border-strokedark dark:bg-boxdark animate-fadeIn ${colorMode === 'dark' ? 'dark' : ''}`}
                    >
                        {periodo.status && periodo.periodStatus !== 3 && onEdit && (
                            <DropdownItem
                                onItemClick={(e) => { e?.stopPropagation(); setIsOpen(false); setHighlighted(false); onClose(); onEdit(); }}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-meta-4"
                            >
                                <EditIcon className="w-4 h-4" />
                                Editar
                            </DropdownItem>
                        )}
                        {periodo.status && periodo.periodStatus === 1 && onStart && (
                            <DropdownItem
                                onItemClick={(e) => { e?.stopPropagation(); setIsOpen(false); setHighlighted(false); onClose(); onStart(); }}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 dark:text-green-500 dark:hover:bg-meta-4"
                            >
                                <PlayIcon className="w-4 h-4" />
                                Iniciar
                            </DropdownItem>
                        )}
                        {periodo.status && periodo.periodStatus === 2 && onCulminate && (
                            <DropdownItem
                                onItemClick={(e) => { e?.stopPropagation(); setIsOpen(false); setHighlighted(false); onClose(); onCulminate(); }}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-meta-4"
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                Culminar
                            </DropdownItem>
                        )}
                        {periodo.status && periodo.periodStatus === 3 && onView && (
                            <DropdownItem
                                onItemClick={(e) => { e?.stopPropagation(); setIsOpen(false); setHighlighted(false); onClose(); onView(); }}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-meta-4"
                            >
                                <EyeIcon className="w-4 h-4" />
                                Ver
                            </DropdownItem>
                        )}
                        {!periodo.status && onRestore && (
                            <DropdownItem
                                onItemClick={(e) => { e?.stopPropagation(); setIsOpen(false); setHighlighted(false); onClose(); onRestore(); }}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-meta-4"
                            >
                                <RefreshIcon className="w-4 h-4" />
                                Restaurar
                            </DropdownItem>
                        )}
                        {periodo.status && periodo.periodStatus === 1 && onDelete && (
                            <DropdownItem
                                onItemClick={(e) => { e?.stopPropagation(); setIsOpen(false); setHighlighted(false); onClose(); onDelete(); }}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:text-red-500 dark:hover:bg-meta-4"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Eliminar
                            </DropdownItem>
                        )}
                    </Dropdown>
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
    onEdit?: (periodo: PeriodoRowData) => void;
    onStart?: (periodo: PeriodoRowData) => void;
    onCulminate?: (periodo: PeriodoRowData) => void;
    onDelete?: (id: string) => void;
    onRestore?: (periodo: PeriodoRowData) => void;
    onView?: (periodo: PeriodoRowData) => void;
    // La propiedad progress es calculada en el componente padre
}

export default function PeriodTable({ data, status, error, onEdit, onStart, onCulminate, onDelete, onRestore, onView }: PeriodTableProps) {
    const [highlightedRow, setHighlightedRow] = useState<string | null>(null);

    // Estados para búsqueda y paginación
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("Todos");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Filtrado de datos
    const filteredData = data.filter((periodo) => {
        const matchesSearch = periodo.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "Todos" || periodo.periodStatus.toString() === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Lógica de paginación
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Resetear a la primera página cuando cambia la búsqueda
    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const getStatusColor = (status: number) => {
        switch (status) {
            case 2: // En Curso
                return 'success';
            case 1: // Pendiente
                return 'warning';
            case 3: // Culminado
                return 'error';
            default:
                return 'warning';
        }
    };

    const getStatusLabel = (status: number) => {
        switch (status) {
            case 1: return 'Pendiente';
            case 2: return 'En Curso';
            case 3: return 'Culminado';
            default: return 'Desconocido';
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
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
            {/* Barra de Búsqueda y Filtro */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-xs w-full">
                    <input
                        type="text"
                        placeholder="Buscar por lapso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </span>
                </div>
                <div className="relative w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-transparent py-2 px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="Todos" className="dark:bg-gray-800">Todos los estados</option>
                        <option value="2" className="dark:bg-gray-800">En Curso</option>
                        <option value="1" className="dark:bg-gray-800">Pendiente</option>
                        <option value="3" className="dark:bg-gray-800">Culminado</option>
                    </select>
                </div>
            </div>
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/5">
                        <TableRow>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Descripción</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha Inicio</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Fecha Fin</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Progreso</TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">Acciones</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                        {status === 'loading' ? (
                            <TableRow>
                                <td colSpan={6} className="py-10 text-center text-gray-500 dark:text-gray-400">Cargando periodos...</td>
                            </TableRow>
                        ) : currentData.length > 0 ? (
                            currentData.map((periodo) => (
                                <TableRow key={periodo.periodId} className={highlightedRow === periodo.periodId ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                                    <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">{periodo.description}</TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{periodo.startDate}</TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{periodo.endDate}</TableCell>
                                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                                        <Badge size="sm" color={getStatusColor(periodo.periodStatus)}>{getStatusLabel(periodo.periodStatus)}</Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                                        {periodo.periodStatus === 2 && periodo.progress !== null ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div
                                                        className="bg-blue-600 h-2.5 rounded-full"
                                                        style={{ width: `${periodo.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{Math.round(periodo.progress ?? 0)}%</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-5 py-3 text-end">
                                        <ActionMenu
                                            onEdit={onEdit ? () => onEdit(periodo) : undefined}
                                            onStart={onStart ? () => onStart(periodo) : undefined}
                                            onCulminate={onCulminate ? () => onCulminate(periodo) : undefined}
                                            onView={onView ? () => onView(periodo) : undefined}
                                            onDelete={onDelete ? () => onDelete(periodo.periodId) : undefined}
                                            onRestore={onRestore ? () => onRestore(periodo) : undefined}
                                            onOpen={() => setHighlightedRow(periodo.periodId)}
                                            onClose={() => setHighlightedRow(null)}
                                            periodo={periodo}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <td colSpan={6} className="py-10 text-center text-gray-500 dark:text-gray-400">No hay periodos para mostrar.</td>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Controles de Paginación */}
            {filteredData.length > 0 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-white/5 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                            Siguiente
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                    Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> de <span className="font-medium">{filteredData.length}</span> resultados
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="rounded border border-gray-300 bg-transparent py-1 px-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-white/5"
                                >
                                    <span className="sr-only">Anterior</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-white/5"
                                >
                                    <span className="sr-only">Siguiente</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}