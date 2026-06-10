/**
 * @file UserTable.tsx
 * @description Componente de tabla para visualizar y gestionar usuarios.
 */

import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import { AsyncActionButton } from "../../../components/common/AsyncActionButton";
import { EditIcon, TrashIcon, RefreshIcon, ChevronDownIcon, KeyIcon, EyeIcon } from "../../../icons/actions";
import { UserRowData } from "../types";
import Checkbox from "../../../components/form/input/Checkbox";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import Badge from "../../../components/ui/badge/Badge";
import { maskEmail } from "../../../utils/maskData";
import { AuthUser } from "../../../context/auth";

/**
 * Propiedades para el componente UserTable.
 */
interface UserTableProps {
    /** Lista de usuarios a mostrar */
    data: UserRowData[];
    /** Estado de la carga de datos */
    status: "loading" | "success" | "error";
    /** Error en caso de fallo en la carga */
    error: Error | null;
    /** Función para editar un usuario */
    onEdit?: (user: UserRowData) => void;
    /** Función para cambiar el estado de un usuario */
    onToggleStatus?: (user: UserRowData) => void;
    /** Función para resetear clave de un usuario */
    onResetPassword?: (user: UserRowData) => void;
    /** Función para ver detalle de un usuario */
    onViewDetail?: (user: UserRowData) => void;
    /** Mapa de roles (ID -> Nombre) */
    rolesMap: Record<number, string>;
    /** Lista de IDs seleccionados */
    selectedIds: number[];
    /** Función para seleccionar/deseleccionar una fila */
    onSelectRow: (id: number, checked: boolean) => void;
    /** Función para seleccionar/deseleccionar todas las filas */
    onSelectAll: (checked: boolean) => void;
    /** Página actual */
    currentPage: number;
    /** Total de páginas */
    totalPages: number;
    /** Total de elementos */
    totalItems: number;
    /** Elementos por página */
    itemsPerPage: number;
    /** Función al cambiar de página */
    onPageChange: (page: number) => void;
    /** Función al cambiar elementos por página */
    onItemsPerPageChange: (limit: number) => void;
    /** Filtros actuales */
    filters: {
        ci: string;
        name: string;
        surname: string;
        role: string;
    };
    /** Función para actualizar filtros */
    onFilterChange: (filters: any) => void;
    /** Opciones de roles para el filtro */
    rolesOptions: { value: string; label: string }[];
    /** Función para limpiar filtros */
    onClearFilters: () => void;
    /** Usuario actual logueado */
    currentUser?: AuthUser | null;
}

/**
 * Propiedades para los botones de acción.
 */
interface ActionButtonsProps {
    onEdit?: () => void;
    onToggleStatus?: () => void;
    onResetPassword?: () => void;
    onViewDetail?: () => void;
    status: number;
    isMobile?: boolean;
    userId?: number;
    currentUserId?: number;
}

/**
 * Renderiza los botones de acción para cada fila.
 */
const ActionButtons = ({
    onEdit,
    onToggleStatus,
    onResetPassword,
    onViewDetail,
    status,
    isMobile = false,
    userId,
    currentUserId,
}: ActionButtonsProps) => {
    const isCurrentUser = userId === currentUserId;
    const containerClasses = isMobile 
        ? "flex flex-col gap-3 pt-2" 
        : "flex justify-end gap-3";

    return (
        <div className={containerClasses}>
            {onEdit && (
                <AsyncActionButton
                    onClick={async () => onEdit()}
                    icon={<EditIcon />}
                    tooltip="Editar usuario"
                    label={isMobile ? "Editar Usuario" : undefined}
                    variant="primary"
                    fullWidth={isMobile}
                />
            )}
            {onViewDetail && (
                <AsyncActionButton
                    onClick={async () => onViewDetail()}
                    icon={<EyeIcon />}
                    tooltip="Ver detalle"
                    label={isMobile ? "Ver Detalle" : undefined}
                    variant="info"
                    fullWidth={isMobile}
                />
            )}
            {onResetPassword && status === 1 && (
                <AsyncActionButton
                    onClick={async () => await onResetPassword()}
                    icon={<KeyIcon />}
                    tooltip="Resetear clave"
                    label={isMobile ? "Resetear Clave" : undefined}
                    variant="warning"
                    fullWidth={isMobile}
                />
            )}
            {onToggleStatus && (
                <AsyncActionButton
                    onClick={async () => { if (!isCurrentUser) await onToggleStatus(); }}
                    disabled={isCurrentUser}
                    icon={status === 1 ? <TrashIcon /> : <RefreshIcon />}
                    tooltip={isCurrentUser ? "No puedes desactivarte a ti mismo" : (status === 1 ? "Desactivar usuario" : "Activar usuario")}
                    label={isMobile ? (status === 1 ? "Desactivar Usuario" : "Activar Usuario") : undefined}
                    variant={status === 1 ? "error" : "success"}
                    fullWidth={isMobile}
                />
            )}
        </div>
    );
};

/**
 * Componente principal de la tabla de usuarios.
 */
export default function UserTable({
    data = [],
    status,
    error,
    onEdit,
    onToggleStatus,
    onResetPassword,
    onViewDetail,
    rolesMap,
    selectedIds,
    onSelectRow,
    onSelectAll,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    filters,
    onFilterChange,
    rolesOptions,
    onClearFilters,
    currentUser
}: UserTableProps) {
    const currentUserId = currentUser?.id;
    if (status === "error") {
        return (
            <div className="rounded-xl border border-alert-error-border bg-alert-error-bg p-8 text-center dark:border-error-800 dark:bg-error-950 animate-fadeIn">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
                    <svg className="h-6 w-6 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-alert-error-text dark:text-error-400">Error de conexión</h3>
                <p className="mt-2 text-text-secondary dark:text-text-tertiary font-medium">
                    {error?.message || "No se pudieron cargar los usuarios."}
                </p>
            </div>
        );
    }

    return (
        <div className="table-container">
            {/* Filtros */}
            <div className="p-4 border-b border-border-light dark:border-border-dark space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por cédula"
                            value={filters.ci}
                            onChange={(e) => onFilterChange({ ...filters, ci: e.target.value })}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </span>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar nombres"
                            value={filters.name}
                            onChange={(e) => onFilterChange({ ...filters, name: e.target.value })}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-4 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark"
                        />
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar apellidos"
                            value={filters.surname}
                            onChange={(e) => onFilterChange({ ...filters, surname: e.target.value })}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-4 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={filters.role}
                            onChange={(e) => onFilterChange({ ...filters, role: e.target.value })}
                            className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark appearance-none"
                        >
                            <option value="">Todos los roles</option>
                            {rolesOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            <ChevronDownIcon className="h-4 w-4" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-text-secondary dark:text-text-tertiary">
                            Mostrando <span className="font-bold text-text-primary dark:text-text-emphasis">{data.length}</span> resultados
                        </div>
                        {(filters.ci || filters.name || filters.surname || filters.role) && (
                            <button
                                onClick={onClearFilters}
                                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition-colors"
                            >
                                <RefreshIcon className="icon-xs" />
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="hidden md:block overflow-x-auto">
                <Table className="table-root">
                    <TableHeader className="table-header-row bg-bg-secondary dark:bg-bg-dark/50">
                        <TableRow>
                            <TableCell isHeader className="table-header-cell w-10">
                                <Checkbox
                                    checked={data.length > 0 && data.filter(u => !u.isInUse).every(u => selectedIds.includes(u.id))}
                                    onChange={onSelectAll}
                                />
                            </TableCell>
                            <TableCell isHeader className="table-header-cell">Cédula</TableCell>
                            <TableCell isHeader className="table-header-cell">Nombres y Apellidos</TableCell>
                            <TableCell isHeader className="table-header-cell">Correo Electrónico</TableCell>
                            <TableCell isHeader className="table-header-cell">Rol</TableCell>
                            <TableCell isHeader className="table-header-cell text-right">Acciones</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? (
                            data.map((user, idx) => (
                                <TableRow key={user.id} className={idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-bg-secondary/50 dark:bg-white/2"}>
                                    <TableCell className="table-cell">
                                        <Tooltip
                                            content={user.isInUse ? "Este usuario tiene registros asociados y no puede ser seleccionado para eliminar" : ""}
                                            isDisabled={!user.isInUse}
                                        >
                                            <div>
                                                <Checkbox
                                                    checked={selectedIds.includes(user.id)}
                                                    onChange={(checked) => onSelectRow(user.id, checked)}
                                                    disabled={user.isInUse}
                                                />
                                            </div>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="table-cell font-medium uppercase">{user.userCi}</TableCell>
                                    <TableCell className="table-cell uppercase">{user.name} {user.surname}</TableCell>
                                    <TableCell className="table-cell lowercase">{maskEmail(user.email)}</TableCell>
                                    <TableCell className="table-cell">
                                    <Badge color={user.role === 1 ? "error" : "info"} variant="light" size="sm">
                                            {rolesMap[user.role] || "USUARIO"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="table-cell text-right">
                                        <ActionButtons
                                            status={user.status}
                                            onEdit={() => onEdit?.(user)}
                                            onViewDetail={() => onViewDetail?.(user)}
                                            onToggleStatus={() => onToggleStatus?.(user)}
                                            onResetPassword={() => onResetPassword?.(user)}
                                            userId={user.id}
                                            currentUserId={currentUserId}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="table-cell py-12 text-center text-text-tertiary">
                                    No se encontraron usuarios.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginación */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
                itemsPerPageOptions={[5, 10, 25, 50]}
            />
        </div>
    );
}
