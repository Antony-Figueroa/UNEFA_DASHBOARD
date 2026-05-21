import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { SearchInput } from "../../components/ui/form/SearchInput";
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton, Skeleton } from "../../components/ui/skeleton";
import { PlusCircleIcon } from "../../icons/actions";
import { List, ListValue } from "../../features/lists/types";
import * as listsService from "../../features/lists/services/listsService";
import { PencilIcon, ShieldCheckIcon, ListIcon, FolderIcon, SearchIcon, CheckIcon, CloseLineIcon } from "../../icons";
import { Modal, ModalHeader, ModalBody } from "../../components/ui/modal";
import { CrudForm, CrudFieldConfig, CrudFormValues } from "../../features/crudTemplate/components/CrudForm";
import { UnifiedDialog } from "../../components/ui/dialog/UnifiedDialog";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { useToast } from "../../context/toast";
import { isProtectedList } from "../../constants/systemLists";
import { matchSearch } from "../../utils/searchNormalizer";

// ─── Variants de animación ─────────────────────────────────────────────
const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

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

  const isSelectedListProtected = selectedList ? isProtectedList(selectedList.name) : false;

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ─── Panel Izquierdo: Listas con buscador integrado ───────── */}
          <div className="lg:col-span-4">
            <ComponentCard
              title={
                <span className="flex items-center gap-2">
                  <ListIcon className="h-4 w-4 text-brand-500" />
                  Listas
                  <span className="text-sm font-normal text-text-tertiary dark:text-text-tertiary">
                    {listSearch.trim()
                      ? `${filteredLists.length} de ${lists.length}`
                      : `(${lists.length})`
                    }
                  </span>
                </span>
              }
              desc="Seleccioná una lista para ver sus valores"
            >
              {/* Buscador integrado en el panel */}
              <SearchInput
                placeholder="Buscar listas o valores…"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                autoComplete="off"
              />

              {/* Lista scrolleable */}
              <div className="overflow-y-auto lg:max-h-[calc(100vh-340px)] custom-scrollbar -mx-1 px-1">
                <SkeletonLoader
                  isLoading={isLoading}
                  id="lists-sidebar-loader"
                  skeleton={
                    <div className="space-y-2">
                      <Skeleton height={48} className="w-full" />
                      <Skeleton height={48} className="w-full" />
                      <Skeleton height={48} className="w-full" />
                    </div>
                  }
                >
                  <AnimatePresence mode="popLayout">
                    {filteredLists.map((list) => {
                      const activeValues = list.values.filter(v => v.status).length;
                      const inUseValues = list.values.filter(v => v.inUse).length;
                      const totalValues = list.values.length;
                      const isSelected = selectedList?.id === list.id;

                      return (
                        <motion.div
                          key={list.id}
                          layout
                          variants={itemVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer mb-1 ${
                            isSelected
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20 shadow-sm"
                              : "text-text-secondary hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-text-emphasis border border-transparent"
                          }`}
                          onClick={() => setSelectedList(list)}
                        >
                          {/* Indicador de selección */}
                          {isSelected && (
                            <motion.div
                              layoutId="list-selection-indicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-brand-500 rounded-full"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}

                          {/* Icono tipo folder */}
                          <div className={`flex-shrink-0 flex items-center justify-center size-9 rounded-lg ${
                            isSelected
                              ? "bg-brand-100 text-brand-600 dark:bg-brand-400/20 dark:text-brand-400"
                              : "bg-gray-100 text-text-tertiary dark:bg-white/5 dark:text-text-secondary"
                          }`}>
                            <FolderIcon className="h-4 w-4" />
                          </div>

                          {/* Nombre y contador */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">
                                {list.name}
                              </span>
                              {isProtectedList(list.name) && (
                                <ShieldCheckIcon className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" title="Lista protegida por el sistema" />
                              )}
                              {!isProtectedList(list.name) && list.hasInUseValues && (
                                <ShieldCheckIcon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" title="Tiene valores en uso" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-text-tertiary dark:text-text-tertiary uppercase tracking-wider">
                                {totalValues} valor{totalValues !== 1 ? "es" : ""}
                              </span>
                              {activeValues > 0 && (
                                <>
                                  <span className="text-[8px] text-text-tertiary">·</span>
                                  <span className="text-[10px] text-success-600 dark:text-success-400 font-medium">
                                    {activeValues} activ{activeValues !== 1 ? "os" : "o"}
                                  </span>
                                </>
                              )}
                              {inUseValues > 0 && (
                                <>
                                  <span className="text-[8px] text-text-tertiary">·</span>
                                  <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">
                                    {inUseValues} en uso
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status dot */}
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                            list.status ? "bg-success-500" : "bg-gray-300 dark:bg-gray-600"
                          }`} />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {filteredLists.length === 0 && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center py-12 text-text-tertiary"
                    >
                      <SearchIcon className="h-10 w-10 opacity-20 mb-3" />
                      <p className="text-sm">
                        {listSearch.trim()
                          ? `Sin resultados para "${listSearch}"`
                          : "No hay listas registradas"
                        }
                      </p>
                    </motion.div>
                  )}
                </SkeletonLoader>
              </div>
            </ComponentCard>
          </div>

          {/* ─── Panel Derecho: Valores con buscador integrado ────────── */}
          <div className="lg:col-span-8">
            <ComponentCard
              title={
                <span className="flex items-center gap-2">
                  <ListIcon className="h-4 w-4 text-brand-500" />
                  <span className="truncate max-w-40 sm:max-w-60">
                    {selectedList ? `Valores: ${selectedList.name}` : "Valores"}
                  </span>
                  <span className="text-sm font-normal text-text-tertiary dark:text-text-tertiary whitespace-nowrap">
                    {selectedList
                      ? valueSearch.trim()
                        ? `${filteredValues.length} de ${selectedList.values.length}`
                        : `(${selectedList.values.length})`
                      : "(0)"
                    }
                  </span>
                  {isSelectedListProtected && (
                    <ShieldCheckIcon className="h-4 w-4 text-amber-500 flex-shrink-0" title="Lista protegida" />
                  )}
                </span>
              }
              desc={
                selectedList
                  ? "Valores disponibles en esta lista del sistema"
                  : "Seleccioná una lista para ver sus valores"
              }
              headerAction={
                selectedList && (
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
                )
              }
            >
              {/* Protected list banner */}
              {(isSelectedListProtected || selectedList?.hasInUseValues) && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl flex items-start gap-3 border ${
                    isSelectedListProtected
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  }`}
                >
                  <ShieldCheckIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    isSelectedListProtected
                      ? "text-amber-500"
                      : "text-blue-500"
                  }`} />
                  <div>
                    <p className={`text-sm font-semibold ${
                      isSelectedListProtected
                        ? "text-amber-800 dark:text-amber-200"
                        : "text-blue-800 dark:text-blue-200"
                    }`}>
                      {isSelectedListProtected
                        ? "Lista protegida por el sistema"
                        : "Esta lista tiene valores en uso"
                      }
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      isSelectedListProtected
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-blue-700 dark:text-blue-300"
                    }`}>
                      {isSelectedListProtected
                        ? "Podés agregar nuevos valores. Los valores en uso no se pueden modificar ni eliminar."
                        : "Los valores marcados como \"En uso\" no se pueden modificar ni eliminar porque están referenciados en otros registros del sistema."
                      }
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Buscador de valores */}
              {selectedList && (
                <SearchInput
                  placeholder="Buscar dentro de los valores…"
                  value={valueSearch}
                  onChange={(e) => setValueSearch(e.target.value)}
                  autoComplete="off"
                />
              )}

              {/* Valores scrolleables */}
              <div className="overflow-y-auto lg:max-h-[calc(100vh-340px)] custom-scrollbar -mx-1 px-1">
                <SkeletonLoader
                  isLoading={isLoading}
                  id="list-values-loader"
                  skeleton={
                    <div className="space-y-2">
                      <Skeleton height={40} className="w-full" />
                      <Skeleton height={56} className="w-full" />
                      <Skeleton height={56} className="w-full" />
                      <Skeleton height={56} className="w-full" />
                    </div>
                  }
                >
                  {selectedList ? (
                    <div className="space-y-1">
                      <AnimatePresence mode="popLayout">
                        {filteredValues.map((val) => (
                          <motion.div
                            key={val.id}
                            layout
                            variants={itemVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className={`group flex items-center gap-4 px-4 py-3 rounded-xl border ${
                              val.inUse
                                ? "border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10"
                                : "border-border-light dark:border-border-dark bg-white dark:bg-transparent"
                            } hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors`}
                          >
                            {/* Nombre + Badge de uso */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                                  {val.name}
                                </span>
                                {val.inUse && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 rounded-md whitespace-nowrap"
                                    title="Este valor está siendo usado en registros del sistema"
                                  >
                                    <ShieldCheckIcon className="h-3 w-3" />
                                    En uso
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Abreviación */}
                            <div className="hidden sm:block min-w-0">
                              {val.abbreviation ? (
                                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium bg-gray-100 dark:bg-white/5 text-text-secondary dark:text-text-tertiary rounded-md">
                                  {val.abbreviation}
                                </span>
                              ) : (
                                <span className="text-xs text-text-tertiary">—</span>
                              )}
                            </div>

                            {/* Status toggle */}
                            <button
                              onClick={() => handleToggleValueStatus(val)}
                              className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                val.status
                                  ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-500/20"
                                  : "bg-gray-50 text-text-tertiary dark:bg-white/5 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
                              }`}
                            >
                              {val.status ? (
                                <>
                                  <CheckIcon className="h-3 w-3" />
                                  Activo
                                </>
                              ) : (
                                <>
                                  <CloseLineIcon className="h-3 w-3" />
                                  Inactivo
                                </>
                              )}
                            </button>

                            {/* Acciones */}
                            <div className="flex items-center gap-1">
                              <button
                                className={`p-2 rounded-lg transition-colors ${
                                  val.inUse
                                    ? "text-text-tertiary cursor-not-allowed opacity-50"
                                    : "text-text-secondary hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                                }`}
                                title={val.inUse ? "No se puede editar: está siendo usado en otros registros" : "Editar valor"}
                                onClick={() => {
                                  if (val.inUse) return;
                                  setEditingValue(val);
                                  setIsValueModalOpen(true);
                                }}
                                disabled={val.inUse}
                              >
                                <PencilIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {filteredValues.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center py-14 text-text-tertiary"
                        >
                          {valueSearch.trim() ? (
                            <>
                              <SearchIcon className="h-10 w-10 opacity-20 mb-3" />
                              <p className="text-sm">
                                Sin resultados para "{valueSearch}"
                              </p>
                            </>
                          ) : (
                            <>
                              <FolderIcon className="h-12 w-12 opacity-20 mb-3" />
                              <p className="text-sm font-medium">Esta lista no tiene valores</p>
                              <p className="text-xs mt-1">Usá el botón "Añadir Valor" para crear el primero.</p>
                            </>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center py-20 text-text-tertiary"
                    >
                      <ListIcon className="h-14 w-14 opacity-10 mb-4" />
                      <p className="text-sm font-medium">Seleccioná una lista</p>
                      <p className="text-xs mt-1">Elegí una lista del panel izquierdo para ver sus valores</p>
                    </motion.div>
                  )}
                </SkeletonLoader>
              </div>
            </ComponentCard>
          </div>
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
                  Este valor está referenciado en otros registros. Solo podés modificar la abreviatura; el nombre no se puede cambiar.
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
    </>
  );
};

export default ListsConfiguration;
