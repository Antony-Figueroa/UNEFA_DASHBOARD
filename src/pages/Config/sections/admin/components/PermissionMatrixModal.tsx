import { useState, useEffect, useMemo } from "react";
import Button from "../../../../../components/ui/button/Button";
import Badge from "../../../../../components/ui/badge/Badge";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "../../../../../components/ui/modal";
import InputField from "../../../../../components/form/input/InputField";
import UnifiedDialog from "../../../../../components/ui/dialog/UnifiedDialog";
import {
  rolesService,
  type Role,
} from "../../../../../features/roles/services/rolesService";
import {
  permissionService,
  type Permission,
  type GroupedPermissions,
} from "../../../../../features/permissions/services/permissionService";
import toast from "react-hot-toast";

interface RoleWithPermissions extends Role {
  permissionIds: number[];
}

interface PermissionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleWithPermissions | null;
  allPermissions: Permission[];
  groupedPermissions: GroupedPermissions;
  modules: string[];
  onRoleUpdated: () => void;
}

export default function PermissionMatrixModal({
  isOpen,
  onClose,
  role,
  allPermissions,
  groupedPermissions,
  modules,
  onRoleUpdated,
}: PermissionMatrixModalProps) {
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    permissionIds: [] as number[],
  });
  const [originalPermissionIds, setOriginalPermissionIds] = useState<number[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Sync form state when modal opens with a role
  useEffect(() => {
    if (role && isOpen) {
      setEditForm({
        name: role.name,
        description: role.description,
        permissionIds: [...role.permissionIds],
      });
      setOriginalPermissionIds([...role.permissionIds]);
    }
  }, [role, isOpen]);

  const handleTogglePermission = (permissionId: number) => {
    if (role?.id === 1) return;

    setEditForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((p) => p !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const handleToggleModule = (module: string) => {
    if (role?.id === 1) return;

    const modulePermissionIds = (
      groupedPermissions[module] || []
    ).map((p) => p.PERMISSIONS_ID);
    const allSelected = modulePermissionIds.every((p) =>
      editForm.permissionIds.includes(p),
    );

    if (allSelected) {
      setEditForm((prev) => ({
        ...prev,
        permissionIds: prev.permissionIds.filter(
          (p) => !modulePermissionIds.includes(p),
        ),
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        permissionIds: [
          ...new Set([...prev.permissionIds, ...modulePermissionIds]),
        ],
      }));
    }
  };

  const handleSaveRole = () => {
    if (!role) return;

    setConfirmDialog({
      isOpen: true,
      title: "Guardar Cambios",
      message: `¿Está seguro de guardar los cambios en el rol ${role.name}?`,
      onConfirm: async () => {
        try {
          setSaving(true);

          await Promise.all([
            rolesService.update(role.id, {
              name: editForm.name,
              description: editForm.description,
            }),
            role.id !== 1
              ? permissionService.updateRolePermissions(
                  role.id,
                  editForm.permissionIds,
                )
              : Promise.resolve(),
          ]);

          toast.success("Rol actualizado correctamente");
          onClose();
          onRoleUpdated();
        } catch (error) {
          console.error("Error updating role:", error);
          toast.error("Error al actualizar el rol");
        } finally {
          setSaving(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  const isModuleFullySelected = (module: string) => {
    const modulePermissionIds = (
      groupedPermissions[module] || []
    ).map((p) => p.PERMISSIONS_ID);
    return (
      modulePermissionIds.length > 0 &&
      modulePermissionIds.every((p) => editForm.permissionIds.includes(p))
    );
  };

  const isModulePartiallySelected = (module: string) => {
    const modulePermissionIds = (
      groupedPermissions[module] || []
    ).map((p) => p.PERMISSIONS_ID);
    const selected = modulePermissionIds.filter((p) =>
      editForm.permissionIds.includes(p),
    );
    return selected.length > 0 && selected.length < modulePermissionIds.length;
  };

  const getModuleSelectedCount = (module: string) => {
    return (groupedPermissions[module] || []).filter((p) =>
      editForm.permissionIds.includes(p.PERMISSIONS_ID),
    ).length;
  };

  const getModuleTotalCount = (module: string) => {
    return (groupedPermissions[module] || []).length;
  };

  const hasChanges = useMemo(() => {
    return (
      editForm.name !== role?.name ||
      editForm.description !== role?.description ||
      JSON.stringify([...editForm.permissionIds].sort()) !==
        JSON.stringify([...originalPermissionIds].sort())
    );
  }, [editForm, role, originalPermissionIds]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalHeader>
          <div className="flex items-center justify-between w-full pr-8">
            <div>
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-emphasis">
                Editar Rol: {role?.name}
              </h3>
              <p className="text-sm text-text-tertiary mt-0.5">
                {role?.id === 1
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
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  disabled={role?.isSystem}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">
                  Descripción
                </label>
                <InputField
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {role?.id !== 1 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">
                    Matriz de Permisos
                  </label>
                  <button
                    onClick={() => {
                      const allSelected =
                        editForm.permissionIds.length ===
                        allPermissions.length;
                      if (allSelected) {
                        setEditForm((prev) => ({
                          ...prev,
                          permissionIds: [],
                        }));
                      } else {
                        setEditForm((prev) => ({
                          ...prev,
                          permissionIds: allPermissions.map(
                            (p) => p.PERMISSIONS_ID,
                          ),
                        }));
                      }
                    }}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    {editForm.permissionIds.length === allPermissions.length
                      ? "Desmarcar todos"
                      : "Marcar todos"}
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
                        <th className="text-center py-3 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-20">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-white/5">
                      {modules.map((module) => {
                        const modulePermissions =
                          groupedPermissions[module] || [];
                        const selectedCount =
                          getModuleSelectedCount(module);
                        const totalCount = getModuleTotalCount(module);
                        const isFullySelected =
                          isModuleFullySelected(module);
                        const isPartiallySelected =
                          isModulePartiallySelected(module);

                        return (
                          <tr
                            key={module}
                            className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                          >
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleModule(module)}
                                className="flex items-center gap-2 text-left w-full group"
                              >
                                <input
                                  type="checkbox"
                                  checked={isFullySelected}
                                  ref={(el) => {
                                    if (el)
                                      el.indeterminate =
                                        isPartiallySelected;
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
                                {modulePermissions.map((permission) => {
                                  const actionName =
                                    permission.NAME.split(":")[1] ||
                                    permission.NAME;
                                  const isSelected =
                                    editForm.permissionIds.includes(
                                      permission.PERMISSIONS_ID,
                                    );

                                  return (
                                    <button
                                      key={permission.PERMISSIONS_ID}
                                      onClick={() =>
                                        handleTogglePermission(
                                          permission.PERMISSIONS_ID,
                                        )
                                      }
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all duration-200 ${
                                        isSelected
                                          ? "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-500/30"
                                          : "bg-gray-100 dark:bg-gray-800 text-text-tertiary hover:bg-gray-200 dark:hover:bg-gray-700"
                                      }`}
                                      title={
                                        permission.DESCRIPTION ||
                                        permission.NAME
                                      }
                                    >
                                      {isSelected && (
                                        <svg
                                          className="w-3 h-3"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                      {actionName}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isFullySelected
                                    ? "bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-400"
                                    : isPartiallySelected
                                      ? "bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-400"
                                      : "bg-gray-100 dark:bg-gray-800 text-text-tertiary"
                                }`}
                              >
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

            {role?.id === 1 && (
              <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                      El rol Administrador tiene acceso total
                    </p>
                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                      Este rol posee todos los permisos del sistema y no pueden
                      ser modificados.
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
              {editForm.permissionIds.length} de {allPermissions.length}{" "}
              permisos seleccionados
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveRole}
                disabled={saving || !hasChanges}
                loading={saving}
                loadingText="Guardando..."
              >
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
