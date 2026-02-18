import { useState, useEffect } from "react";
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

interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  status: "active" | "inactive";
  isSystem: boolean;
}

const MOCK_PERMISSIONS: Permission[] = [
  { id: "users.view", module: "Usuarios", action: "Ver", description: "Ver listado de usuarios" },
  { id: "users.create", module: "Usuarios", action: "Crear", description: "Crear nuevos usuarios" },
  { id: "users.edit", module: "Usuarios", action: "Editar", description: "Editar usuarios existentes" },
  { id: "users.delete", module: "Usuarios", action: "Eliminar", description: "Eliminar usuarios" },
  { id: "students.view", module: "Estudiantes", action: "Ver", description: "Ver listado de estudiantes" },
  { id: "students.create", module: "Estudiantes", action: "Crear", description: "Registrar estudiantes" },
  { id: "students.edit", module: "Estudiantes", action: "Editar", description: "Editar datos de estudiantes" },
  { id: "enrollments.view", module: "Inscripciones", action: "Ver", description: "Ver inscripciones" },
  { id: "enrollments.manage", module: "Inscripciones", action: "Gestionar", description: "Gestionar inscripciones" },
  { id: "tracking.view", module: "Seguimiento", action: "Ver", description: "Ver seguimientos" },
  { id: "tracking.manage", module: "Seguimiento", action: "Gestionar", description: "Registrar visitas" },
  { id: "reports.view", module: "Reportes", action: "Ver", description: "Ver reportes" },
  { id: "reports.export", module: "Reportes", action: "Exportar", description: "Exportar reportes" },
  { id: "config.access", module: "Configuración", action: "Acceder", description: "Acceder a configuración" },
];

const MOCK_ROLES: Role[] = [
  {
    id: 1,
    name: "ADMIN",
    description: "Administrador con acceso total al sistema",
    userCount: 4,
    permissions: MOCK_PERMISSIONS.map((p) => p.id),
    status: "active",
    isSystem: true,
  },
  {
    id: 2,
    name: "ASISTENTE",
    description: "Asistente administrativo con acceso limitado",
    userCount: 5,
    permissions: ["students.view", "students.create", "students.edit", "enrollments.view", "tracking.view", "reports.view"],
    status: "active",
    isSystem: true,
  },
];

const MODULES = [...new Set(MOCK_PERMISSIONS.map((p) => p.module))];

export default function RolesPermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions] = useState<Permission[]>(MOCK_PERMISSIONS);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setRoles(MOCK_ROLES);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditForm({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    });
    setIsEditModalOpen(true);
  };

  const handleTogglePermission = (permissionId: string) => {
    setEditForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const handleToggleModule = (module: string) => {
    const modulePermissions = permissions.filter((p) => p.module === module).map((p) => p.id);
    const allSelected = modulePermissions.every((p) => editForm.permissions.includes(p));
    
    if (allSelected) {
      setEditForm((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => !modulePermissions.includes(p)),
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...modulePermissions])],
      }));
    }
  };

  const handleSaveRole = () => {
    if (!selectedRole) return;
    
    setConfirmDialog({
      isOpen: true,
      title: "Guardar Cambios",
      message: `¿Está seguro de guardar los cambios en el rol ${selectedRole.name}?`,
      onConfirm: () => {
        setRoles((prev) =>
          prev.map((r) =>
            r.id === selectedRole.id
              ? { ...r, name: editForm.name, description: editForm.description, permissions: editForm.permissions }
              : r
          )
        );
        setIsEditModalOpen(false);
        setConfirmDialog(null);
      },
    });
  };

  const isModuleFullySelected = (module: string) => {
    const modulePermissions = permissions.filter((p) => p.module === module).map((p) => p.id);
    return modulePermissions.every((p) => editForm.permissions.includes(p));
  };

  const isModulePartiallySelected = (module: string) => {
    const modulePermissions = permissions.filter((p) => p.module === module).map((p) => p.id);
    const selected = modulePermissions.filter((p) => editForm.permissions.includes(p));
    return selected.length > 0 && selected.length < modulePermissions.length;
  };

  const getModuleSelectedCount = (module: string) => {
    return permissions.filter((p) => p.module === module && editForm.permissions.includes(p.id)).length;
  };

  const getModuleTotalCount = (module: string) => {
    return permissions.filter((p) => p.module === module).length;
  };

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
              Gestiona los roles y sus permisos asociados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  {roles.length}
                </p>
                <p className="text-xs text-text-tertiary">Roles configurados</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-50 dark:bg-success-500/10">
                <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  {permissions.length}
                </p>
                <p className="text-xs text-text-tertiary">Permisos disponibles</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-50 dark:bg-warning-500/10">
                <svg className="w-5 h-5 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  {roles.reduce((sum, r) => sum + r.userCount, 0)}
                </p>
                <p className="text-xs text-text-tertiary">Usuarios con roles</p>
              </div>
            </div>
          </div>
        </div>

        <ComponentCard title="Roles del Sistema">
          {loading ? (
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
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((p) => (
                              <span
                                key={p}
                                className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-gray-800 text-text-tertiary"
                              >
                                {p.split(".")[1]}
                              </span>
                            ))}
                            {role.permissions.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                                +{role.permissions.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRole(role)}
                        >
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
              <div
                key={role.id}
                className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg border border-border-default dark:border-border-dark p-4"
              >
                <div className="flex justify-between items-start mb-3">
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
                  <Button size="sm" variant="outline" onClick={() => handleEditRole(role)}>
                    Editar
                  </Button>
                </div>
                <p className="text-xs text-text-secondary dark:text-text-tertiary mb-2">
                  {role.description}
                </p>
                <p className="text-xs text-text-tertiary">
                  {role.permissions.length} permisos • {role.userCount} usuarios
                </p>
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
                {selectedRole?.isSystem ? "Rol del sistema - nombre no editable" : "Configura los permisos del rol"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-tertiary">Permisos activos:</span>
              <Badge color="success" variant="light" shape="rounded">
                {editForm.permissions.length} / {permissions.length}
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

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                  Matriz de Permisos
                </label>
                <button
                  onClick={() => {
                    const allSelected = editForm.permissions.length === permissions.length;
                    if (allSelected) {
                      setEditForm((prev) => ({ ...prev, permissions: [] }));
                    } else {
                      setEditForm((prev) => ({ ...prev, permissions: permissions.map((p) => p.id) }));
                    }
                  }}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {editForm.permissions.length === permissions.length ? "Desmarcar todos" : "Marcar todos"}
                </button>
              </div>

              <div className="rounded-xl border border-border-light dark:border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 border-b border-border-light dark:border-white/10">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-40">
                        Módulo
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                        Permisos
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-24">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-white/5">
                    {MODULES.map((module) => {
                      const modulePermissions = permissions.filter((p) => p.module === module);
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
                                ref={(el) => {
                                  if (el) el.indeterminate = isPartiallySelected;
                                }}
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
                              {modulePermissions.map((permission) => (
                                <label
                                  key={permission.id}
                                  className={`
                                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer
                                    transition-all duration-200
                                    ${editForm.permissions.includes(permission.id)
                                      ? "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-500/30"
                                      : "bg-gray-100 dark:bg-gray-800 text-text-tertiary hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }
                                  `}
                                  title={permission.description}
                                >
                                  <input
                                    type="checkbox"
                                    checked={editForm.permissions.includes(permission.id)}
                                    onChange={() => handleTogglePermission(permission.id)}
                                    className="sr-only"
                                  />
                                  <svg
                                    className={`w-3 h-3 transition-opacity ${editForm.permissions.includes(permission.id) ? "opacity-100" : "opacity-0"}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  {permission.action}
                                </label>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`
                              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                              ${isFullySelected 
                                ? "bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-400" 
                                : isPartiallySelected 
                                  ? "bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-400"
                                  : "bg-gray-100 dark:bg-gray-800 text-text-tertiary"
                              }
                            `}>
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
              {editForm.permissions.length} de {permissions.length} permisos seleccionados
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRole}>
                Guardar Cambios
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
