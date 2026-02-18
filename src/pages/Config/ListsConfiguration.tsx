import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon } from "../../icons/actions";
import { List, ListValue } from "../../features/lists/types";
import * as listsService from "../../features/lists/services/listsService";
import Badge from "../../components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon, CheckCircleIcon } from "../../icons";
import { Modal, ModalHeader, ModalBody } from "../../components/ui/modal";
import { CrudForm, CrudFieldConfig, CrudFormValues } from "../../features/crudTemplate/components/CrudForm";
import { UnifiedDialog } from "../../components/ui/dialog/UnifiedDialog";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { useToast } from "../../context/toast";

const ListsConfiguration = () => {
  const { addToast } = useToast();
  const [lists, setLists] = useState<List[]>([]);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<ListValue | null>(null);
  
  // Dirty states
  const [isListDirty, setIsListDirty] = useState(false);
  const [isValueDirty, setIsValueDirty] = useState(false);

  // Delete Confirm states - Removed as part of redundant confirmation cleanup

  /**
   * Definición de tipos para el estado de confirmación.
   */
  type ConfirmationInfo = {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "info" | "warning" | "error" | "success" | "confirm";
  };

  const [confirmation, setConfirmation] = useState<ConfirmationInfo | null>(null);

  const {
    showConfirmation: showListExitConfirm,
    handleCloseAttempt: handleListCloseAttempt,
    confirmClose: confirmListClose,
    cancelClose: cancelListClose,
  } = useUnsavedChanges(isListDirty, () => {
    setIsListModalOpen(false);
    setIsListDirty(false);
  });

  const {
    showConfirmation: showValueExitConfirm,
    handleCloseAttempt: handleValueCloseAttempt,
    confirmClose: confirmValueClose,
    cancelClose: cancelValueClose,
  } = useUnsavedChanges(isValueDirty, () => {
    setIsValueModalOpen(false);
    setIsValueDirty(false);
  });


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

  const handleToggleListStatus = async (list: List) => {
    const isActivating = !list.status;
    setConfirmation({
      isOpen: true,
      title: isActivating ? "Confirmar Activación" : "Confirmar Desactivación",
      message: isActivating 
        ? `¿Estás seguro de que deseas activar la lista "${list.name}"?` 
        : `¿Estás seguro de que deseas desactivar la lista "${list.name}"?`,
      confirmText: isActivating ? "Activar" : "Desactivar",
      variant: isActivating ? "success" : "error",
      onConfirm: async () => {
        try {
          await listsService.toggleListStatus(list.id, isActivating);
          loadLists();
          addToast({
            variant: "success",
            title: isActivating ? "Lista activada" : "Lista desactivada",
            message: isActivating 
              ? `La lista "${list.name}" ha sido activada correctamente.`
              : `La lista "${list.name}" ha sido desactivada correctamente.`
          });
        } catch (error: any) {
          console.error("Error toggling list status:", error);
          addToast({
            variant: "error",
            title: "Error al cambiar estado",
            message: error.response?.data?.message || error.message || "No se pudo cambiar el estado de la lista."
          });
        } finally {
          setConfirmation(null);
        }
      }
    });
  };

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
      }
    });
  };


  const handleDeleteValue = async (id: string) => {
    setConfirmation({
      isOpen: true,
      title: "Eliminar Valor",
      message: "¿Estás seguro de que deseas eliminar este valor? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      variant: "error",
      onConfirm: async () => {
        try {
          await listsService.deleteValue(id);
          loadLists();
          addToast({
            variant: "success",
            title: "Valor eliminado",
            message: "El valor ha sido eliminado correctamente."
          });
        } catch (error: any) {
          console.error("Error deleting value:", error);
          addToast({
            variant: "error",
            title: "Error al eliminar valor",
            message: error.response?.data?.message || error.message || "No se pudo eliminar el valor."
          });
        } finally {
          setConfirmation(null);
        }
      }
    });
  };

  const performSaveList = async (values: CrudFormValues) => {
    try {
      if (editingList) {
        await listsService.updateList(editingList.id, values.name as string);
      } else {
        await listsService.createList(values.name as string);
      }
      setIsListModalOpen(false);
      setIsListDirty(false);
      loadLists();
    } catch (error) {
      console.error("Error saving list:", error);
    }
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

  const listFields: CrudFieldConfig[] = [
    { name: "name", label: "Nombre de la Lista", type: "text", required: true, placeholder: "Ej: Nacionalidad" }
  ];

  const valueFields: CrudFieldConfig[] = [
    { name: "name", label: "Nombre del Valor", type: "text", required: true, placeholder: "Ej: Venezolana" },
    { name: "abbreviation", label: "Abreviación", type: "text", placeholder: "Ej: V" }
  ];

  return (
    <>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Panel Izquierdo: Listas */}
          <div className="lg:col-span-1">
            <ComponentCard 
              title={
                <span className="flex items-center gap-2">
                  Listas Disponibles
                  <span className="text-sm font-normal text-text-tertiary dark:text-text-tertiary">
                    ({lists.length})
                  </span>
                </span>
              }
              headerAction={
                <button 
                  className="text-brand-500 hover:text-brand-600 transition-colors"
                  title="Nueva Lista"
                  onClick={() => {
                    setEditingList(null);
                    setIsListModalOpen(true);
                  }}
                >
                  <PlusCircleIcon className="h-5 w-5" />
                </button>
              }
            >
              <SkeletonLoader
                isLoading={isLoading}
                id="lists-sidebar-loader"
                skeleton={<div className="space-y-2"><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div><div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div></div>}
              >
                <div className="flex flex-col gap-1 max-h-150 overflow-y-auto pr-2 custom-scrollbar">
                  {lists.map((list) => (
                    <div 
                      key={list.id}
                      className={`group flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        selectedList?.id === list.id
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20 shadow-sm"
                          : "text-text-secondary hover:bg-gray-50 dark:hover:bg-white/5 hover:text-text-emphasis border border-transparent"
                      }`}
                      onClick={() => setSelectedList(list)}
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="truncate max-w-30">{list.name}</span>
                        <span className="text-[10px] opacity-70 uppercase tracking-wider">
                          {list.values.length} valores
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={list.status ? "success" : "error"} size="sm">
                          {list.status ? "Activa" : "Inactiva"}
                        </Badge>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingList(list);
                            setIsListModalOpen(true);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-brand-500 transition-all"
                          title="Editar"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        {list.status ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleListStatus(list);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-error-500 transition-all"
                            title="Desactivar"
                          >
                            <TrashBinIcon className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleListStatus(list);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-success-500 transition-all"
                            title="Activar"
                          >
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {lists.length === 0 && !isLoading && (
                    <div className="text-center py-10 text-text-tertiary">
                      No hay listas registradas
                    </div>
                  )}
                </div>
              </SkeletonLoader>
            </ComponentCard>
          </div>

          {/* Panel Derecho: Valores de la Lista Seleccionada */}
          <div className="lg:col-span-2">
            <ComponentCard 
              title={
                selectedList ? (
                  <span className="flex items-center gap-2">
                    Valores: {selectedList.name}
                    <span className="text-sm font-normal text-text-tertiary dark:text-text-tertiary">
                      ({selectedList.values.length})
                    </span>
                  </span>
                ) : (
                  "Seleccione una lista"
                )
              }
              headerAction={
                 selectedList && (
                   <div className="flex items-center gap-3">
                     <Button 
                       size="sm"
                       onClick={() => {
                         setEditingValue(null);
                         setIsValueModalOpen(true);
                       }}
                       startIcon={<PlusCircleIcon className="h-4 w-4" />}
                     >
                       Añadir Valor
                     </Button>
                   </div>
                 )
               }
            >
              <SkeletonLoader
                isLoading={isLoading}
                id="list-values-loader"
                skeleton={<TablePageSkeleton rows={5} />}
              >
                {selectedList ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-light dark:border-border-dark">
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-text-tertiary tracking-wider">Valor / Nombre</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-text-tertiary tracking-wider">Abreviación</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-text-tertiary tracking-wider text-center">Estado</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase text-text-tertiary tracking-wider text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light dark:divide-border-dark">
                        {selectedList.values.map((val) => (
                          <tr key={val.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-4 text-sm font-medium text-text-primary dark:text-text-emphasis">
                              {val.name}
                            </td>
                            <td className="px-4 py-4 text-sm text-text-secondary dark:text-text-tertiary">
                              {val.abbreviation || "-"}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button 
                                onClick={() => handleToggleValueStatus(val)}
                                className="inline-block"
                              >
                                <Badge color={val.status ? "success" : "error"}>
                                  {val.status ? "Activo" : "Inactivo"}
                                </Badge>
                              </button>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  className="p-1.5 text-text-secondary hover:text-brand-500 transition-colors"
                                  title="Editar"
                                  onClick={() => {
                                    setEditingValue(val);
                                    setIsValueModalOpen(true);
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button 
                                  className="p-1.5 text-text-secondary hover:text-error-500 transition-colors"
                                  title="Eliminar"
                                  onClick={() => handleDeleteValue(val.id)}
                                >
                                  <TrashBinIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {selectedList.values.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-text-tertiary text-sm">
                              Esta lista no tiene valores definidos aún.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
                    <PlusCircleIcon className="h-12 w-12 opacity-20 mb-4" />
                    <p>Seleccione una lista de la izquierda para ver sus valores</p>
                  </div>
                )}
              </SkeletonLoader>
            </ComponentCard>
          </div>
        </div>
      </div>

      {/* List Modal */}
      <Modal isOpen={isListModalOpen} onClose={handleListCloseAttempt}>
        <ModalHeader>{editingList ? "Editar Lista" : "Nueva Lista"}</ModalHeader>
        <ModalBody>
          <CrudForm 
            fields={listFields}
            initialValues={editingList ? { name: editingList.name } : {}}
            onSubmit={performSaveList}
            secondaryActionLabel="Cancelar"
            onSecondaryAction={handleListCloseAttempt}
            onDirtyChange={setIsListDirty}
          />
        </ModalBody>
      </Modal>

      {/* Value Modal */}
      <Modal isOpen={isValueModalOpen} onClose={handleValueCloseAttempt}>
        <ModalHeader>{editingValue ? "Editar Valor" : "Nuevo Valor"}</ModalHeader>
        <ModalBody>
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

      {/* Unsaved Changes Confirm Dialog - List */}
      <UnifiedDialog
        isOpen={showListExitConfirm}
        onClose={cancelListClose}
        onConfirm={confirmListClose}
        title="Cambios no guardados"
        message="¿Estás seguro de que deseas cerrar? Los cambios no guardados se perderán."
        confirmLabel="Cerrar sin guardar"
        cancelLabel="Continuar editando"
        variant="warning"
      />

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
    </>
  );
};

export default ListsConfiguration;
