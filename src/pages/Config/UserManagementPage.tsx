import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon, RefreshIcon, TrashIcon } from "../../icons/actions";
import UserTable from "../../features/users/components/UserTable";
import UserModal from "../../features/users/components/UserModal";
import { useUsers } from "../../features/users/hooks/useUsers";
import { useLists } from "../../features/lists/hooks/useLists";
import { useDebounce } from "../../hooks/useDebounce";
import { useAuth } from "../../context/auth";
import { User, CreateUserPayload, UpdateUserPayload } from "../../features/users/types";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DialogVariant } from "../../components/ui/dialog/DialogConfig";

/**
 * Página de Gestión de Usuarios.
 * Permite administrar los accesos, roles y estados de los usuarios del sistema.
 */
const UserManagementPage = () => {
  // Usuario actual autenticado
  const { user: currentUser } = useAuth();
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<"Activos" | "Inactivos">("Activos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Estados de filtros y paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    ci: "",
    name: "",
    surname: "",
    role: ""
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Estados para datos auxiliares (roles)
  const [rolesOptions, setRolesOptions] = useState<{ value: string; label: string }[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<number, string>>({
    0: "MAESTRO",
    1: "ADMIN",
    2: "ASISTENTE"
  });

  // Diálogo de confirmación
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    variant: DialogVariant;
  } | null>(null);


  const { fetchMultipleLists } = useLists();
  
  // Debounce para filtros de búsqueda
  const debouncedFilters = {
    ci: useDebounce(filters.ci, 300),
    name: useDebounce(filters.name, 300),
    surname: useDebounce(filters.surname, 300),
    role: filters.role
  };

  // Hook de negocio para usuarios
  const {
    users,
    status,
    loadingAction,
    error,
    totalPages,
    totalItems,
    addUser,
    editUser,
    toggleUserStatus,
    bulkToggleStatus
  } = useUsers(debouncedFilters, activeTab, page, limit);

  // Cargar roles desde el sistema de listas
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await fetchMultipleLists(["Roles"]);
        if (data["Roles"] && data["Roles"].length > 0) {
          const options = data["Roles"].map(v => ({
            value: v.id,
            label: v.name.toUpperCase()
          }));
          setRolesOptions(options);
          
          const newMap: Record<number, string> = {};
          data["Roles"].forEach(v => {
            const name = v.name.toUpperCase();
            if (name === "MAESTRO") newMap[0] = "MAESTRO";
            else if (name === "ADMIN") newMap[1] = "ADMIN";
            else if (name === "ASISTENTE") newMap[2] = "ASISTENTE";
          });
          
          if (Object.keys(newMap).length > 0) {
            setRolesMap(prev => ({ ...prev, ...newMap }));
          }
        }
      } catch (err) {
        console.error("[UserManagementPage] Error cargando roles:", err);
      }
    };
    loadRoles();
  }, [fetchMultipleLists]);

  // Manejar apertura de modal desde el botón de la página
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  // Escuchar evento global para abrir modal (si otros componentes lo disparan)
  useEffect(() => {
    window.addEventListener('open-user-modal', handleOpenCreateModal);
    return () => window.removeEventListener('open-user-modal', handleOpenCreateModal);
  }, []);

  // Handlers para acciones de la tabla
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    const isDeactivating = user.status === 1;
    const isCurrentUser = currentUser?.id === user.id;
    const isCurrentUserAdmin = currentUser?.role === 1;

    // Validación: No puede desactivarse a sí mismo
    if (isCurrentUser && isDeactivating) {
      alert("No puedes desactivarte a ti mismo.");
      return;
    }

    // Validación: Admin no puede desactivarse
    if (isCurrentUserAdmin && isDeactivating) {
      alert("El administrador no puede desactivarse a sí mismo.");
      return;
    }

    const actionVerb = isDeactivating ? "desactivar" : "activar";
    const confirmTitle = isDeactivating ? "Confirmar Desactivación" : "Confirmar Activación";
    const variant = isDeactivating ? "error" : "success";
    const confirmText = isDeactivating ? "Desactivar" : "Activar";

    setConfirmation({
      isOpen: true,
      title: confirmTitle,
      message: `¿Estás seguro de que deseas ${actionVerb} al usuario "${user.name} ${user.surname}"?`,
      onConfirm: async () => {
        try {
          await toggleUserStatus(user);
        } catch (error) {
          console.error("[UserManagementPage] Error toggling status:", error);
        } finally {
          setConfirmation(null);
        }
      },
      confirmText: confirmText,
      variant: variant as any,
    });
  };

  const handleBulkAction = () => {
    const newStatus = activeTab === "Activos" ? 0 : 1;
    const isDeactivating = activeTab === "Activos";
    const actionVerb = isDeactivating ? "desactivar" : "activar";
    const confirmTitle = isDeactivating ? "Confirmar Desactivación Masiva" : "Confirmar Activación Masiva";
    const variant = isDeactivating ? "error" : "success";
    const confirmText = isDeactivating ? "Desactivar Todos" : "Activar Todos";
    
    setConfirmation({
      isOpen: true,
      title: confirmTitle,
      message: `¿Estás seguro de que deseas ${actionVerb} los ${selectedIds.length} usuarios seleccionados?`,
      onConfirm: async () => {
        try {
          await bulkToggleStatus(selectedIds, newStatus);
          setSelectedIds([]);
        } catch (e) {
          console.error("[UserManagementPage] Error en acción masiva:", e);
        } finally {
          setConfirmation(null);
        }
      },
      confirmText: confirmText,
      variant: variant as any,
    });
  };

  const handleSave = async (payload: CreateUserPayload | UpdateUserPayload) => {
    try {
      if ('id' in payload) {
        await editUser(payload as UpdateUserPayload);
      } else {
        await addUser(payload as CreateUserPayload);
      }
      setIsModalOpen(false);
    } catch (err) {
      // El error ya es manejado por el hook con un toast
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableIds = users.filter(u => !u.isInUse).map(u => u.id);
      setSelectedIds(selectableIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleTabChange = (tab: "Activos" | "Inactivos") => {
    setActiveTab(tab);
    setPage(1);
    setSelectedIds([]);
  };

  return (
    <>
      <PageMeta 
        title="Gestión de Usuarios | UNEFA" 
        description="Administración de usuarios del panel de control" 
      />

      <SkeletonLoader
        isLoading={status === "loading" && users.length === 0}
        id="users-page-header"
        skeleton={<BreadcrumbSkeleton />}
      >
        <PageBreadcrumb pageTitle="Gestión de Usuarios" />
      </SkeletonLoader>

      <div className="stagger-delay">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SkeletonLoader isLoading={status === "loading" && users.length === 0} skeleton={<TitleSkeleton />} id="users-title">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  Administración de Usuarios
                </h2>
              </div>
              <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
                Gestiona los accesos y roles de los usuarios del sistema.
              </p>
            </SkeletonLoader>
          </div>

          {status !== "loading" && (
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <Button 
                  onClick={handleBulkAction}
                  variant={activeTab === "Activos" ? "error" : "success"}
                  startIcon={activeTab === "Activos" ? <TrashIcon /> : <RefreshIcon />}
                  className="animate-fadeIn"
                >
                  {activeTab === "Activos" ? "Desactivar Selección" : "Activar Selección"} ({selectedIds.length})
                </Button>
              )}
              <Button 
                onClick={handleOpenCreateModal} 
                startIcon={<PlusCircleIcon className="h-5 w-5" />}
              >
                Nuevo Usuario
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <ComponentCard title={activeTab === "Activos" ? "Usuarios Activos" : "Usuarios Inactivos"}>
            <div className="mb-6 flex border-b border-border-light dark:border-border-dark">
              <button
                onClick={() => handleTabChange("Activos")}
                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                  activeTab === "Activos" ? "text-brand-500" : "text-text-secondary hover:text-text-emphasis"
                }`}
              >
                Activos
                {activeTab === "Activos" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />
                )}
              </button>
              <button
                onClick={() => handleTabChange("Inactivos")}
                className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                  activeTab === "Inactivos" ? "text-brand-500" : "text-text-secondary hover:text-text-emphasis"
                }`}
              >
                Inactivos
                {activeTab === "Inactivos" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />
                )}
              </button>
            </div>

            <SkeletonLoader
              isLoading={status === "loading" && users.length === 0}
              id="users-page-list"
              skeleton={<TablePageSkeleton rows={10} />}
            >
              <UserTable 
                data={users}
                status={status}
                error={error}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
                rolesMap={rolesMap}
                selectedIds={selectedIds}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAll}
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={limit}
                onPageChange={setPage}
                onItemsPerPageChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
                filters={filters}
                onFilterChange={setFilters}
                rolesOptions={rolesOptions}
                onClearFilters={() => setFilters({ ci: "", name: "", surname: "", role: "" })}
              />
            </SkeletonLoader>
          </ComponentCard>
        </div>
      </div>

      {/* Modal de Usuario */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        currentUser={currentUser}
        onSave={handleSave}
        isSubmitting={loadingAction}
        roleOptions={rolesOptions}
      />

      {/* Diálogo de confirmación */}
      <UnifiedDialog
        isOpen={!!confirmation}
        onClose={() => setConfirmation(null)}
        title={confirmation?.title || ""}
        message={confirmation?.message || ""}
        onConfirm={confirmation?.onConfirm || (() => {})}
        confirmLabel={confirmation?.confirmText || "Confirmar"}
        variant={confirmation?.variant || "info"}
        isLoading={loadingAction}
      />
    </>
  );
};

export default UserManagementPage;
