import { useState, useEffect, useCallback, useMemo } from "react";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import PageMeta from "../../../../components/common/PageMeta";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton } from "../../../../components/ui/skeleton";
import { List, ListValue } from "../../../../features/lists/types";
import * as listsService from "../../../../features/lists/services/listsService";
import { ShieldCheckIcon } from "../../../../icons";
import { Modal, ModalHeader, ModalBody } from "../../../../components/ui/modal";
import { CrudForm, CrudFieldConfig, CrudFormValues } from "../../../../features/crudTemplate/components/CrudForm";
import { UnifiedDialog } from "../../../../components/ui/dialog/UnifiedDialog";
import { useUnsavedChanges } from "../../../../hooks/useUnsavedChanges";
import { useToast } from "../../../../context/toast";
import { matchSearch } from "../../../../utils/searchNormalizer";
import ConfigLayout from "../../ConfigLayout";
import ListSelector from "./components/ListSelector";
import ListValueEditor from "./components/ListValueEditor";

const ListsConfiguration = () => {
  const { addToast } = useToast();
  const [lists, setLists] = useState<List[]>([]);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Estados de búsqueda ─────────────────────────────────────────────
  const [listSearch, setListSearch] = useState("");
  const [valueSearch, setValueSearch] = useState("");

  // ─── Estados de modales ───────────────────────────────────────────────
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<ListValue | null>(null);
  const [isValueDirty, setIsValueDirty] = useState(false);

  // ─── Tipos y estado de confirmación ───────────────────────────────────
  type ConfirmationInfo = {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    cancelText?: string;
    variant?: "info" | "warning" | "error" | "success" | "confirm";
  };

  const [confirmation, setConfirmation] = useState<ConfirmationInfo | null>(null);

  const {
    showConfirmation: showValueExitConfirm,
    handleCloseAttempt: handleValueCloseAttempt,
    confirmClose: confirmValueClose,
    cancelClose: cancelValueClose,
  } = useUnsavedChanges(isValueDirty, () => {
    setIsValueModalOpen(false);
    setIsValueDirty(false);
  });

  // ─── Carga de datos ───────────────────────────────────────────────────
  const loadLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listsService.getAllLists();
      setLists(data);

      setSelectedList(prev => {
        if (data.length === 0) return null;
        if (prev) {
          const found = data.find(l => l.id === prev.id);
          if (found) return found;
        }
        return data[0] || null;
      });
    } catch (error) {
      console.error("Error loading lists:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // ─── Filtros con búsqueda ─────────────────────────────────────────────
  const filteredLists = useMemo(() => {
    if (!listSearch.trim()) return lists;
    return lists.filter(
      l =>
        matchSearch(l.name, listSearch) ||
        l.values.some(v => matchSearch(v.name, listSearch))
    );
  }, [lists, listSearch]);

  const filteredValues = useMemo(() => {
    if (!selectedList) return [];
    if (!valueSearch.trim()) return selectedList.values;
    return selectedList.values.filter(
      v =>
        matchSearch(v.name, valueSearch) ||
        matchSearch(v.abbreviation || "", valueSearch)
    );
  }, [selectedList, valueSearch]);

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleToggleValueStatus = async (value: ListValue) => {
    const isActivating = !value.status;
    setConfirmation({
      isOpen: true,
      title: isActivating ? "Confirmar Activación" : "Confirmar Desactivación",
      message: isActivating
        ? `¿Estás seguro de que deseas activar el valor "${value.name}"?`
        : `¿Estás seguro de que deseas desactivar el valor "${value.name}"?`,
      confirmText: isActivating ? "Activar" : "Desactivar",
      variant: isActivating ? "success" : "error",
      onConfirm: async () => {
        try {
          await listsService.toggleValueStatus(value.id, isActivating);
          loadLists();
        } catch (error) {
          console.error("Error toggling value status:", error);
        } finally {
          setConfirmation(null);
        }
      },
    });
  };

  const performSaveValue = async (values: CrudFormValues) => {
    if (!selectedList) return;
    try {
      if (editingValue) {
        await listsService.updateValue(editingValue.id, values.name as string, values.abbreviation as string);
      } else {
        await listsService.createValue(selectedList.id, values.name as string, values.abbreviation as string);
      }
      setIsValueModalOpen(false);
      setIsValueDirty(false);
      loadLists();
    } catch (error) {
      console.error("Error saving value:", error);
    }
  };

  const valueFields: CrudFieldConfig[] = [
    { name: "name", label: "Nombre del Valor", type: "text", required: true, placeholder: "Ej: Venezolana" },
    { name: "abbreviation", label: "Abreviación", type: "text", placeholder: "Ej: V" },
  ];

  return (
    <ConfigLayout>
      <PageMeta 
        title="Configuración de Combos | UNEFA" 
        description="Gestión de listas desplegables del sistema" 
      />

      <SkeletonLoader
        isLoading={isLoading}
        id="lists-page-header"
        skeleton={<BreadcrumbSkeleton />}
      >
        <PageBreadcrumb pageTitle="Configuración de Combos" />
      </SkeletonLoader>

      <div className="stagger-delay">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SkeletonLoader isLoading={isLoading} skeleton={<TitleSkeleton />} id="lists-title">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  Gestión de Listas (Combos)
                </h2>
              </div>
              <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
                Administra las opciones de los campos desplegables en todo el sistema.
              </p>
            </SkeletonLoader>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <ListSelector
            lists={filteredLists}
            totalCount={lists.length}
            selectedId={selectedList?.id}
            onSelect={setSelectedList}
            loading={isLoading}
            search={listSearch}
            onSearchChange={setListSearch}
          />

          <ListValueEditor
            list={selectedList}
            values={filteredValues}
            loading={isLoading}
            search={valueSearch}
            onSearchChange={setValueSearch}
            onAddValue={() => { setEditingValue(null); setIsValueModalOpen(true); }}
            onEditValue={(val: ListValue) => { setEditingValue(val); setIsValueModalOpen(true); }}
            onToggleStatus={handleToggleValueStatus}
          />
        </div>
      </div>

      {/* Value Modal */}
      <Modal isOpen={isValueModalOpen} onClose={handleValueCloseAttempt}>
        <ModalHeader>{editingValue ? "Editar Valor" : "Nuevo Valor"}</ModalHeader>
        <ModalBody>
          {editingValue?.inUse && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Valor en uso
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Este valor está referenciado en otros registros. Solo puedes modificar la abreviatura; el nombre no se puede cambiar.
                </p>
              </div>
            </div>
          )}
          <CrudForm 
            fields={valueFields}
            initialValues={editingValue ? { name: editingValue.name, abbreviation: editingValue.abbreviation } : {}}
            onSubmit={performSaveValue}
            secondaryActionLabel="Cancelar"
            onSecondaryAction={handleValueCloseAttempt}
            onDirtyChange={setIsValueDirty}
          />
        </ModalBody>
      </Modal>

      {/* Unsaved Changes Confirm Dialog - Value */}
      <UnifiedDialog
        isOpen={showValueExitConfirm}
        onClose={cancelValueClose}
        onConfirm={confirmValueClose}
        title="Cambios no guardados"
        message="¿Estás seguro de que deseas cerrar? Los cambios no guardados se perderán."
        confirmLabel="Cerrar sin guardar"
        cancelLabel="Continuar editando"
        variant="warning"
      />

      {/* General Action Confirmation Dialog */}
      {confirmation && (
        <UnifiedDialog
          isOpen={confirmation.isOpen}
          onClose={() => setConfirmation(null)}
          onConfirm={confirmation.onConfirm}
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmText || "Confirmar"}
          cancelLabel={confirmation.cancelText || "Cancelar"}
          variant={confirmation.variant || "info"}
        />
      )}
    </ConfigLayout>
  );
};

export default ListsConfiguration;
