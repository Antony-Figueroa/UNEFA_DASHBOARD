/**
 * @file CommandPalette.tsx
 * @description Modal de comandos tipo Raycast/Linear con Ctrl+K
 * Busca navegación, acciones rápidas y entidades del sistema
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useCommandPalette } from "./CommandPaletteContext";
import { useAuth } from "../../context/auth";
import { SearchIcon, PlusIcon, UserIcon, FileIcon, UsersIcon, GridIcon, TableIcon, PageIcon, PieChartIcon, DocsIcon, MailIcon, SparklesIcon, CheckIcon, ShieldCheckIcon, LockIcon } from "../../icons";

// Tipos de resultados
type ResultType = "navigation" | "action" | "student" | "tutor" | "institution" | "career";

interface SearchResult {
  id: string;
  name: string;
  description?: string;
  type: ResultType;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

// Navigation item without id and action
interface NavItem {
  name: string;
  description: string;
  type: ResultType;
  icon: React.ReactNode;
  shortcut: string;
}

// Opciones de navegación
const navigationItems: NavItem[] = [
  { name: "Dashboard", description: "Panel principal", type: "navigation", icon: <PieChartIcon className="w-4 h-4" />, shortcut: "G D" },
  { name: "Estudiantes", description: "Gestión de estudiantes", type: "navigation", icon: <UsersIcon className="w-4 h-4" />, shortcut: "G E" },
  { name: "Carreras", description: "Gestión de carreras", type: "navigation", icon: <GridIcon className="w-4 h-4" />, shortcut: "G C" },
  { name: "Tutores", description: "Gestión de tutores", type: "navigation", icon: <UserIcon className="w-4 h-4" />, shortcut: "G T" },
  { name: "Instituciones", description: "Gestión de instituciones", type: "navigation", icon: <DocsIcon className="w-4 h-4" />, shortcut: "G I" },
  { name: "Pre-inscripciones", description: "Gestión de pre-inscripciones", type: "navigation", icon: <TableIcon className="w-4 h-4" />, shortcut: "G P" },
  { name: "Inscripciones", description: "Gestión de inscripciones", type: "navigation", icon: <FileIcon className="w-4 h-4" />, shortcut: "G N" },
  { name: "Informes", description: "Reportes y estadísticas", type: "navigation", icon: <PageIcon className="w-4 h-4" />, shortcut: "G R" },
  { name: "Configuración", description: "Configuración del sistema", type: "navigation", icon: <SparklesIcon className="w-4 h-4" />, shortcut: "G S" },
];

// Acciones rápidas
const actionItems: NavItem[] = [
  { name: "Nuevo Estudiante", description: "Registrar un nuevo estudiante", type: "action", icon: <PlusIcon className="w-4 h-4" />, shortcut: "N E" },
  { name: "Nueva Pre-inscripción", description: "Crear una nueva pre-inscripción", type: "action", icon: <PlusIcon className="w-4 h-4" />, shortcut: "N P" },
  { name: "Nueva Inscripción", description: "Registrar una nueva inscripción", type: "action", icon: <PlusIcon className="w-4 h-4" />, shortcut: "N I" },
  { name: "Nueva Institución", description: "Agregar una nueva institución", type: "action", icon: <PlusIcon className="w-4 h-4" />, shortcut: "N N" },
  { name: "Nuevo Tutor", description: "Registrar un nuevo tutor", type: "action", icon: <PlusIcon className="w-4 h-4" />, shortcut: "N T" },
  { name: "Nueva Carrera", description: "Agregar una nueva carrera", type: "action", icon: <PlusIcon className="w-4 h-4" />, shortcut: "N C" },
  { name: "Cerrar Sesión", description: "Salir de la cuenta", type: "action", icon: <LockIcon className="w-4 h-4" />, shortcut: "Q" },
];

// Mapeo de navegación a rutas
const navigationRoutes: Record<string, string> = {
  "Dashboard": "/dashboard",
  "Estudiantes": "/students",
  "Carreras": "/careers",
  "Tutores": "/tutors",
  "Instituciones": "/institutions",
  "Pre-inscripciones": "/pre-enrollment",
  "Inscripciones": "/enrollment",
  "Informes": "/dashboard",
  "Configuración": "/settings",
};

// Mapeo de acciones a eventos/funciones
const actionHandlers: Record<string, () => void> = {
  "Nuevo Estudiante": () => window.dispatchEvent(new CustomEvent("app:openStudentModal")),
  "Nueva Pre-inscripción": () => window.dispatchEvent(new CustomEvent("app:openPreEnrollmentModal")),
  "Nueva Inscripción": () => window.dispatchEvent(new CustomEvent("app:openEnrollmentModal")),
  "Nueva Institución": () => window.dispatchEvent(new CustomEvent("app:openInstitutionModal")),
  "Nuevo Tutor": () => window.dispatchEvent(new CustomEvent("app:openTutorModal")),
  "Nueva Carrera": () => window.dispatchEvent(new CustomEvent("app:openCareerModal")),
  "Cerrar Sesión": () => window.dispatchEvent(new CustomEvent("app:logout")),
};

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [entityResults, setEntityResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalizar texto para búsqueda (elimina tildes y convierte a minúsculas)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Construir resultados de navegación
  const navigationResults = useMemo(() => {
    if (!searchTerm) return navigationItems;
    const term = normalizeText(searchTerm);
    return navigationItems.filter(
      item => normalizeText(item.name).includes(term) || normalizeText(item.description).includes(term)
    );
  }, [searchTerm]);

  // Construir resultados de acciones
  const actionResults = useMemo(() => {
    if (!searchTerm) return actionItems;
    const term = normalizeText(searchTerm);
    return actionItems.filter(
      item => normalizeText(item.name).includes(term) || normalizeText(item.description).includes(term)
    );
  }, [searchTerm]);

  // Todos los resultados planos
  const allResults = useMemo(() => {
    const navResults = navigationItems.map((item, idx) => ({
      ...item,
      id: `nav-${idx}`,
      action: () => {
        const route = navigationRoutes[item.name];
        if (route) navigate(route);
        close();
      },
    }));
    
    const actResults = actionItems.map((item, idx) => ({
      ...item,
      id: `act-${idx}`,
      action: () => {
        const handler = actionHandlers[item.name];
        if (handler) handler();
        if (item.name === "Cerrar Sesión") signOut();
        close();
      },
    }));

    const entResults = entityResults;

    return [...navResults, ...actResults, ...entResults];
  }, [navigationItems, actionItems, entityResults, navigate, close, signOut]);

  // Filtrar resultados basados en búsqueda
  const filteredNavigation = useMemo(() => {
    if (!searchTerm) return navigationResults;
    const term = normalizeText(searchTerm);
    return navigationResults.filter(
      item => normalizeText(item.name).includes(term) || normalizeText(item.description).includes(term)
    );
  }, [searchTerm, navigationResults]);

  const filteredActions = useMemo(() => {
    if (!searchTerm) return actionResults;
    const term = normalizeText(searchTerm);
    return actionResults.filter(
      item => normalizeText(item.name).includes(term) || normalizeText(item.description).includes(term)
    );
  }, [searchTerm, actionResults]);

  // Reset selección cuando cambian los resultados
  useEffect(() => {
    setSelectedIndex(0);
  }, [allResults.length]);

  // Manejar teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (allResults[selectedIndex]) {
            allResults[selectedIndex].action();
          }
          break;
        case "Escape":
          e.preventDefault();
          close();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allResults, selectedIndex, close]);

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Focus en input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Cerrar al hacer click fuera
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="w-full max-w-2xl bg-white dark:bg-bg-dark rounded-2xl shadow-2xl overflow-hidden border border-border-light dark:border-white/10"
        >
          {/* Input de búsqueda */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border-light dark:border-white/10">
            <SearchIcon className="w-5 h-5 text-text-tertiary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar páginas, acciones, estudiantes..."
              className="flex-1 bg-transparent text-lg text-text-primary dark:text-white placeholder:text-text-tertiary focus:outline-none"
            />
            <kbd className="px-2 py-1 text-xs font-medium text-text-tertiary bg-gray-100 dark:bg-white/10 rounded">
              ESC
            </kbd>
          </div>

          {/* Resultados */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
            {/* Navegación */}
            {filteredNavigation.length > 0 && (
              <div className="px-2 py-1">
                <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Navegación
                </div>
                {filteredNavigation.map((item, idx) => {
                  const resultIndex = idx;
                  const isSelected = selectedIndex === resultIndex;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        const route = navigationRoutes[item.name];
                        if (route) navigate(route);
                        close();
                      }}
                      onMouseEnter={() => setSelectedIndex(resultIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300"
                          : "text-text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className={`shrink-0 ${isSelected ? "text-brand-500" : "text-text-tertiary"}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 font-medium">{item.name}</span>
                      <span className="text-xs text-text-tertiary">{item.description}</span>
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-white/10 rounded">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Acciones Rápidas */}
            {filteredActions.length > 0 && (
              <div className="px-2 py-1 mt-2">
                <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Acciones Rápidas
                </div>
                {filteredActions.map((item, idx) => {
                  const resultIndex = filteredNavigation.length + idx;
                  const isSelected = selectedIndex === resultIndex;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        const handler = actionHandlers[item.name];
                        if (handler) handler();
                        if (item.name === "Cerrar Sesión") signOut();
                        close();
                      }}
                      onMouseEnter={() => setSelectedIndex(resultIndex)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300"
                          : "text-text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className={`shrink-0 ${isSelected ? "text-brand-500" : "text-text-tertiary"}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 font-medium">{item.name}</span>
                      <span className="text-xs text-text-tertiary">{item.description}</span>
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-white/10 rounded">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sin resultados */}
            {allResults.length === 0 && (
              <div className="px-4 py-8 text-center text-text-tertiary">
                <p>No se encontraron resultados para "{searchTerm}"</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-light dark:border-white/10 text-xs text-text-tertiary">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/10 rounded">↑↓</kbd>
                Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/10 rounded">↵</kbd>
                Seleccionar
              </span>
            </div>
            <span>UNEFA Dashboard</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
