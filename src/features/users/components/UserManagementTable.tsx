import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../../api/apiClient";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { useToast } from "../../../context/toast";
import ActionButton from "../../../components/common/ActionButton";
import { Table, TableBody, TableCell, TableHeader, TableRow, Pagination } from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
import { EditIcon, TrashIcon, RefreshIcon, ChevronDownIcon } from "../../../icons/actions";
import { useDebounce } from "../../../hooks/useDebounce";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import Checkbox from "../../../components/form/input/Checkbox";

interface User {
  id: number;
  userCi: string;
  name: string;
  surname: string;
  email: string;
  role: number;
  status: number;
  creationDate: string;
}

interface UserManagementTableProps {
  activeTab?: "Activos" | "Inactivos";
}

const ROLES_MAP: Record<number, string> = {
  1: "MAESTRO",
  2: "ASISTENTE"
};

interface ActionButtonsProps {
  onEdit?: () => void;
  onToggleStatus?: () => void;
  status: number;
  isMobile?: boolean;
}

const ActionButtons = ({
  onEdit,
  onToggleStatus,
  status,
  isMobile = false,
}: ActionButtonsProps) => {
  const containerClasses = isMobile 
    ? "flex flex-col gap-3 pt-2" 
    : "flex justify-end gap-3";

  return (
    <div className={containerClasses}>
      {onEdit && (
        <ActionButton
          onClick={() => onEdit()}
          icon={<EditIcon />}
          tooltip="Editar usuario"
          label={isMobile ? "Editar Usuario" : undefined}
          variant="primary"
          fullWidth={isMobile}
        />
      )}
      {onToggleStatus && (
        <ActionButton
          onClick={() => onToggleStatus()}
          icon={status === 1 ? <TrashIcon /> : <RefreshIcon />}
          tooltip={status === 1 ? "Desactivar usuario" : "Activar usuario"}
          label={isMobile ? (status === 1 ? "Desactivar Usuario" : "Activar Usuario") : undefined}
          variant={status === 1 ? "danger" : "success"}
          fullWidth={isMobile}
        />
      )}
    </div>
  );
};

/**
 * Componente de Gestión de Usuarios.
 * Rediseñado para coincidir visualmente con StudentTable.
 */
const UserManagementTable = ({ activeTab: propActiveTab }: UserManagementTableProps) => {
  const { addToast } = useToast();
  
  // Estados de datos y filtrado
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"Activos" | "Inactivos">("Activos");

  // Sincronizar activeTab con prop si existe
  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(propActiveTab);
      setPage(1);
    }
  }, [propActiveTab]);
  const [filters, setFilters] = useState({
    role: "",
    name: "",
    surname: "",
    ci: ""
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para diálogos de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "confirm" | "warning" | "error" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "confirm"
  });

  // Optimización de búsqueda con debounce
  const debouncedName = useDebounce(filters.name, 300);
  const debouncedSurname = useDebounce(filters.surname, 300);
  const debouncedCi = useDebounce(filters.ci, 300);

  // Efecto para escuchar el evento de apertura del modal desde el padre
  useEffect(() => {
    const handleOpenModal = () => {
      setEditingUser({ role: 2, status: 1 });
      setIsModalOpen(true);
    };

    window.addEventListener('open-user-modal', handleOpenModal);
    return () => window.removeEventListener('open-user-modal', handleOpenModal);
  }, []);

  /**
   * Obtiene la lista de usuarios desde la API aplicando filtros y paginación.
   */
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        role: filters.role,
        status: activeTab === "Activos" ? 1 : 0,
        name: debouncedName,
        surname: debouncedSurname,
        userCi: debouncedCi,
        page,
        limit: itemsPerPage
      };
      const response = await apiClient.get("/users", { params });
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalCount || response.data.totalItems || 0);
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
      addToast({
        variant: "error",
        title: "Error de carga",
        message: "No se pudieron cargar los usuarios del sistema."
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters.role, activeTab, debouncedName, debouncedSurname, debouncedCi, page, itemsPerPage, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Procesa la creación o actualización de un usuario.
   */
  const handleCreateOrUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setConfirmDialog({
      isOpen: true,
      title: editingUser?.id ? "Confirmar Actualización" : "Confirmar Registro",
      message: `¿Estás seguro de que deseas ${editingUser?.id ? "guardar los cambios de" : "registrar a"} este usuario?`,
      variant: "confirm",
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          if (editingUser?.id) {
            // Enviar solo los campos necesarios para evitar errores 500
            const updateData = {
              name: editingUser.name,
              surname: editingUser.surname,
              email: editingUser.email,
              role: editingUser.role,
              status: editingUser.status
            };
            await apiClient.put(`/users/${editingUser.id}`, updateData);
            addToast({
              variant: "success",
              title: "Usuario actualizado",
              message: `El usuario ${editingUser.name} ha sido actualizado correctamente.`
            });
          } else {
            await apiClient.post("/users", editingUser);
            addToast({
              variant: "success",
              title: "Usuario creado",
              message: "El nuevo usuario ha sido registrado y se ha enviado la notificación."
            });
          }
          setIsModalOpen(false);
          setEditingUser(null);
          fetchUsers();
        } catch (error: unknown) {
          console.error("Error saving user:", error);
          let errorMessage = "Ocurrió un error al procesar la solicitud.";
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response: { data: { message: string } } };
            errorMessage = axiosError.response?.data?.message || errorMessage;
          }
          addToast({
            variant: "error",
            title: "Error de guardado",
            message: errorMessage
          });
        } finally {
          setIsSubmitting(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  /**
   * Cambia el estado (Activo/Inactivo) de un usuario.
   */
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 1 ? 0 : 1;
    const actionLabel = newStatus === 1 ? "activar" : "desactivar";
    
    setConfirmDialog({
      isOpen: true,
      title: `¿Confirma ${actionLabel} usuario?`,
      message: `El usuario ${user.name} ${user.surname} será marcado como ${newStatus === 1 ? "Activo" : "Inactivo"}.`,
      variant: newStatus === 1 ? "success" : "warning",
      onConfirm: async () => {
        try {
          await apiClient.put(`/users/${user.id}`, { status: newStatus });
          addToast({
            variant: "success",
            title: `Usuario ${newStatus === 1 ? "activado" : "desactivado"}`,
            message: `Se ha cambiado el estado de ${user.name} correctamente.`
          });
          fetchUsers();
        } catch {
          addToast({
            variant: "error",
            title: "Error de estado",
            message: "No se pudo cambiar el estado del usuario."
          });
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setPage(1);
  };

  const handleCloseModal = () => {
    // Solo preguntar si hay datos ingresados (simulando isDirty)
    if (editingUser && (editingUser.name || editingUser.surname || editingUser.email || editingUser.userCi)) {
      setConfirmDialog({
        isOpen: true,
        title: "¿Cerrar sin guardar?",
        message: "Se perderán los cambios realizados en el formulario.",
        variant: "warning",
        onConfirm: () => {
          setIsModalOpen(false);
          setEditingUser(null);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      setIsModalOpen(false);
      setEditingUser(null);
    }
  };

  return (
    <div className="table-container">
      {/* Filters Section */}
      <div className="p-4 border-b border-border-light dark:border-border-dark space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por Cédula */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por cédula"
              value={filters.ci}
              onChange={(e) => setFilters({ ...filters, ci: e.target.value })}
              className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
          </div>

          {/* Filtro por Nombres */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar nombres"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
            />
          </div>

          {/* Filtro por Apellidos */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar apellidos"
              value={filters.surname}
              onChange={(e) => setFilters({ ...filters, surname: e.target.value })}
              className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:placeholder:text-text-tertiary"
            />
          </div>

          {/* Filtro por Rol */}
          <div className="relative">
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full h-11 rounded-lg border border-border-medium bg-transparent pl-3 pr-10 text-sm text-text-primary focus:border-brand-500 focus:outline-none dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis appearance-none"
            >
              <option value="" className="dark:bg-bg-dark">Todos los roles</option>
              <option value="1" className="dark:bg-bg-dark">MAESTRO</option>
              <option value="2" className="dark:bg-bg-dark">ASISTENTE</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              <ChevronDownIcon className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center gap-4">
            <div className="text-xs text-text-secondary dark:text-text-tertiary">
              Mostrando <span className="font-bold text-text-primary dark:text-text-emphasis">{users.length}</span> resultados
            </div>
            {(filters.ci || filters.name || filters.surname || filters.role) && (
              <button
                onClick={() => setFilters({ role: "", name: "", surname: "", ci: "" })}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition-colors"
              >
                <RefreshIcon className="icon-xs" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <span className="hidden sm:inline text-xs font-medium text-text-secondary dark:text-text-tertiary mr-2">
                  {selectedIds.length} seleccionados
                </span>
                <button
                  onClick={async () => {
                    setConfirmDialog({
                      isOpen: true,
                      title: "Confirmar Acción Masiva",
                      message: `¿Estás seguro de que deseas ${activeTab === "Activos" ? "desactivar" : "activar"} ${selectedIds.length} usuarios?`,
                      variant: activeTab === "Activos" ? "warning" : "success",
                      onConfirm: async () => {
                        try {
                          const newStatus = activeTab === "Activos" ? 0 : 1;
                          await Promise.all(selectedIds.map(id => apiClient.put(`/users/${id}`, { status: newStatus })));
                          addToast({
                            variant: "success",
                            title: "Acción completada",
                            message: `Se han ${newStatus === 1 ? "activado" : "desactivado"} los usuarios seleccionados.`
                          });
                          setSelectedIds([]);
                          fetchUsers();
                        } catch {
                          addToast({
                            variant: "error",
                            title: "Error",
                            message: "No se pudieron procesar algunos usuarios."
                          });
                        } finally {
                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        }
                      }
                    });
                  }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors min-h-11 ${
                    activeTab === "Activos" 
                      ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20" 
                      : "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-400/10 dark:text-brand-400 dark:hover:bg-brand-400/20"
                  }`}
                >
                  {activeTab === "Activos" ? <TrashIcon className="icon-sm" /> : <RefreshIcon className="icon-sm" />}
                  {activeTab === "Activos" ? "Desactivar Selección" : "Activar Selección"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table className="table-root">
          <TableHeader className="table-header-row">
            <TableRow>
              <TableCell isHeader className="table-header-cell w-12">
                <Checkbox
                  checked={users.length > 0 && selectedIds.length === users.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell isHeader className="table-header-cell">Cédula</TableCell>
              <TableCell isHeader className="table-header-cell">Nombres</TableCell>
              <TableCell isHeader className="table-header-cell">Apellidos</TableCell>
              <TableCell isHeader className="table-header-cell">Correo Electrónico</TableCell>
              <TableCell isHeader className="table-header-cell">Rol</TableCell>
              <TableCell isHeader className="table-header-cell text-right">&nbsp;</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border-light dark:divide-border-dark">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4 py-4"><div className="h-4 w-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /></TableCell>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j} className="px-4 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length > 0 ? (
              users.map((user, index) => (
                <TableRow 
                  key={user.id} 
                  className={`table-row-hover ${
                    index % 2 === 0 
                      ? "bg-white dark:bg-transparent" 
                      : "bg-bg-secondary/50 dark:bg-white/2"
                  } ${selectedIds.includes(user.id) ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                >
                  <TableCell className="table-cell">
                    <Checkbox 
                      checked={selectedIds.includes(user.id)} 
                      onChange={(checked) => handleSelectRow(user.id, checked)} 
                    />
                  </TableCell>
                  <TableCell className="table-cell font-medium">
                    {user.userCi}
                  </TableCell>
                  <TableCell className="table-cell font-bold uppercase text-xs">
                    {user.name}
                  </TableCell>
                  <TableCell className="table-cell font-bold uppercase text-xs">
                    {user.surname}
                  </TableCell>
                  <TableCell className="table-cell text-text-secondary text-xs">
                    {user.email}
                  </TableCell>
                  <TableCell className="table-cell">
                    <Badge 
                      color={user.role === 1 ? "primary" : "info"} 
                      variant="light"
                      className="font-bold text-[10px] px-2 py-0.5 rounded-lg"
                    >
                      {ROLES_MAP[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="table-cell text-right">
                    <ActionButtons
                      onEdit={() => {
                        setEditingUser(user);
                        setIsModalOpen(true);
                      }}
                      onToggleStatus={() => handleToggleStatus(user)}
                      status={user.status}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 border-t border-border-light dark:border-border-dark">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={[5, 10, 25]}
        />
      </div>

      {/* Modal - Centrado con overlay difuminado */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onCloseAttempt={handleCloseModal}
        className="max-w-4xl"
        showCloseButton
      >
        <ModalHeader>
          <div className="max-w-4xl mx-auto w-full">
            <h5 className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {editingUser?.id ? "Editar Usuario del Sistema" : "Registrar Nuevo Usuario"}
            </h5>
            <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
              {editingUser?.id 
                ? "Modifica los detalles del usuario del sistema." 
                : "Ingresa los detalles del nuevo usuario para el panel de control."}
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50 custom-scrollbar px-6 md:px-10 py-8">
          <form id="userForm" onSubmit={handleCreateOrUpdate} className="space-y-10 max-w-4xl mx-auto">
            {/* Sección: Información Personal */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-brand-500 rounded-full" />
                <h6 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  Información Personal
                </h6>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                <div>
                  <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Cédula *</label>
                  <Input
                    required
                    disabled={!!editingUser?.id}
                    value={editingUser?.userCi || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, userCi: e.target.value })}
                    placeholder="Ej. 12345678"
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nombres *</label>
                  <Input
                    required
                    value={editingUser?.name || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    placeholder="Nombres del usuario"
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Apellidos *</label>
                  <Input
                    required
                    value={editingUser?.surname || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, surname: e.target.value })}
                    placeholder="Apellidos del usuario"
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>
            </section>

            {/* Sección: Credenciales y Acceso */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-brand-500 rounded-full" />
                <h6 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  Credenciales y Acceso
                </h6>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Correo Institucional *</label>
                  <Input
                    type="email"
                    required
                    value={editingUser?.email || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    placeholder="usuario@unefa.edu.ve"
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Rol del Sistema *</label>
                  <Select
                    value={editingUser?.role?.toString() || "2"}
                    onChange={(val) => setEditingUser({ ...editingUser, role: Number(val) })}
                    className="h-11 rounded-lg border-gray-200 dark:border-gray-700"
                    options={[
                      { value: "1", label: "MAESTRO (Administrador de Sistema)" },
                      { value: "2", label: "ASISTENTE (Visualización y Registro)" }
                    ]}
                  />
                </div>
              </div>
            </section>
          </form>
        </ModalBody>
        <ModalFooter>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 w-full max-w-4xl mx-auto">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCloseModal} 
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-12"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="userForm" 
              loading={isSubmitting}
              className="w-full sm:w-auto min-h-12"
            >
              {editingUser?.id ? "Actualizar Datos" : "Crear Usuario"}
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Diálogo de Confirmación Genérico */}
      <UnifiedDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Confirmar"
      />
    </div>
  );
};

export default UserManagementTable;
