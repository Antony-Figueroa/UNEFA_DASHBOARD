import { useState, useEffect, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { TableSkeleton } from "../../components/ui/skeleton";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/ui/modal";
import InputField from "../../components/form/input/InputField";
import { rolesService, Role } from "../../features/roles/services/rolesService";
import { permissionService, Permission, GroupedPermissions } from "../../features/permissions/services/permissionService";
import { usePermissions } from "../../features/permissions/hooks/usePermissions";
import toast from "react-hot-toast";

interface RoleWithPermissions extends Role {
  permissionIds: number[];
}

export default function RolesPermissionsPage() {
  const { refresh: refreshPermissions } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [modules, setModules] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    permissionIds: [] as number[],
  });

  const [originalPermissionIds, setOriginalPermissionIds] = useState<number[]>([]);

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    permissionIds: [] as number[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        rolesService.getAll(),
        permissionService.getAllPermissions()
      ]);

      if (rolesRes.success) {
        const rolesWithPerms = await Promise.all(
          rolesRes.data.map(async (role) => {
            try {
              const permsRes = await permissionService.getRolePermissions(role.id);
              return {
                ...role,
                permissionIds: permsRes.permissionIds || []
              };
            } catch {
              return { ...role, permissionIds: [] };
            }
          })
        );
        setRoles(rolesWithPerms);
      }

      if (permissionsRes.data) {
        setAllPermissions(permissionsRes.data);
        setGroupedPermissions(permissionsRes.grouped);
        setModules(Object.keys(permissionsRes.grouped));
      }
    } catch (error) {
      console.error('Error fetching roles data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditRole = async (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setEditForm({
      name: role.name,
      description: role.description,
      permissionIds: [...role.permissionIds],
    });
    setOriginalPermissionIds([...role.permissionIds]);
    setIsEditModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setCreateForm({
      name: "",
      description: "",
      permissionIds: [],
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateRole = async () => {
    if (!createForm.name.trim()) {
      toast.error("El nombre del rol es requerido");
      return;
    }

    setSaving(true);
    try {
      const response = await rolesService.create({
        name: createForm.name,
        description: createForm.description,
        permissionIds: createForm.permissionIds,
      });

      if (response.success) {
        toast.success("Rol creado exitosamente");
        setIsCreateModalOpen(false);
        fetchData();
        refreshPermissions();
      } else {
        toast.error(response.message || "Error al crear rol");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error("Error al crear rol");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCreatePermission = (permissionId: number) => {
    setCreateForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((p) => p !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const handleTogglePermission = (permissionId: number) => {
    if (selectedRole?.id === 1) return;

    setEditForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((p) => p !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const handleToggleModule = (module: string) => {
    if (selectedRole?.id === 1) return;

    const modulePermissionIds = (groupedPermissions[module] || []).map((p) => p.PERMISSIONS_ID);
    const allSelected = modulePermissionIds.every((p) => editForm.permissionIds.includes(p));

    if (allSelected) {
      setEditForm((prev) => ({
        ...prev,
        permissionIds: prev.permissionIds.filter((p) => !modulePermissionIds.includes(p)),
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        permissionIds: [...new Set([...prev.permissionIds, ...modulePermissionIds])],
      }));
    }
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;

    setConfirmDialog({
      isOpen: true,
      title: "Guardar Cambios",
      message: `¿Está seguro de guardar los cambios en el rol ${selectedRole.name}?`,
      onConfirm: async () => {
        try {
          setSaving(true);
          
          await Promise.all([
            rolesService.update(selectedRole.id, {
              name: editForm.name,
              description: editForm.description
            }),
            selectedRole.id !== 1 
              ? permissionService.updateRolePermissions(selectedRole.id, editForm.permissionIds)
              : Promise.resolve()
          ]);
          
          toast.success('Rol actualizado correctamente');
          setIsEditModalOpen(false);
          fetchData();
          refreshPermissions();
        } catch (error) {
          console.error('Error updating role:', error);
          toast.error('Error al actualizar el rol');
        } finally {
          setSaving(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  const isModuleFullySelected = (module: string) => {
    const modulePermissionIds = (groupedPermissions[module] || []).map((p) => p.PERMISSIONS_ID);
    return modulePermissionIds.length > 0 && modulePermissionIds.every((p) => editForm.permissionIds.includes(p));
  };

  const isModulePartiallySelected = (module: string) => {
    const modulePermissionIds = (groupedPermissions[module] || []).map((p) => p.PERMISSIONS_ID);
    const selected = modulePermissionIds.filter((p) => editForm.permissionIds.includes(p));
    return selected.length > 0 && selected.length < modulePermissionIds.length;
  };

  const getModuleSelectedCount = (module: string) => {
    return (groupedPermissions[module] || []).filter((p) => editForm.permissionIds.includes(p.PERMISSIONS_ID)).length;
  };

  const getModuleTotalCount = (module: string) => {
    return (groupedPermissions[module] || []).length;
  };

  const hasChanges = useMemo(() => {
    return (
      editForm.name !== selectedRole?.name ||
      editForm.description !== selectedRole?.description ||
      JSON.stringify(editForm.permissionIds.sort()) !== JSON.stringify(originalPermissionIds.sort())
    );
  }, [editForm, selectedRole, originalPermissionIds]);

  const stats = useMemo(() => ({
    rolesCount: roles.length,
    permissionsCount: allPermissions.length,
    usersWithRoles: roles.reduce((acc, r) => acc + r.userCount, 0)
  }), [roles, allPermissions]);

  return (
    <>
      <PageMeta title="Roles y Permisos" description="Configuración de roles y permisos del sistema" />
      <PageBreadcrumb pageTitle="Roles y Permisos" />

      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Roles y Permisos
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Gestiona los roles del sistema y sus permisos de acceso
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis tabular-nums">
                  {stats.rolesCount}
                </p>
                <p className="text-xs text-text-tertiary">Roles configurados</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-50 dark:bg-success-500/10">
                <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis tabular-nums">
                  {stats.permissionsCount}
                </p>
                <p className="text-xs text-text-tertiary">Permisos disponibles</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-50 dark:bg-warning-500/10">
                <svg className="w-5 h-5 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis tabular-nums">
                  {stats.usersWithRoles}
                </p>
                <p className="text-xs text-text-tertiary">Usuarios con roles</p>
              </div>
            </div>
          </div>
        </div>

        <ComponentCard 
          title="Roles del Sistema"
          headerAction={
            <Button size="sm" onClick={handleOpenCreateModal}>
              + Crear Rol
            </Button>
          }
        >          {loading ? (
            <TableSkeleton columns={5} rows={2} />
          ) : (
            <div className="hidden md:block overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Rol</TableCell>
                    <TableCell isHeader>Descripción</TableCell>
                    <TableCell isHeader>Usuarios</TableCell>
                    <TableCell isHeader>Permisos</TableCell>
                    <TableCell isHeader>Acciones</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id} className="hover:bg-bg-subtle/50 dark:hover:bg-bg-dark-subtle/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary dark:text-text-emphasis">
                            {role.name}
                          </span>
                          {role.isSystem && (
                            <Badge color="primary" variant="light" shape="rounded" className="text-[10px]">
                              Sistema
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary dark:text-text-tertiary text-sm">
                        {role.description}
                      </TableCell>
                      <TableCell className="text-text-secondary dark:text-text-tertiary text-sm tabular-nums">
                        {role.userCount}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary dark:text-text-emphasis tabular-nums">
                            {role.permissionIds.length}
                          </span>
                          <span className="text-xs text-text-tertiary">de {allPermissions.length}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEditRole(role)}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="md:hidden flex flex-col gap-4">
            {roles.map((role) => (
              <div key={role.id} className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg border border-border-default dark:border-border-dark p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary dark:text-text-emphasis">{role.name}</span>
                    {role.isSystem && (
                      <Badge color="primary" variant="light" shape="rounded" className="text-[10px]">
                        Sistema
                      </Badge>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleEditRole(role)}>
                    Editar
                  </Button>
                </div>
                <p className="text-xs text-text-secondary dark:text-text-tertiary mb-2">{role.description}</p>
                <p className="text-xs text-text-tertiary">{role.permissionIds.length} permisos • {role.userCount} usuarios</p>
              </div>
            ))}
          </div>
        </ComponentCard>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="4xl">
        <ModalHeader>
          <div className="flex items-center justify-between w-full pr-8">
            <div>
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-emphasis">
                Editar Rol: {selectedRole?.name}
              </h3>
              <p className="text-sm text-text-tertiary mt-0.5">
                {selectedRole?.id === 1 
                  ? "Rol Administrador - tiene todos los permisos" 
                  : "Configura los permisos del rol"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-tertiary">Permisos:</span>
              <Badge color="success" variant="light" shape="rounded">
                {editForm.permissionIds.length} / {allPermissions.length}
              </Badge>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  Nombre del Rol
                </label>
                <InputField
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={selectedRole?.isSystem}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  Descripción
                </label>
                <InputField
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            {selectedRole?.id !== 1 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                    Matriz de Permisos
                  </label>
                  <button
                    onClick={() => {
                      const allSelected = editForm.permissionIds.length === allPermissions.length;
                      if (allSelected) {
                        setEditForm((prev) => ({ ...prev, permissionIds: [] }));
                      } else {
                        setEditForm((prev) => ({ 
                          ...prev, 
                          permissionIds: allPermissions.map((p) => p.PERMISSIONS_ID) 
                        }));
                      }
                    }}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    {editForm.permissionIds.length === allPermissions.length ? "Desmarcar todos" : "Marcar todos"}
                  </button>
                </div>

                <div className="rounded-xl border border-border-light dark:border-white/10 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/5 border-b border-border-light dark:border-white/10">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-40">Módulo</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Permisos</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-20">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-white/5">
                      {modules.map((module) => {
                        const modulePermissions = groupedPermissions[module] || [];
                        const selectedCount = getModuleSelectedCount(module);
                        const totalCount = getModuleTotalCount(module);
                        const isFullySelected = isModuleFullySelected(module);
                        const isPartiallySelected = isModulePartiallySelected(module);

                        return (
                          <tr key={module} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                            <td className="py-3 px-4">
                              <button 
                                onClick={() => handleToggleModule(module)} 
                                className="flex items-center gap-2 text-left w-full group"
                              >
                                <input
                                  type="checkbox"
                                  checked={isFullySelected}
                                  ref={(el) => { if (el) el.indeterminate = isPartiallySelected; }}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded border-border-light dark:border-white/10 text-brand-500 focus:ring-brand-500/20 shrink-0"
                                />
                                <span className="font-medium text-sm text-text-primary dark:text-text-emphasis group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                  {module}
                                </span>
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-2">
                                {modulePermissions.map((permission) => {
                                  const actionName = permission.NAME.split(':')[1] || permission.NAME;
                                  const isSelected = editForm.permissionIds.includes(permission.PERMISSIONS_ID);
                                  
                                  return (
                                    <button
                                      key={permission.PERMISSIONS_ID}
                                      onClick={() => handleTogglePermission(permission.PERMISSIONS_ID)}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all duration-200 ${
                                        isSelected
                                          ? "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-500/30"
                                          : "bg-gray-100 dark:bg-gray-800 text-text-tertiary hover:bg-gray-200 dark:hover:bg-gray-700"
                                      }`}
                                      title={permission.DESCRIPTION || permission.NAME}
                                    >
                                      {isSelected && (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      {actionName}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                isFullySelected
                                  ? "bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-400"
                                  : isPartiallySelected
                                    ? "bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-400"
                                    : "bg-gray-100 dark:bg-gray-800 text-text-tertiary"
                              }`}>
                                {selectedCount}/{totalCount}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedRole?.id === 1 && (
              <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                      El rol Administrador tiene acceso total
                    </p>
                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                      Este rol posee todos los permisos del sistema y no pueden ser modificados.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-text-tertiary">
              {editForm.permissionIds.length} de {allPermissions.length} permisos seleccionados
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRole} disabled={saving || !hasChanges}>
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} size="4xl">
        <ModalHeader>
          <div className="flex items-center justify-between w-full pr-8">
            <div>
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-emphasis">
                Crear Nuevo Rol
              </h3>
              <p className="text-sm text-text-tertiary mt-0.5">
                Define un nuevo rol con permisos personalizados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-tertiary">Permisos:</span>
              <Badge color="success" variant="light" shape="rounded">
                {createForm.permissionIds.length} / {allPermissions.length}
              </Badge>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  Nombre del Rol *
                </label>
                <InputField
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: COORDINADOR"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  Descripción
                </label>
                <InputField
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del rol"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                  Matriz de Permisos
                </label>
                <button
                  onClick={() => {
                    const allSelected = createForm.permissionIds.length === allPermissions.length;
                    if (allSelected) {
                      setCreateForm((prev) => ({ ...prev, permissionIds: [] }));
                    } else {
                      setCreateForm((prev) => ({ 
                        ...prev, 
                        permissionIds: allPermissions.map((p) => p.PERMISSIONS_ID) 
                      }));
                    }
                  }}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {createForm.permissionIds.length === allPermissions.length ? "Desmarcar todos" : "Marcar todos"}
                </button>
              </div>

              <div className="rounded-xl border border-border-light dark:border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 border-b border-border-light dark:border-white/10">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-40">Módulo</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Permisos</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-20">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-white/5">
                    {modules.map((module) => {
                      const modulePermissions = groupedPermissions[module] || [];
                      const selectedCount = modulePermissions.filter(p => createForm.permissionIds.includes(p.PERMISSIONS_ID)).length;
                      const totalCount = modulePermissions.length;
                      const isFullySelected = selectedCount === totalCount && totalCount > 0;
                      const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

                      const toggleModule = () => {
                        if (isFullySelected) {
                          setCreateForm(prev => ({
                            ...prev,
                            permissionIds: prev.permissionIds.filter(id => !modulePermissions.map(p => p.PERMISSIONS_ID).includes(id))
                          }));
                        } else {
                          setCreateForm(prev => ({
                            ...prev,
                            permissionIds: [...new Set([...prev.permissionIds, ...modulePermissions.map(p => p.PERMISSIONS_ID)])]
                          }));
                        }
                      };

                      return (
                        <tr key={module} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <button 
                              onClick={toggleModule} 
                              className="flex items-center gap-2 text-left w-full group"
                            >
                              <input
                                type="checkbox"
                                checked={isFullySelected}
                                ref={(el) => { if (el) el.indeterminate = isPartiallySelected; }}
                                onChange={() => {}}
                                className="w-4 h-4 rounded border-border-light dark:border-white/10 text-brand-500 focus:ring-brand-500/20 shrink-0"
                              />
                              <span className="font-medium text-sm text-text-primary dark:text-text-emphasis group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                {module}
                              </span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-2">
                              {modulePermissions.map((permission) => {
                                const actionName = permission.NAME.split(':')[1] || permission.NAME;
                                const isSelected = createForm.permissionIds.includes(permission.PERMISSIONS_ID);
                                
                                return (
                                  <button
                                    key={permission.PERMISSIONS_ID}
                                    onClick={() => handleToggleCreatePermission(permission.PERMISSIONS_ID)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      isSelected
                                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                                        : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                    }`}
                                  >
                                    {isSelected && (
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    {permission.DESCRIPTION || actionName}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-xs font-medium text-text-tertiary">
                              {selectedCount}/{totalCount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-text-tertiary">
              {createForm.permissionIds.length} de {allPermissions.length} permisos seleccionados
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRole} disabled={saving || !createForm.name.trim()}>
                {saving ? "Creando..." : "Crear Rol"}
              </Button>
            </div>
          </div>
        </ModalFooter>
      </Modal>

      <UnifiedDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel="Confirmar"
        variant="info"
      />
    </>
  );
}
