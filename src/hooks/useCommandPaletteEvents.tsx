/**
 * @file useCommandPaletteEvents.tsx
 * @description Hook que escucha los eventos globales del CommandPalette
 * y navega a la página correspondiente con el state necesario para abrir el modal.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * Eventos globales dispatcheados por el CommandPalette
 */
export type CommandPaletteEvent =
  | "app:openStudentModal"
  | "app:openTutorModal"
  | "app:openInstitutionModal"
  | "app:openCareerModal"
  | "app:openPreEnrollmentModal"
  | "app:openEnrollmentModal"
  | "app:logout";

/**
 * Mapeo de eventos globales a rutas y state de navegación
 */
const eventToNavigation: Record<CommandPaletteEvent, { path: string; state: Record<string, unknown> }> = {
  "app:openStudentModal": {
    path: "/students",
    state: { openCreateModal: true },
  },
  "app:openTutorModal": {
    path: "/tutors",
    state: { openCreateModal: true },
  },
  "app:openInstitutionModal": {
    path: "/institutions",
    state: { openCreateModal: true },
  },
  "app:openCareerModal": {
    path: "/careers",
    state: { openCreateModal: true },
  },
  "app:openPreEnrollmentModal": {
    path: "/pre-enrollment",
    state: { openCreateModal: true },
  },
  "app:openEnrollmentModal": {
    path: "/enrollment",
    state: { openCreateModal: true },
  },
  "app:logout": {
    path: "/signin",
    state: {},
  },
};

/**
 * Hook personalizado que escucha los eventos del CommandPalette
 * y navega a la página correspondiente.
 * 
 * @example
 * ```tsx
 * function App() {
 *   useCommandPaletteEvents();
 *   return <Routes>...</Routes>;
 * }
 * ```
 */
export function useCommandPaletteEvents(): void {
  const navigate = useNavigate();

  useEffect(() => {
    /**
     * Manejador de eventos que navega a la ruta correspondiente
     * cuando se dispatchea un evento del CommandPalette.
     */
    const handleCommandPaletteEvent = (event: Event): void => {
      const eventName = event.type as CommandPaletteEvent;
      const navigation = eventToNavigation[eventName];

      if (navigation) {
        if (eventName === "app:logout") {
          // El logout ya se maneja en el CommandPalette, solo navegamos
          navigate(navigation.path);
        } else {
          navigate(navigation.path, { state: navigation.state });
        }
      }
    };

    // Registrar todos los eventos
    const events = Object.keys(eventToNavigation) as CommandPaletteEvent[];
    
    events.forEach((eventName) => {
      window.addEventListener(eventName, handleCommandPaletteEvent);
    });

    // Limpieza: remover todos los event listeners
    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleCommandPaletteEvent);
      });
    };
  }, [navigate]);
}

export default useCommandPaletteEvents;