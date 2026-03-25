import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, TablePageSkeleton, Skeleton } from "../../components/ui/skeleton";
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
import { isProtectedList, PROTECTED_LIST_MESSAGE } from "../../constants/systemLists";

const ListsConfiguration = () => {
  const { addToast } = useToast();
  const [lists, setLists] = useState<List[]>([]);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<ListValue | null>(null);
  
  // Dirty state
  const [isValueDirty, setIsValueDirty] = useState(false);

  // Delete Confirm states - Removed as part of redundant confirmation cleanup

  /**
   * Definición de tipos para el estado de confirmación.
   */
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

  const isSelectedListProtected = selectedList ? isProtectedList(selectedList.name) : false;


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
              headerAction={undefined}
            >
              <SkeletonLoader
                isLoading={isLoading}
                id="lists-sidebar-loader"
                skeleton={
                  <div className="space-y-2">
                    <Skeleton height={40} className="w-full" />
                    <Skeleton height={40} className="w-full" />
                  </div>
                }
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
                      <Badge color={list.status ? "success" : "error"} size="sm">
                        {list.status ? "Activa" : "Inactiva"}
                      </Badge>
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
                       disabled={isSelectedListProtected}
                       onClick={() => {
                         if (!isSelectedListProtected) {
                           setEditingValue(null);
                           setIsValueModalOpen(true);
                         }
                       }}
                       startIcon={<PlusCircleIcon className="h-4 w-4" />}
                     >
                       {isSelectedListProtected ? "Lista protegida" : "Añadir Valor"}
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
                    {isSelectedListProtected && (
                      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <strong>Lista protegida:</strong> {PROTECTED_LIST_MESSAGE}
                        </p>
                      </div>
                    )}
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
                              <div className={`flex justify-end gap-2 ${isSelectedListProtected ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <button 
                                  className={`p-1.5 transition-colors ${isSelectedListProtected ? 'text-text-tertiary' : 'text-text-secondary hover:text-brand-500'}`}
                                  title={isSelectedListProtected ? PROTECTED_LIST_MESSAGE : "Editar"}
                                  disabled={isSelectedListProtected}
                                  onClick={() => {
                                    if (!isSelectedListProtected) {
                                      setEditingValue(val);
                                      setIsValueModalOpen(true);
                                    }
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                {val.status ? (
                                  <button 
                                    className={`p-1.5 transition-colors ${isSelectedListProtected ? 'text-text-tertiary' : 'text-text-secondary hover:text-error-500'}`}
                                    title={isSelectedListProtected ? PROTECTED_LIST_MESSAGE : "Desactivar"}
                                    disabled={isSelectedListProtected}
                                    onClick={() => !isSelectedListProtected && handleToggleValueStatus(val)}
                                  >
                                    <TrashBinIcon className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button 
                                    className={`p-1.5 transition-colors ${isSelectedListProtected ? 'text-text-tertiary' : 'text-text-secondary hover:text-success-500'}`}
                                    title="Activar"
                                    onClick={() => handleToggleValueStatus(val)}
                                  >
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </button>
                                )}
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
