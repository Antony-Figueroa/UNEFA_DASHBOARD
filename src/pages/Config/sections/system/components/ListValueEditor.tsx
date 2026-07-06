import { motion, AnimatePresence } from "framer-motion";
import { SearchInput } from "@/components/ui/form/SearchInput";
import { SkeletonLoader, Skeleton } from "@/components/ui/skeleton";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { PlusCircleIcon } from "@/icons/actions";
import { PencilIcon, ListIcon, FolderIcon, SearchIcon, CheckIcon, CloseLineIcon, ShieldCheckIcon } from "@/icons";
import { List, ListValue } from "@/features/lists/types";
import { isProtectedList } from "@/constants/systemLists";

// ─── Variants de animación ─────────────────────────────────────────────
const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

interface ListValueEditorProps {
  list: List | null;
  values: ListValue[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onAddValue: () => void;
  onEditValue: (value: ListValue) => void;
  onToggleStatus: (value: ListValue) => void;
}

const ListValueEditor = ({
  list,
  values,
  loading,
  search,
  onSearchChange,
  onAddValue,
  onEditValue,
  onToggleStatus,
}: ListValueEditorProps) => {
  const isProtected = list ? isProtectedList(list.name) : false;

  return (
    <div className="lg:col-span-8">
      <ComponentCard
        title={
          <span className="flex items-center gap-2">
            <ListIcon className="h-4 w-4 text-brand-500" />
            <span className="truncate max-w-40 sm:max-w-60">
              {list ? `Valores: ${list.name}` : "Valores"}
            </span>
            <span className="text-sm font-normal text-text-tertiary dark:text-text-tertiary whitespace-nowrap">
              {list
                ? search.trim()
                  ? `${values.length} de ${list.values.length}`
                  : `(${list.values.length})`
                : "(0)"
              }
            </span>
            {isProtected && (
              <ShieldCheckIcon className="h-4 w-4 text-amber-500 flex-shrink-0" aria-label="Lista protegida" />
            )}
          </span>
        }
        desc={
          list
            ? "Valores disponibles en esta lista del sistema"
            : "Selecciona una lista para ver sus valores"
        }
        headerAction={
          list && (
            <Button
              size="sm"
              onClick={onAddValue}
              startIcon={<PlusCircleIcon className="h-4 w-4" />}
            >
              Añadir Valor
            </Button>
          )
        }
      >
        {/* Protected list banner */}
        {(isProtected || list?.hasInUseValues) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl flex items-start gap-3 border ${
              isProtected
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            }`}
          >
            <ShieldCheckIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              isProtected
                ? "text-amber-500"
                : "text-blue-500"
            }`} />
            <div>
              <p className={`text-sm font-semibold ${
                isProtected
                  ? "text-amber-800 dark:text-amber-200"
                  : "text-blue-800 dark:text-blue-200"
              }`}>
                {isProtected
                  ? "Lista protegida por el sistema"
                  : "Esta lista tiene valores en uso"
                }
              </p>
              <p className={`text-xs mt-0.5 ${
                isProtected
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-blue-700 dark:text-blue-300"
              }`}>
                {isProtected
                  ? "Puedes agregar nuevos valores. Los valores en uso no se pueden modificar ni eliminar."
                  : "Los valores marcados como \"En uso\" no se pueden modificar ni eliminar porque están referenciados en otros registros del sistema."
                }
              </p>
            </div>
          </motion.div>
        )}

        {/* Buscador de valores */}
        {list && (
          <SearchInput
            placeholder="Buscar dentro de los valores…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
          />
        )}

        {/* Valores scrolleables */}
        <div className="overflow-y-auto lg:max-h-[calc(100vh-340px)] custom-scrollbar -mx-1 px-1">
          <SkeletonLoader
            isLoading={loading}
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
            {list ? (
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {values.map((val) => (
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
                        onClick={() => onToggleStatus(val)}
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
                            onEditValue(val);
                          }}
                          disabled={val.inUse}
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {values.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center py-14 text-text-tertiary"
                  >
                    {search.trim() ? (
                      <>
                        <SearchIcon className="h-10 w-10 opacity-20 mb-3" />
                        <p className="text-sm">
                          Sin resultados para "{search}"
                        </p>
                      </>
                    ) : (
                      <>
                        <FolderIcon className="h-12 w-12 opacity-20 mb-3" />
                        <p className="text-sm font-medium">Esta lista no tiene valores</p>
                        <p className="text-xs mt-1">Usa el botón "Añadir Valor" para crear el primero.</p>
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
                <p className="text-sm font-medium">Selecciona una lista</p>
                <p className="text-xs mt-1">Elige una lista del panel izquierdo para ver sus valores</p>
              </motion.div>
            )}
          </SkeletonLoader>
        </div>
      </ComponentCard>
    </div>
  );
};

export default ListValueEditor;
