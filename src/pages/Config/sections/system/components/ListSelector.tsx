import { motion, AnimatePresence } from "framer-motion";
import { SearchInput } from "../../../../../components/ui/form/SearchInput";
import { SkeletonLoader, Skeleton } from "../../../../../components/ui/skeleton";
import ComponentCard from "../../../../../components/common/ComponentCard";
import { ListIcon, FolderIcon, SearchIcon, ShieldCheckIcon } from "../../../../../icons";
import { List } from "../../../../../features/lists/types";
import { isProtectedList } from "../../../../../constants/systemLists";

// ─── Variants de animación ─────────────────────────────────────────────
const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

interface ListSelectorProps {
  lists: List[];
  totalCount: number;
  selectedId?: string;
  onSelect: (list: List) => void;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}

const ListSelector = ({
  lists,
  totalCount,
  selectedId,
  onSelect,
  loading,
  search,
  onSearchChange,
}: ListSelectorProps) => {
  return (
    <div className="lg:col-span-4">
      <ComponentCard
        title={
          <span className="flex items-center gap-2">
            <ListIcon className="h-4 w-4 text-brand-500" />
            Listas
            <span className="text-sm font-normal text-text-tertiary dark:text-text-tertiary">
              {search.trim()
                ? `${lists.length} de ${totalCount}`
                : `(${totalCount})`
              }
            </span>
          </span>
        }
        desc="Selecciona una lista para ver sus valores"
      >
        {/* Buscador integrado en el panel */}
        <SearchInput
          placeholder="Buscar listas o valores…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
        />

        {/* Lista scrolleable */}
        <div className="overflow-y-auto lg:max-h-[calc(100vh-340px)] custom-scrollbar -mx-1 px-1">
          <SkeletonLoader
            isLoading={loading}
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
              {lists.map((list) => {
                const activeValues = list.values.filter(v => v.status).length;
                const inUseValues = list.values.filter(v => v.inUse).length;
                const totalValues = list.values.length;
                const isSelected = selectedId === list.id;

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
                    onClick={() => onSelect(list)}
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
                          <ShieldCheckIcon className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" aria-label="Lista protegida por el sistema" />
                        )}
                        {!isProtectedList(list.name) && list.hasInUseValues && (
                          <ShieldCheckIcon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" aria-label="Tiene valores en uso" />
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

            {lists.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-12 text-text-tertiary"
              >
                <SearchIcon className="h-10 w-10 opacity-20 mb-3" />
                <p className="text-sm">
                  {search.trim()
                    ? `Sin resultados para "${search}"`
                    : "No hay listas registradas"
                  }
                </p>
              </motion.div>
            )}
          </SkeletonLoader>
        </div>
      </ComponentCard>
    </div>
  );
};

export default ListSelector;
